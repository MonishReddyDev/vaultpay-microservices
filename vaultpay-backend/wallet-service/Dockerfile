FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY shared/package*.json ./shared/
COPY shared/src ./shared/src/
COPY shared/tsconfig.json ./shared/
RUN cd shared && npm install && npm run build

COPY wallet-service/package*.json ./wallet-service/
COPY wallet-service/prisma ./wallet-service/prisma/
COPY wallet-service/tsconfig.json ./wallet-service/
COPY wallet-service/src ./wallet-service/src/

WORKDIR /app/wallet-service
RUN npm install
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app
COPY --from=builder /app/shared ./shared

WORKDIR /app/wallet-service
COPY --from=builder /app/wallet-service/package*.json ./
COPY --from=builder /app/wallet-service/prisma ./prisma/
RUN npm install --omit=dev && npx prisma generate
COPY --from=builder /app/wallet-service/dist ./dist

EXPOSE 3002

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/server.js"]
