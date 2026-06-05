FROM node:20-alpine AS builder

WORKDIR /app

# Build shared library first (api-gateway uses it for logger)
COPY shared/package*.json ./shared/
COPY shared/src ./shared/src/
COPY shared/tsconfig.json ./shared/
RUN cd shared && npm install && npm run build

# Copy api-gateway
COPY api-gateway/package*.json ./api-gateway/
COPY api-gateway/tsconfig.json ./api-gateway/
COPY api-gateway/src ./api-gateway/src/

WORKDIR /app/api-gateway
RUN npm install
RUN npm run build

# ─── Production ───────────────────────────────────────────────
FROM node:20-alpine AS production

WORKDIR /app
COPY --from=builder /app/shared ./shared

WORKDIR /app/api-gateway
COPY --from=builder /app/api-gateway/package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/api-gateway/dist ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
