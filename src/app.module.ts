import { UploadModule } from './modules/uploads/upload.module';
import { WebsocketModule } from './websocket/websocket.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { RegistrationModule } from './modules/registration/registration.module';
import { EventsModule } from './modules/events/events.module';
import { WebsocketGateway } from './websocket/websocket.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { LoggerModule } from 'nestjs-pino';
import { join } from 'path';

@Module({
  imports: [
    // ✅ ต้องอยู่บนสุด
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // ✅ ตอนนี้ env โหลดแล้ว
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
        autoLogging: false,
      },
    }),

    MongooseModule.forRoot(process.env.DATABASE_URL!),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    UploadModule,
    WebsocketModule,
    AuthModule,
    PrismaModule,
    RegistrationModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService, WebsocketGateway],
})
export class AppModule {}
