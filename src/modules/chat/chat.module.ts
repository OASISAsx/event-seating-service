import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { RedisChatService } from './redis-chat.service';
import { ChatController } from './chat.controller';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [ChatGateway, ChatService, RedisChatService, Logger],
  exports: [ChatGateway, ChatService, RedisChatService],
  controllers: [ChatController],
})
export class ChatModule {}
