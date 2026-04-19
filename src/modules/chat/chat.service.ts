import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { connect } from 'amqplib';
import { ChatGateway } from './chat.gateway';
import {
  ChatMessageDto,
  ChatMessageHistoryDto,
  ChatParticipantDto,
} from './dto/chat.dto';
import { RedisChatService } from './redis-chat.service';
import {
  RabbitMqConfirmChannel,
  RabbitMqConnection,
  RabbitMqConsumeMessage,
  RabbitMQMessage,
} from 'src/types/rabbitMq.type';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ChatService.name);
  private rabbitmqConnection: RabbitMqConnection | null = null;
  private channel: RabbitMqConfirmChannel | null = null;
  private readonly exchangeName = 'chat.messages';
  private readonly queuePrefix = 'chat.room.';
  private isConnected = false;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
    private readonly redisChatService: RedisChatService,
    private readonly prismaService: PrismaService,
  ) {}

  async onModuleInit() {
    await this.connectRabbitMQ();
  }

  async onModuleDestroy() {
    await this.closeRabbitMQ();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
  }

  private async connectRabbitMQ() {
    if (this.isConnected) {
      return;
    }

    try {
      const rabbitmqUrl =
        this.configService.get<string>('RABBITMQ_URL') ||
        'amqp://localhost:5672';

      this.logger.log(`Connecting to RabbitMQ at ${rabbitmqUrl}`);

      const rabbitmqConnection: RabbitMqConnection = await connect(rabbitmqUrl);
      this.rabbitmqConnection = rabbitmqConnection;
      this.channel = await this.rabbitmqConnection.createConfirmChannel();

      this.isConnected = true;

      // Setup exchange
      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true,
      });

      this.logger.log('Successfully connected to RabbitMQ');

      // Start consuming messages
      await this.startConsuming();

      // Handle connection close
      this.rabbitmqConnection.on('close', () => {
        this.isConnected = false;
        this.logger.warn('RabbitMQ connection closed');
        this.scheduleReconnect();
      });

      this.rabbitmqConnection.on('error', (error: Error) => {
        this.logger.error('RabbitMQ connection error:', error);
      });
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      void this.connectRabbitMQ();
    }, 5000);
  }

  private async closeRabbitMQ() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.rabbitmqConnection) {
        await this.rabbitmqConnection.close();
        this.rabbitmqConnection = null;
      }
      this.isConnected = false;
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection:', error);
    }
  }

  async publishMessage(
    roomId: string,
    message: ChatMessageDto,
    type: 'message' | 'join' | 'leave',
  ): Promise<void> {
    if (!this.channel || !this.isConnected) {
      this.logger.warn('RabbitMQ channel not available, message not published');
      return;
    }

    try {
      const routingKey = `room.${roomId}`;
      const payload: RabbitMQMessage = {
        roomId,
        data: message,
        type,
      };

      // Store message in Redis for history
      await this.redisChatService.storeMessage(message);

      await this.channel.publish(
        this.exchangeName,
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        {
          persistent: true,
          contentType: 'application/json',
          timestamp: Date.now(),
        },
      );

      this.logger.debug(`Message published to room ${roomId}`);
    } catch (error) {
      this.logger.error('Error publishing message:', error);
    }
  }

  private async startConsuming() {
    if (!this.channel) {
      return;
    }

    try {
      // Create a queue for this service instance
      const queueName = `${this.queuePrefix}service.${process.pid}`;

      await this.channel.assertQueue(queueName, {
        durable: true,
        autoDelete: true, // Auto-delete when service stops
      });

      // Bind to all room topics
      await this.channel.bindQueue(queueName, this.exchangeName, 'room.#');

      this.logger.log(`Started consuming from queue: ${queueName}`);

      // Consume messages
      await this.channel.consume(
        queueName,
        async (msg: RabbitMqConsumeMessage | null) => {
          if (!msg) return;

          try {
            const message: RabbitMQMessage = JSON.parse(msg.content.toString());

            // Validate message structure before processing
            if (!message.roomId || !message.data) {
              this.logger.error(
                'Invalid message format received from RabbitMQ:',
                message,
              );
              // Reject without requeue since it's a malformed message
              this.channel!.nack(msg, false, false);
              return;
            }

            this.logger.debug(`Received message for room ${message.roomId}`);

            // Forward to gateway to broadcast to clients
            await this.chatGateway.receiveMessage(message);

            // Acknowledge message only after successful processing
            this.channel!.ack(msg);
          } catch (error) {
            this.logger.error('Error processing message:', error);
            // Reject with requeue to allow retry for transient errors
            this.channel!.nack(msg, false, true);
          }
        },
        {
          noAck: false,
        },
      );
    } catch (error) {
      this.logger.error('Error starting consumer:', error);
    }
  }

  // Get room statistics (optional utility method)
  async getRoomStats(roomId: string): Promise<{ messageCount: number }> {
    const messageCount = await this.redisChatService.getMessageCount(roomId);
    return {
      messageCount,
    };
  }

  // Get message history for a room
  async getMessageHistory(
    roomId: string,
    limit?: number,
  ): Promise<ChatMessageHistoryDto> {
    const messages = await this.redisChatService.getRoomMessages(roomId, limit);
    const participants = await this.getRoomParticipants(messages);

    return {
      messages,
      count: messages.length,
      participants,
    };
  }

  private async getRoomParticipants(
    messages: ChatMessageDto[],
  ): Promise<ChatParticipantDto[]> {
    const participantMessageCounts = new Map<string, number>();

    for (const message of messages) {
      participantMessageCounts.set(
        message.senderId,
        (participantMessageCounts.get(message.senderId) ?? 0) + 1,
      );
    }

    const senderIds = [...participantMessageCounts.keys()];
    if (senderIds.length === 0) {
      return [];
    }

    const admins = await this.prismaService.admin.findMany({
      where: {
        id: {
          in: senderIds,
        },
      },
      select: {
        id: true,
        username: true,
      },
    });

    const adminById = new Map(
      admins.map((admin) => [admin.id, admin.username] as const),
    );

    return senderIds.map((senderId) => ({
      senderId,
      username: adminById.get(senderId) ?? null,
      messageCount: participantMessageCounts.get(senderId) ?? 0,
    }));
  }
}
