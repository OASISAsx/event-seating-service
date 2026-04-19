import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  senderId?: string;
}

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId: string;

  @IsString()
  @IsOptional()
  userId?: string;
}

export class ChatMessageDto {
  id: string;
  roomId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'join' | 'leave';
}

export class ChatParticipantDto {
  senderId: string;
  username: string | null;
  messageCount: number;
}

export class ChatMessageHistoryDto {
  messages: ChatMessageDto[];
  count: number;
  participants: ChatParticipantDto[];
}
