import { IsString, IsNumber, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum EventStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export class CreateEventDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  location: string;

  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @Type(() => Date)
  @IsDate()
  endDate: Date;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  seatsPerRow: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  totalSeats: number;
}
