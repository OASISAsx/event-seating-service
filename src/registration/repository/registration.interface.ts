import {
  PaginatedResponse,
  PaginationDto,
} from 'src/common/utils/dto/pagination.dto';
import { CreateRegistrationDto } from '../dto/create-registration.dto';
import { RegistrationEntity } from '../dto/RegistrationEntity';
import { UpdateRegistrationDto } from '../dto/update-registration.dto';

export interface IRegistrationRepository {
  create(
    createRegistrationDto: CreateRegistrationDto,
  ): Promise<CreateRegistrationDto>;
  findAll(query: PaginationDto): Promise<PaginatedResponse<RegistrationEntity>>;
  findOne(id: string): Promise<RegistrationEntity>;
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
