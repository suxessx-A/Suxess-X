FROM node:20-alpine

RUN npm install -g pnpm

WORKDIR /app

COPY . .

# ===== DIAGNOSTIC: show what got copied =====
RUN echo "===== /app top-level =====" && ls -la /app/
RUN echo "===== /app/lib =====" && (ls -la /app/lib/ || echo "MISSING")
RUN echo "===== /app/lib/db =====" && (ls -la /app/lib/db/ || echo "MISSING")
RUN echo "===== /app/artifacts =====" && (ls -la /app/artifacts/ || echo "MISSING")
RUN echo "===== pnpm-workspace.yaml =====" && (cat /app/pnpm-workspace.yaml || echo "MISSING")
RUN echo "===== /app/lib/db/package.json =====" && (cat /app/lib/db/package.json || echo "MISSING")
# ===== END DIAGNOSTIC =====

RUN pnpm install --ignore-scripts

RUN cd artifacts/api-server && node build.mjs

CMD ["sh", "-c", "cd artifacts/api-server && node --enable-source-maps dist/index.mjs"]
