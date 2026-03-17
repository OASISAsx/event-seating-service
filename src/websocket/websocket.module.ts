/*
https://docs.nestjs.com/modules
*/

import { Module } from '@nestjs/common';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  providers: [WebsocketGateway],
  exports: [WebsocketGateway], // 🔥 สำคัญ
})
export class WebsocketModule {}
