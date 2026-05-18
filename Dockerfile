FROM node:20-alpine

# CACHE BUST — change this value to force Docker to rebuild from here
ARG CACHEBUST=20260518T1310
RUN echo "Cache bust ${CACHEBUST}"

RUN npm install -g pnpm

WORKDIR /app

COPY . .

RUN echo "===CONTENTS===" && ls -la /app/ && echo "===LIB===" && ls -la /app/lib/ && echo "===WORKSPACE===" && cat /app/pnpm-workspace.yaml

RUN pnpm install --ignore-scripts

RUN cd artifacts/api-server && node build.mjs

CMD ["sh", "-c", "cd artifacts/api-server && node --enable-source-maps dist/index.mjs"]
