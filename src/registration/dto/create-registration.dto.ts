import { IsNumber, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRegistrationDto {
  @IsString()
  firstName: string;
  @IsString()
  lastName: string;
  @IsPhoneNumber('TH')
  phone: string;
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  seatNumber?: number;
  @IsString()
  eventId?: string;
  @IsOptional()
  @IsString()
  seatId?: string | null;
}
