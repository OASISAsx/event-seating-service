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

@Module({
  imports: [
    WebsocketModule,
    AuthModule,
    PrismaModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    RegistrationModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [AppService, WebsocketGateway],
})
export class AppModule {}
