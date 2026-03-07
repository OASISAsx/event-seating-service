import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateRegistrationDto } from './create-registration.dto';
import { IsOptional, IsString } from 'class-validator';
// import { IsOptional, IsString } from 'class-validator';

export class UpdateRegistrationDto extends PartialType(
  OmitType(CreateRegistrationDto, [
    'phone',
    'eventId',
    'firstName',
    'lastName',
    'email',
  ] as const),
) {
  @IsString()
  @IsOptional()
  seatNumber?: number;
  @IsOptional()
  @IsString()
  seatId?: string | null;
}
