FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY . .

RUN echo "===A=== /app top-level ===" && ls -la /app/
RUN echo "===B=== /app/lib ===" && (ls -la /app/lib/ 2>&1 || echo "MISSING")
RUN echo "===C=== /app/lib/db ===" && (ls -la /app/lib/db/ 2>&1 || echo "MISSING")
RUN echo "===D=== /app/artifacts ===" && (ls -la /app/artifacts/ 2>&1 || echo "MISSING")
RUN echo "===E=== pnpm-workspace.yaml ===" && (cat /app/pnpm-workspace.yaml 2>&1 || echo "MISSING")
RUN echo "===F=== /app/lib/db/package.json ===" && (cat /app/lib/db/package.json 2>&1 || echo "MISSING")

RUN pnpm install --ignore-scripts
RUN cd artifacts/api-server && node build.mjs
CMD ["sh", "-c", "cd artifacts/api-server && node --enable-source-maps dist/index.mjs"]
