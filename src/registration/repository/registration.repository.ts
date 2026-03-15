// prisma-registration.repository.ts
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateRegistrationDto } from '../dto/create-registration.dto';
import { IRegistrationRepository } from './registration.interface';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RegistrationEntity } from '../dto/RegistrationEntity';
import { UpdateRegistrationDto } from '../dto/update-registration.dto';
import {
  PaginatedResponse,
  PaginationDto,
} from 'src/common/utils/dto/pagination.dto';
import {
  buildPaginationMeta,
  getPagination,
} from 'src/common/utils/paginate.util';

@Injectable()
export class PrismaRegistrationRepository implements IRegistrationRepository {
  constructor(private prisma: PrismaService) {}
  async findOne(id: string): Promise<RegistrationEntity> {
    const getOne = await this.prisma.registration.findFirst({
      where: { id },
      include: {
        seat: true,
      },
    });
    console.log(getOne, 'getOne');
    if (!getOne) {
      throw new BadRequestException(`Registration with ID ${id} not found`);
    }
    return getOne;
  }
  async findAll(
    query: PaginationDto,
  ): Promise<PaginatedResponse<RegistrationEntity>> {
    const { skip, take, page, limit } = getPagination(query);

    const [data, total] = await this.prisma.$transaction([
      this.prisma.registration.findMany({
        include: {
          event: {
            select: {
              id: true,
              name: true,
              description: true,
              seats: true,
            },
          },
        },
        skip,
        take,
        orderBy: { id: 'desc' },
      }),

      this.prisma.registration.count(),
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, page, limit),
    };
  }
  async update(
    id: string,
    data: UpdateRegistrationDto,
  ): Promise<RegistrationEntity> {
    const { ...updateData } = data;
    const currentDate = new Date();
    if (updateData.seatId) {
      const findSeat = await this.prisma.seat.update({
        where: { id: updateData.seatId },
        data: { isBooked: true, seatAssignedAt: currentDate },
      });

      if (!findSeat) {
        throw new NotFoundException('ไม่พบที่นั่งที่ระบุ');
      }
    }

    const updatedResult = await this.prisma.registration.update({
      where: { id },
      data: {
        ...updateData,
        seatId: updateData.seatId ?? undefined,
      },
    });

    return updatedResult as RegistrationEntity;
  }
  async findName(
    firstName: string,
    lastName: string,
  ): Promise<RegistrationEntity | null> {
    return await this.prisma.registration.findFirst({
      where: { firstName: firstName, lastName: lastName },
    });
  }
  async findByPhone(phone: string): Promise<RegistrationEntity | null> {
    return await this.prisma.registration.findFirst({
      where: { phone },
    });
  }

  async create(data: CreateRegistrationDto): Promise<any> {
    return this.prisma.registration.create({ data });
  }
}
