import { IsPhoneNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRegistrationDto {
  @IsString()
  firstName: string;
  @IsString()
  lastName: string;
  @IsPhoneNumber('TH')
  phone: string;
  @Type(() => Number)
  @IsString()
  eventId?: string;
}
