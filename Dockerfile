FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install --ignore-scripts

RUN cd artifacts/api-server && node build.mjs

CMD ["sh", "-c", "cd artifacts/api-server && node --enable-source-maps dist/index.mjs"]
