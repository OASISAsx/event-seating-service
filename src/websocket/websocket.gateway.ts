import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { corsOptions, socketIoPath } from 'src/common/utils/cors.util';

@WebSocketGateway({
  cors: corsOptions,
  path: socketIoPath,
})
export class WebsocketGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: any) {
    console.log('Client disconnected:', client.id);
  }

  // test receive message
  @SubscribeMessage('message')
  handleMessage(client: any, payload: any) {
    console.log(payload);
    return 'Hello world!';
  }

  // 🔥 ใช้ emit event
  emitRegistrationCreated(data: any) {
    this.server.emit('registration_created', data);
    console.log('emit registration_created', data);
  }
}
