import { IsEmail, IsPhoneNumber, IsString } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  firstName: string;
  @IsString()
  lastName: string;
  @IsPhoneNumber('TH')
  phone: string;
  @IsEmail()
  email: string;

  @IsString()
  eventId?: string;
}
