import { ChatMessageDto } from 'src/modules/chat/dto/chat.dto';

export interface RabbitMQMessage {
  roomId: string;
  data: ChatMessageDto;
  type: 'message' | 'join' | 'leave';
}

export interface RabbitMqConsumeMessage {
  content: Buffer;
}

export interface RabbitMqConfirmChannel {
  assertExchange(
    exchange: string,
    type: string,
    options?: { durable?: boolean },
  ): Promise<unknown>;
  assertQueue(
    queue: string,
    options?: { durable?: boolean; autoDelete?: boolean },
  ): Promise<unknown>;
  bindQueue(queue: string, source: string, pattern: string): Promise<unknown>;
  consume(
    queue: string,
    onMessage: (msg: RabbitMqConsumeMessage | null) => unknown,
    options?: { noAck?: boolean },
  ): Promise<unknown>;
  publish(
    exchange: string,
    routingKey: string,
    content: Buffer,
    options?: {
      persistent?: boolean;
      contentType?: string;
      timestamp?: number;
    },
  ): boolean | Promise<boolean>;
  ack(message: RabbitMqConsumeMessage): void;
  nack(
    message: RabbitMqConsumeMessage,
    allUpTo?: boolean,
    requeue?: boolean,
  ): void;
  close(): Promise<void>;
}

export interface RabbitMqConnection {
  createConfirmChannel(): Promise<RabbitMqConfirmChannel>;
  close(): Promise<void>;
  on(event: 'close', listener: () => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
}
