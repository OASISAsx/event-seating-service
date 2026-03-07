// import { BadRequestException, Injectable } from '@nestjs/common';
// import { CreateRegistrationDto } from './dto/create-registration.dto';
// // import { UpdateRegistrationDto } from './dto/update-registration.dto';
// import { PrismaService } from 'src/modules/prisma/prisma.service';

// @Injectable()
// export class RegistrationService {
//   constructor(private prisma: PrismaService) {}

//   create(createRegistrationDto: CreateRegistrationDto) {
//     return this.prisma.$transaction(async (tx) => {
//       try {
//         const existing = await tx.registration.findFirst({
//           where: {
//             firstName: createRegistrationDto.firstName,
//             lastName: createRegistrationDto.lastName,
//           },
//         });
//         if (existing) {
//           return { massage: 'ท่านได้ลงชื่อในระบบแล้ว' };
//         }

//         const create = await tx.registration.create({
//           data: createRegistrationDto,
//         });

//         return {
//           create,
//         };
//       } catch (error) {
//         if (error) throw new BadRequestException();
//       }
//     });
//   }

//   // findAll() {
//   //   return this.prisma.registration.findMany({});
//   // }

//   // findOne(id: string) {
//   //   return this.prisma.$transaction(async (tx) => {
//   //     try {
//   //       const findOne = await tx.registration.findFirst({
//   //         where: { id },
//   //       });
//   //       return findOne;
//   //     } catch (error) {
//   //       if (error) {
//   //         throw new BadRequestException('Not found Register');
//   //       }
//   //     }
//   //   });
//   // }

//   // update(id: string, updateRegistrationDto: UpdateRegistrationDto) {
//   //   return this.prisma.$transaction(async (tx) => {
//   //     try {
//   //       const updateByAdmin = await tx.registration.update({
//   //         where: { id },
//   //         data: { seatId: updateRegistrationDto.seatId },
//   //       });
//   //       const seatId = updateByAdmin.seatId;

//   //       if (!seatId) {
//   //         throw new BadRequestException('Seat is required');
//   //       }

//   //       await tx.seat.update({
//   //         where: { id: seatId },
//   //         data: { isBooked: true },
//   //       });

//   //       return updateByAdmin;
//   //     } catch (error) {
//   //       if (error) {
//   //         throw new BadRequestException('Error');
//   //       }
//   //     }
//   //   });
//   // }

//   // remove(id: number) {
//   //   return `This action removes a #${id} registration`;
//   // }
// }

// registration.service.ts
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
// import { IRegistrationRepository } from './interfaces/registration.repository.interface';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import * as registrationRepositoryInterface from './repository/registration.interface';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { PaginationDto } from 'src/common/utils/dto/pagination.dto';

@Injectable()
export class RegistrationService {
  constructor(
    @Inject('IREGISTRATION_REPOSITORY') // อ้างอิงจาก Token ที่ตั้งไว้ใน Module
    private readonly registrationRepo: registrationRepositoryInterface.IRegistrationRepository,
  ) {}

  async create(dto: CreateRegistrationDto) {
    const existingPhone = await this.registrationRepo.findByPhone(dto.phone);
    if (existingPhone) {
      throw new BadRequestException('เบอร์โทรศัพท์นี้ถูกใช้งานไปแล้ว');
    }
    if (!dto.eventId) throw new BadRequestException('กรุณาเลือกอีเวนท์');
    const existingName = await this.registrationRepo.findName(
      dto.firstName,
      dto.lastName,
    );
    if (existingName)
      throw new BadRequestException('ชื่อนี้ทำการลงทะเบียนไปแล้ว');
    const create = await this.registrationRepo.create(dto);
    return {
      success: 'true',
      data: create,
    };
  }
  async findAll(query: PaginationDto) {
    return await this.registrationRepo.findAll(query);
  }
  async findOne(id: string) {
    return this.registrationRepo.findOne(id);
  }
  async update(id: string, dto: UpdateRegistrationDto) {
    if (!dto.seatId) throw new BadRequestException('ระบุที่นั่ง');
    const update = await this.registrationRepo.update(id, dto);

    return update;
  }
}
