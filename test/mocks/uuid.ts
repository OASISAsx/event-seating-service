import { randomUUID } from 'node:crypto';

export function v4(): string {
  return randomUUID();
}
