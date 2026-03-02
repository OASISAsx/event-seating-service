// prisma-registration.repository.ts
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateRegistrationDto } from '../dto/create-registration.dto';
import { IRegistrationRepository } from './registration.repository.interface';
import { Injectable, NotFoundException } from '@nestjs/common';
import { RegistrationEntity } from '../dto/RegistrationEntity';
import { UpdateRegistrationDto } from '../dto/update-registration.dto';

@Injectable()
export class PrismaRegistrationRepository implements IRegistrationRepository {
  constructor(private prisma: PrismaService) {}
  async update(
    id: string,
    data: UpdateRegistrationDto,
  ): Promise<RegistrationEntity> {
    const { ...updateData } = data;

    if (updateData.seatId) {
      const findSeat = await this.prisma.seat.findUnique({
        where: { id: updateData.seatId },
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
    console.log(data, 'test');

    return this.prisma.registration.create({ data });
  }
}
