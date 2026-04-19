import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { ChatMessageDto } from './dto/chat.dto';

@Injectable()
export class RedisChatService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisChatService.name);
  private redisClient: Redis | null = null;
  private readonly messageHistoryKey = 'chat:messages:';
  private readonly maxMessagesPerRoom: number;

  constructor(private readonly configService: ConfigService) {
    this.maxMessagesPerRoom = this.configService.get<number>(
      'REDIS_MAX_MESSAGES',
      1000,
    );
  }

  async onModuleInit() {
    await this.connectRedis();
  }

  async onModuleDestroy() {
    await this.disconnectRedis();
  }

  private async connectRedis() {
    try {
      const redisUrl =
        this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';

      this.redisClient = new Redis(redisUrl, {
        retryStrategy: (times) => {
          // Stop retrying after 3 attempts
          if (times > 3) {
            return null;
          }
          return Math.min(times * 50, 500);
        },
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        enableOfflineQueue: false, // Don't queue commands when offline
        connectTimeout: 5000, // 5 second timeout
      });

      let errorLogged = false;

      this.redisClient.on('connect', () => {
        this.logger.log(`Connected to Redis at ${redisUrl}`);
        errorLogged = false;
      });

      this.redisClient.on('error', (error) => {
        // Only log the first error to avoid spam
        if (!errorLogged) {
          this.logger.warn(
            `Redis unavailable: ${error.message}. Service will run without chat history.`,
          );
          errorLogged = true;
        }
      });

      // Try to connect with timeout
      try {
        await Promise.race([
          this.redisClient.connect(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timeout')), 5000),
          ),
        ]);
        await this.redisClient.ping();
        this.logger.log('✓ Redis connected and ready');
      } catch (error: any) {
        this.logger.warn(`Redis connection error: ${error.message}`);
        errorLogged = true;
        this.logger.warn(
          '✗ Redis not available. Chat history will not be persisted.',
        );

        if (this.redisClient) {
          this.redisClient.disconnect(false);
        }
        this.redisClient = null;
      }
    } catch (error: any) {
      this.logger.warn(
        `Redis initialization failed: ${error.message}. Running without Redis.`,
      );
      if (this.redisClient) {
        this.redisClient.disconnect(false);
      }
      this.redisClient = null;
    }
  }

  private async disconnectRedis() {
    if (this.redisClient) {
      try {
        await this.redisClient.quit();
        this.logger.log('Redis connection closed');
      } catch (error: any) {
        // Silently handle disconnect errors
        this.logger.warn(`Error disconnecting Redis: ${error.message}`);
        this.redisClient.disconnect(false);
      }
    }
  }

  /**
   * Store a chat message in Redis for a specific room
   * Uses Redis LIST to store messages with automatic trimming
   */
  async storeMessage(message: ChatMessageDto): Promise<void> {
    if (!this.redisClient) {
      this.logger.warn('Redis client not available, message not stored');
      return;
    }

    try {
      const key = `${this.messageHistoryKey}${message.roomId}`;
      const messageJson = JSON.stringify(message);

      // Push message to the end of the list
      await this.redisClient.rpush(key, messageJson);

      // Trim the list to keep only the last N messages
      await this.redisClient.ltrim(key, -this.maxMessagesPerRoom, -1);

      // Set expiry on the key (24 hours)
      await this.redisClient.expire(key, 86400);

      this.logger.debug(
        `Message stored for room ${message.roomId}, total messages: ${await this.redisClient.llen(key)}`,
      );
    } catch (error) {
      this.logger.error('Error storing message in Redis:', error);
    }
  }

  /**
   * Retrieve message history for a specific room
   * Returns messages in chronological order (oldest first)
   */
  async getRoomMessages(
    roomId: string,
    limit?: number,
  ): Promise<ChatMessageDto[]> {
    if (!this.redisClient) {
      this.logger.warn('Redis client not available');
      return [];
    }

    try {
      const key = `${this.messageHistoryKey}${roomId}`;
      const count = limit || this.maxMessagesPerRoom;

      // Get the last N messages
      const messages = await this.redisClient.lrange(key, -count, -1);

      // Parse JSON strings back to objects
      return messages.map((msg) => JSON.parse(msg));
    } catch (error) {
      this.logger.error('Error retrieving messages from Redis:', error);
      return [];
    }
  }

  /**
   * Get message count for a specific room
   */
  async getMessageCount(roomId: string): Promise<number> {
    if (!this.redisClient) {
      return 0;
    }

    try {
      const key = `${this.messageHistoryKey}${roomId}`;
      return await this.redisClient.llen(key);
    } catch (error) {
      this.logger.error('Error getting message count:', error);
      return 0;
    }
  }

  /**
   * Clear message history for a specific room
   */
  async clearRoomMessages(roomId: string): Promise<void> {
    if (!this.redisClient) {
      return;
    }

    try {
      const key = `${this.messageHistoryKey}${roomId}`;
      await this.redisClient.del(key);
      this.logger.log(`Cleared message history for room ${roomId}`);
    } catch (error) {
      this.logger.error('Error clearing room messages:', error);
    }
  }

  /**
   * Get all room IDs that have message history
   */
  async getRoomsWithMessages(): Promise<string[]> {
    if (!this.redisClient) {
      return [];
    }

    try {
      const keys = await this.redisClient.keys(`${this.messageHistoryKey}*`);
      return keys.map((key) => key.replace(this.messageHistoryKey, ''));
    } catch (error) {
      this.logger.error('Error getting rooms with messages:', error);
      return [];
    }
  }
}
