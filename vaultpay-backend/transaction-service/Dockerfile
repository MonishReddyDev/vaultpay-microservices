FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY shared/package*.json ./shared/
COPY shared/src ./shared/src/
COPY shared/tsconfig.json ./shared/
RUN cd shared && npm install && npm run build

COPY transaction-service/package*.json ./transaction-service/
COPY transaction-service/prisma ./transaction-service/prisma/
COPY transaction-service/tsconfig.json ./transaction-service/
COPY transaction-service/src ./transaction-service/src/

WORKDIR /app/transaction-service
RUN npm install
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app
COPY --from=builder /app/shared ./shared

WORKDIR /app/transaction-service
COPY --from=builder /app/transaction-service/package*.json ./
COPY --from=builder /app/transaction-service/prisma ./prisma/
RUN npm install --omit=dev && npx prisma generate
COPY --from=builder /app/transaction-service/dist ./dist

EXPOSE 3003

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/server.js"]
