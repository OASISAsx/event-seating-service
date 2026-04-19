# Chat API with Socket.io, RabbitMQ, and Redis

## Overview

This Chat API provides real-time messaging capabilities using:

- **Socket.io** - WebSocket connections for real-time client communication
- **RabbitMQ** - Message broker for distributed message handling and reliability
- **Redis** - Message history storage for fast retrieval of recent messages

## Features

- ✅ Real-time messaging in rooms
- ✅ User join/leave notifications
- ✅ Typing indicators
- ✅ Message history storage with Redis (last 1000 messages per room)
- ✅ REST API endpoints for message history retrieval
- ✅ Multi-room support
- ✅ Scalable architecture with message queues

## Architecture

```
Client (Socket.io)
    ↓
Chat Gateway (WebSocket)
    ↓
Chat Service
    ↓
RabbitMQ (Message Broker)
    ↓
Chat Gateway → Broadcast to Clients
```

## Setup

### 1. Start RabbitMQ and MongoDB with Docker

```bash
docker-compose up -d rabbitmq mongo
```

### 2. Configure Environment Variables

Create a `.env` file:

```env
RABBITMQ_URL=amqp://localhost:5672
DATABASE_URL=mongodb://localhost:27017/event-seating
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run the Application

```bash
pnpm run start:dev
```

## API Usage

### Socket.io Connection

Connect to the chat namespace:

```javascript
const socket = io('http://localhost:8080/chat', {
  query: { userId: 'user123' },
});
```

### Events

#### Join Room

```javascript
socket.emit('join-room', { roomId: 'room1', userId: 'user123' }, (response) => {
  console.log(response); // { status: 'success', message: 'Joined room: room1' }
});
```

#### Leave Room

```javascript
socket.emit('leave-room', { roomId: 'room1' }, (response) => {
  console.log(response); // { status: 'success', message: 'Left room: room1' }
});
```

#### Send Message

```javascript
socket.emit(
  'send-message',
  {
    roomId: 'room1',
    content: 'Hello World!',
    senderId: 'user123',
  },
  (response) => {
    console.log(response); // { status: 'success', message: 'Message sent', data: {...} }
  },
);
```

#### Typing Indicator

```javascript
socket.emit('typing', { roomId: 'room1', isTyping: true });
```

### Listen for Events

#### New Message

```javascript
socket.on('new-message', (message) => {
  console.log('New message:', message);
  // { id, roomId, senderId, content, timestamp, type }
});
```

#### User Joined

```javascript
socket.on('user-joined', (data) => {
  console.log('User joined:', data);
  // { userId, roomId, timestamp }
});
```

#### User Left

```javascript
socket.on('user-left', (data) => {
  console.log('User left:', data);
  // { userId, roomId, timestamp }
});
```

#### User Typing

```javascript
socket.on('user-typing', (data) => {
  console.log('User typing:', data);
  // { userId, roomId, isTyping, timestamp }
});
```

## Testing

### Using the Test Client

Open `chat-test-client.html` in your browser:

```bash
# Start the server
pnpm run start:dev

# Open chat-test-client.html in multiple browser tabs
# to simulate multiple users
```

### Using Socket.io Client

```javascript
// Install socket.io client
npm install socket.io-client

// Connect and test
const io = require('socket.io-client');
const socket = io('http://localhost:8080/chat', { query: { userId: 'test1' } });

socket.on('connect', () => {
  console.log('Connected!');

  socket.emit('join-room', { roomId: 'test-room' }, (res) => {
    console.log('Joined:', res);

    socket.emit('send-message', {
      roomId: 'test-room',
      content: 'Hello!'
    });
  });
});
```

## RabbitMQ Management

Access RabbitMQ Management UI:

- URL: http://localhost:15672
- Username: guest
- Password: guest

### Exchange Details

- **Name**: `chat.messages`
- **Type**: `topic`
- **Durable**: Yes

### Queue Pattern

- Each service instance creates its own queue: `chat.room.service.{PID}`
- Queues are auto-deleted when service stops
- Bound to routing pattern: `room.#`

## Message Flow

1. Client sends message via Socket.io
2. Chat Gateway receives and validates
3. Chat Service publishes to RabbitMQ exchange
4. Message is routed to all service instance queues
5. Chat Service consumes and forwards to Gateway
6. Gateway broadcasts to all clients in the room

## Environment Variables

| Variable       | Description             | Default                 |
| -------------- | ----------------------- | ----------------------- |
| `RABBITMQ_URL` | RabbitMQ connection URL | `amqp://localhost:5672` |
| `PORT`         | Server port             | `3001`                  |

## Docker Deployment

```bash
# Start all services (backend, mongo, rabbitmq)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

## Troubleshooting

### RabbitMQ Connection Issues

```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# View RabbitMQ logs
docker logs eventSeat-rabbitmq-1

# Restart RabbitMQ
docker-compose restart rabbitmq
```

### Socket.io Connection Issues

- Ensure CORS is properly configured
- Check firewall settings for port 3001
- Verify Socket.io client version matches server

## File Structure

```
src/modules/chat/
├── chat.module.ts          # Module definition
├── chat.gateway.ts         # WebSocket gateway
├── chat.service.ts         # RabbitMQ service
└── dto/
    └── chat.dto.ts         # DTOs and interfaces
```
