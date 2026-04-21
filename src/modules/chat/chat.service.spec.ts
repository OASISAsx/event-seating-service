import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { RedisChatService } from './redis-chat.service';
import { PrismaService } from '../prisma/prisma.service';
import type { ConfirmChannel } from 'amqplib';
import * as amqplib from 'amqplib';

jest.mock('amqplib', () => ({
  connect: jest.fn(),
}));

jest.mock('./chat.gateway');

describe('ChatService', () => {
  let service: ChatService;

  const mockConfigService = {
    get: jest.fn().mockReturnValue('amqp://localhost:5672'),
  };

  const mockChatGateway = {
    receiveMessage: jest.fn(),
  };

  const mockRedisChatService = {
    storeMessage: jest.fn(),
    getMessageCount: jest.fn().mockResolvedValue(0),
    getRoomMessages: jest.fn().mockResolvedValue([]),
  };

  const mockPrismaService = {
    admin: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  const mockChannel = {
    assertExchange: jest.fn(),
    assertQueue: jest.fn(),
    bindQueue: jest.fn(),
    consume: jest.fn(),
    publish: jest.fn(),
    close: jest.fn(),
    ack: jest.fn(),
    nack: jest.fn(),
  } as jest.Mocked<ConfirmChannel>;

  const mockConnection = {
    on: jest.fn(),
    createConfirmChannel: jest.fn().mockResolvedValue(mockChannel),
    close: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // const amqplib = require('amqplib');
    (amqplib.connect as jest.Mock).mockResolvedValue(mockConnection);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: ChatGateway,
          useValue: mockChatGateway,
        },
        {
          provide: RedisChatService,
          useValue: mockRedisChatService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should connect to RabbitMQ', async () => {
      await service.onModuleInit();

      // const amqplib = require('amqplib');
      expect(amqplib.connect).toHaveBeenCalledWith('amqp://localhost:5672');
      expect(mockConnection.createConfirmChannel).toHaveBeenCalled();
    });
  });

  describe('onModuleDestroy', () => {
    it('should close RabbitMQ connection', async () => {
      await service.onModuleInit();
      await service.onModuleDestroy();

      expect(mockChannel.close.mock.calls).toHaveLength(1);
      expect(mockConnection.close.mock.calls).toHaveLength(1);
    });
  });

  describe('publishMessage', () => {
    const testRoomId = 'test-room-123';
    const testMessage = {
      id: 'msg-123',
      roomId: testRoomId,
      senderId: 'user-123',
      content: 'Hello World',
      timestamp: new Date(),
      type: 'message' as const,
    };

    beforeEach(async () => {
      await service.onModuleInit();
      (service as any).isConnected = true;
      (service as any).channel = mockChannel;
      mockRedisChatService.storeMessage.mockResolvedValue(undefined);
    });

    it('should publish message to RabbitMQ', async () => {
      mockChannel.publish.mockResolvedValue(true);

      await service.publishMessage(testRoomId, testMessage, 'message');

      expect(mockChannel.publish.mock.calls).toHaveLength(1);
      const [exchange, routingKey, payload, options] =
        mockChannel.publish.mock.calls[0];
      expect(exchange).toBe('chat.messages');
      expect(routingKey).toBe(`room.${testRoomId}`);
      expect(payload).toEqual(expect.any(Buffer));
      expect(options).toEqual(
        expect.objectContaining({
          persistent: true,
          contentType: 'application/json',
        }),
      );
      expect(mockRedisChatService.storeMessage).toHaveBeenCalledWith(
        testMessage,
      );
    });

    it('should not publish if channel is not available', async () => {
      (service as any).channel = null;

      await service.publishMessage(testRoomId, testMessage, 'message');

      expect(mockChannel.publish.mock.calls).toHaveLength(0);
    });

    it('should handle publish failure', async () => {
      mockChannel.publish.mockResolvedValue(false);

      await service.publishMessage(testRoomId, testMessage, 'message');

      expect(mockChannel.publish.mock.calls).toHaveLength(1);
    });
  });

  describe('getRoomStats', () => {
    it('should return room statistics', async () => {
      const stats = await service.getRoomStats('test-room');

      expect(stats).toEqual({ messageCount: 0 });
    });
  });

  describe('getMessageHistory', () => {
    it('should return messages with admin participants', async () => {
      mockRedisChatService.getRoomMessages.mockResolvedValue([
        {
          id: 'msg-1',
          roomId: 'room-1',
          senderId: 'admin-1',
          content: 'Hello',
          timestamp: new Date(),
          type: 'message',
        },
        {
          id: 'msg-2',
          roomId: 'room-1',
          senderId: 'admin-1',
          content: 'How are you?',
          timestamp: new Date(),
          type: 'message',
        },
        {
          id: 'msg-3',
          roomId: 'room-1',
          senderId: 'socket-123',
          content: 'Hi',
          timestamp: new Date(),
          type: 'message',
        },
      ]);
      mockPrismaService.admin.findMany.mockResolvedValue([
        {
          id: 'admin-1',
          username: 'admin',
        },
      ]);

      const result = await service.getMessageHistory('room-1', 50);

      expect(mockPrismaService.admin.findMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ['admin-1', 'socket-123'],
          },
        },
        select: {
          id: true,
          username: true,
        },
      });
      expect(result).toEqual({
        messages: expect.any(Array),
        count: 3,
        participants: [
          {
            senderId: 'admin-1',
            username: 'admin',
            messageCount: 2,
          },
          {
            senderId: 'socket-123',
            username: null,
            messageCount: 1,
          },
        ],
      });
    });
  });

  describe('RabbitMQ connection handling', () => {
    it('should schedule reconnect on connection close', async () => {
      jest.useFakeTimers();

      await service.onModuleInit();

      const closeHandler = mockConnection.on.mock.calls.find(
        (call) => call[0] === 'close',
      )?.[1];

      expect(closeHandler).toBeDefined();
      closeHandler();

      jest.advanceTimersByTime(5000);

      // const amqplib = require('amqplib');
      expect(amqplib.connect).toHaveBeenCalledTimes(2);

      jest.useRealTimers();
    });
  });

  describe('message consumption', () => {
    it('should skip messages published by the same service instance', async () => {
      await service.onModuleInit();

      const consumeHandler = mockChannel.consume.mock.calls[0][1];
      const instanceId = (service as any).instanceId;

      await consumeHandler({
        content: Buffer.from(
          JSON.stringify({
            roomId: 'room-1',
            data: { id: 'msg-1', roomId: 'room-1' },
            type: 'message',
            originInstanceId: instanceId,
          }),
        ),
      });

      expect(mockChatGateway.receiveMessage).not.toHaveBeenCalled();
      expect(mockChannel.ack.mock.calls).toHaveLength(1);
    });
  });
});
