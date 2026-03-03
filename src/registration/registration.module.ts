import { Module } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { PrismaModule } from 'src/modules/prisma/prisma.module';
import { PrismaRegistrationRepository } from './repository/registration.repository';

@Module({
  imports: [PrismaModule],
  controllers: [RegistrationController],
  providers: [
    RegistrationService,
    {
      // เราใช้ String เป็น Token เพราะ Interface ไม่หลงเหลืออยู่ใน Runtime
      provide: 'IREGISTRATION_REPOSITORY',
      useClass: PrismaRegistrationRepository,
    },
  ],
})
export class RegistrationModule {}
