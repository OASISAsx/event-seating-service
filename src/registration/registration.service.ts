import { Injectable } from '@nestjs/common';
import { CreateRegistrationDto } from './dto/create-registration.dto';
// import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class RegistrationService {
  constructor(private prisma: PrismaService) {}
  create(createRegistrationDto: CreateRegistrationDto) {
    return this.prisma.$transaction(async (tx) => {
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
    });
  }

  findAll() {
    return this.prisma.registration.findMany({});
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} registration`;
  // }

  // update(id: number, updateRegistrationDto: UpdateRegistrationDto) {
  //   return `This action updates a #${id} registration`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} registration`;
  // }
}
