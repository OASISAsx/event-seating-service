declare module 'amqplib' {
  export interface ConsumeMessage {
    content: Buffer;
  }

  export interface ConfirmChannel {
    assertExchange(
      exchange: string,
      type: string,
      options?: { durable?: boolean },
    ): Promise<unknown>;
    assertQueue(
      queue: string,
      options?: { durable?: boolean; autoDelete?: boolean },
    ): Promise<unknown>;
    bindQueue(queue: string, source: string, pattern: string): Promise<unknown>;
    consume(
      queue: string,
      onMessage: (msg: ConsumeMessage | null) => unknown,
      options?: { noAck?: boolean },
    ): Promise<unknown>;
    publish(
      exchange: string,
      routingKey: string,
      content: Buffer,
      options?: {
        persistent?: boolean;
        contentType?: string;
        timestamp?: number;
      },
    ): boolean | Promise<boolean>;
    ack(message: ConsumeMessage): void;
    nack(message: ConsumeMessage, allUpTo?: boolean, requeue?: boolean): void;
    close(): Promise<void>;
  }

  export interface Connection {
    createConfirmChannel(): Promise<ConfirmChannel>;
    close(): Promise<void>;
    on(event: 'close', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
  }

  export function connect(url: string): Promise<Connection>;
}
