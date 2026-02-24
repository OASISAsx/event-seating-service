import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class RegistrationService {
  constructor(private prisma: PrismaService) {}
  create(createRegistrationDto: CreateRegistrationDto) {
    return this.prisma.$transaction(async (tx) => {
      try {
        const existing = await tx.registration.findFirst({
          where: {
            firstName: createRegistrationDto.firstName,
            lastName: createRegistrationDto.lastName,
          },
        });
        if (existing) {
          return { massage: 'ท่านได้ลงชื่อในระบบแล้ว' };
        }

        const create = await tx.registration.create({
          data: createRegistrationDto,
        });

        return {
          create,
        };
      } catch (error) {
        if (error) throw new BadRequestException();
      }
    });
  }

  findAll() {
    return this.prisma.registration.findMany({});
  }

  findOne(id: string) {
    return this.prisma.$transaction(async (tx) => {
      try {
        const findOne = await tx.registration.findFirst({
          where: { id },
        });
        return findOne;
      } catch (error) {
        if (error) {
          throw new BadRequestException('Not found Register');
        }
      }
    });
  }

  update(id: string, updateRegistrationDto: UpdateRegistrationDto) {
    return this.prisma.$transaction(async (tx) => {
      try {
        const updateByAdmin = await tx.registration.update({
          where: { id },
          data: { seatId: updateRegistrationDto.seatId },
        });
        const seatId = updateByAdmin.seatId;

        if (!seatId) {
          throw new BadRequestException('Seat is required');
        }

        await tx.seat.update({
          where: { id: seatId },
          data: { isBooked: true },
        });

        return updateByAdmin;
      } catch (error) {
        if (error) {
          throw new BadRequestException('Error');
        }
      }
    });
  }

  // remove(id: number) {
  //   return `This action removes a #${id} registration`;
  // }
}
