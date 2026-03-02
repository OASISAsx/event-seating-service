import { CreateRegistrationDto } from '../dto/create-registration.dto';
import { RegistrationEntity } from '../dto/RegistrationEntity';
import { UpdateRegistrationDto } from '../dto/update-registration.dto';

export interface IRegistrationRepository {
  create(
    createRegistrationDto: CreateRegistrationDto,
  ): Promise<CreateRegistrationDto>;
  findByPhone(phone: string): Promise<RegistrationEntity | null>;
  findName(
    firstName: string,
    lastName: string,
  ): Promise<RegistrationEntity | null>;
  update(
    id: string,
    updateRegistrationDto: UpdateRegistrationDto,
  ): Promise<RegistrationEntity>;
}
