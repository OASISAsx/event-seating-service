import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { EventsModule } from './modules/events/events.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { UploadModule } from './modules/uploads/upload.module';
import { WebsocketModule } from './websocket/websocket.module';
import { WebsocketGateway } from './websocket/websocket.gateway';

const isProduction = process.env.NODE_ENV === 'production';
const logFile =
  process.env.PINO_LOG_FILE || join(process.cwd(), 'logs', 'app.log');
const errorLogFile =
  process.env.PINO_ERROR_LOG_FILE || join(process.cwd(), 'logs', 'error.log');
const logLevel =
  process.env.PINO_LOG_LEVEL || (isProduction ? 'info' : 'debug');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    LoggerModule.forRoot({
      pinoHttp: {
        level: logLevel,
        // autoLogging: false, // แนะนำให้ปิดตอน Dev จะได้ไม่รก
        transport: {
          targets: [
            {
              target: 'pino-pretty',
              level: logLevel,
              options: { colorize: true },
            },

            {
              target: 'pino-roll',
              level: logLevel,
              options: {
                file: logFile,
                frequency: 'daily',
                mkdir: true,
              },
            },

            {
              target: 'pino-roll',
              level: 'error',
              options: {
                file: errorLogFile,
                frequency: 'daily',
                mkdir: true,
              },
            },
          ],
        },
      },
    }),

    MongooseModule.forRoot(process.env.DATABASE_URL!),

    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    UploadModule,
    WebsocketModule,
    ChatModule,
    AuthModule,
    PrismaModule,
    RegistrationModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService, WebsocketGateway],
})
export class AppModule {}
