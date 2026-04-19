# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm prisma generate
RUN pnpm run build

# Stage 2: Run (ตัวนี้จะเบามาก)
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm

# ก๊อปปี้เฉพาะส่วนที่จำเป็นมาจาก builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma 

# ตั้งค่า Environment สำคัญ
ENV NODE_ENV=production

EXPOSE 3001
CMD ["node", "dist/main.js"]