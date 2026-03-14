FROM node:20-alpine

WORKDIR /app

# install pnpm
RUN npm install -g pnpm

# copy lockfile
COPY package.json pnpm-lock.yaml ./

# install dependency
RUN pnpm install --frozen-lockfile

# copy project
COPY . .

# generate prisma
RUN pnpm prisma generate

# build nest
RUN pnpm run build

EXPOSE 3000

CMD ["node", "dist/main.js"]