FROM node:20-alpine

# CACHE BUST
ARG CACHEBUST=20260518T1500
RUN echo "Cache bust ${CACHEBUST}"

RUN npm install -g pnpm

WORKDIR /app

COPY . .

RUN pnpm install --ignore-scripts

RUN cd artifacts/api-server && node build.mjs

# Run schema sync before starting server
CMD ["sh", "-c", "pnpm --filter @workspace/db run push && cd artifacts/api-server && node --enable-source-maps dist/index.mjs"]
