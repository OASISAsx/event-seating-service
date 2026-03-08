import { Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
// import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { generateSeats } from './utils/generate-seats.util';
import { BadRequestException } from '@nestjs/common';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}
  async create(createEventDto: CreateEventDto) {
    return this.prisma.$transaction(async (tx) => {
      if (createEventDto.startDate >= createEventDto.endDate) {
        throw new BadRequestException('startDate must be before endDate');
      }

      const event = await tx.event.create({
        data: {
          ...createEventDto,
        },
      });

      const seats = generateSeats(
        createEventDto.totalSeats,
        createEventDto.seatsPerRow,
      );

      await tx.seat.createMany({
        data: seats.map((seatNumber: string) => ({
          seatNumber,
          eventId: event.id,
        })),
      });

      return event;
    });
  }

  findAll() {
    return this.prisma.$transaction(async (tx) => {
      const findEvent = await tx.event.findMany({});
      return findEvent;
    });
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} event`;
  // }

  // update(id: number, updateEventDto: UpdateEventDto) {
  //   return `This action updates a #${id} event`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} event`;
  // }
}
