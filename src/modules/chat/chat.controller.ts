import { Controller, Get, Param, Query, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageHistoryDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  /**
   * Get message history for a specific room
   * GET /chat/rooms/:roomId/messages?limit=50
   */
  @Get('rooms/:roomId/messages')
  async getMessageHistory(
    @Param('roomId') roomId: string,
    @Query('limit') limit?: number,
  ): Promise<ChatMessageHistoryDto> {
    try {
      const maxMessages = limit ? parseInt(limit.toString(), 10) : 50;
      return await this.chatService.getMessageHistory(roomId, maxMessages);
    } catch (error) {
      this.logger.error(
        `Error retrieving message history for room ${roomId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Get message count for a specific room
   * GET /chat/rooms/:roomId/stats
   */
  @Get('rooms/:roomId/stats')
  async getRoomStats(
    @Param('roomId') roomId: string,
  ): Promise<{ messageCount: number }> {
    try {
      return await this.chatService.getRoomStats(roomId);
    } catch (error) {
      this.logger.error(`Error retrieving stats for room ${roomId}:`, error);
      throw error;
    }
  }
}
