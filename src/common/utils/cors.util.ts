const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8080',
  'http://127.0.0.1:8080',
  'https://event-seat.elitefund.fun',
  'https://www.event-seat.elitefund.fun',
  'https://api.event-seat.elitefund.fun',
];

type CorsCallback = (error: Error | null, allow?: boolean) => void;

function getAllowedOrigins(): Set<string> {
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set([...defaultAllowedOrigins, ...configuredOrigins]);
}

export function corsOrigin(origin: string | undefined, callback: CorsCallback) {
  if (!origin) {
    callback(null, true);
    return;
  }

  if (getAllowedOrigins().has(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`Origin ${origin} is not allowed by CORS`));
}

export const corsOptions = {
  origin: corsOrigin,
  credentials: true,
};

export const socketIoPath = '/api/socket.io';
