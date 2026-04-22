import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto, JoinRoomDto } from './dto/chat.dto';
import { v4 as uuidv4 } from 'uuid';
import { corsOptions, socketIoPath } from 'src/common/utils/cors.util';

@WebSocketGateway({
  cors: corsOptions,
  namespace: 'chat',
  path: socketIoPath,
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // Initialize user session
    client.data.userId = client.handshake.query.userId as string;
    client.data.rooms = new Set<string>();
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    // Notify rooms about user leaving
    const rooms = client.data.rooms as Set<string>;
    for (const roomId of rooms) {
      await this.chatService.publishMessage(
        roomId,
        {
          id: uuidv4(),
          roomId,
          senderId: client.data.userId || client.id,
          content: 'User left the chat',
          timestamp: new Date(),
          type: 'leave',
        },
        'leave',
      );

      // Broadcast to room
      this.server.to(roomId).emit('user-left', {
        userId: client.data.userId || client.id,
        roomId,
      });
    }
  }

  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomDto,
  ) {
    try {
      const { roomId, userId } = payload;

      // Join Socket.IO room
      await client.join(roomId);

      // Track room membership
      if (!client.data.rooms) {
        client.data.rooms = new Set();
      }
      client.data.rooms.add(roomId);

      // Publish join event to RabbitMQ
      await this.chatService.publishMessage(
        roomId,
        {
          id: uuidv4(),
          roomId,
          senderId: userId || client.id,
          content: 'User joined the chat',
          timestamp: new Date(),
          type: 'join',
        },
        'join',
      );

      // Broadcast to room
      client.to(roomId).emit('user-joined', {
        userId: userId || client.id,
        roomId,
        timestamp: new Date(),
      });

      this.logger.log(`Client ${client.id} joined room: ${roomId}`);

      return {
        status: 'success',
        message: `Joined room: ${roomId}`,
      };
    } catch (error) {
      this.logger.error('Error joining room:', error);
      return {
        status: 'error',
        message: 'Failed to join room',
      };
    }
  }

  @SubscribeMessage('leave-room')
  async handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    try {
      const { roomId } = payload;

      // Leave Socket.IO room
      await client.leave(roomId);

      // Remove from tracked rooms
      if (client.data.rooms) {
        client.data.rooms.delete(roomId);
      }

      // Publish leave event to RabbitMQ
      await this.chatService.publishMessage(
        roomId,
        {
          id: uuidv4(),
          roomId,
          senderId: client.data.userId || client.id,
          content: 'User left the chat',
          timestamp: new Date(),
          type: 'leave',
        },
        'leave',
      );

      // Broadcast to room
      client.to(roomId).emit('user-left', {
        userId: client.data.userId || client.id,
        roomId,
        timestamp: new Date(),
      });

      this.logger.log(`Client ${client.id} left room: ${roomId}`);

      return {
        status: 'success',
        message: `Left room: ${roomId}`,
      };
    } catch (error) {
      this.logger.error('Error leaving room:', error);
      return {
        status: 'error',
        message: 'Failed to leave room',
      };
    }
  }

  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessageDto,
  ) {
    try {
      const { roomId, content, senderId } = payload;

      const message = {
        id: uuidv4(),
        roomId,
        senderId: senderId || client.data.userId || client.id,
        content,
        timestamp: new Date(),
        type: 'message' as const,
      };

      // Publish message to RabbitMQ
      await this.chatService.publishMessage(roomId, message, 'message');

      // Broadcast to room (including sender)
      this.server.to(roomId).emit('new-message', message);

      this.logger.log(`Message sent to room ${roomId}: ${content}`);

      return {
        status: 'success',
        message: 'Message sent',
        data: message,
      };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return {
        status: 'error',
        message: 'Failed to send message',
      };
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; isTyping: boolean },
  ) {
    const { roomId, isTyping } = payload;

    // Broadcast typing status to room (excluding sender)
    client.to(roomId).emit('user-typing', {
      userId: client.data.userId || client.id,
      roomId,
      isTyping,
      timestamp: new Date(),
    });
  }

  // Method to receive messages from RabbitMQ
  async receiveMessage(message: any) {
    try {
      const { roomId, data } = message;
      this.server.to(roomId).emit('new-message', data);
      this.logger.log(`Message delivered to room ${roomId}`);
    } catch (error) {
      this.logger.error('Error delivering message:', error);
    }
  }
}
