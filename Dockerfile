# ใช้ Node Alpine
FROM node:20-alpine

# ตั้ง working directory
WORKDIR /app

# copy package lock & json
COPY package.json pnpm-lock.yaml ./

# install pnpm และ dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# copy source ทั้งหมด
COPY . .

# generate Prisma client
RUN pnpm prisma generate

# build NestJS
RUN pnpm run build

# expose port
EXPOSE 3001

# run NestJS
CMD ["node", "dist/main.js"]