FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY shared/package*.json ./shared/
COPY shared/src ./shared/src/
COPY shared/tsconfig.json ./shared/
RUN cd shared && npm install && npm run build

COPY payment-service/package*.json ./payment-service/
COPY payment-service/prisma ./payment-service/prisma/
COPY payment-service/tsconfig.json ./payment-service/
COPY payment-service/src ./payment-service/src/

WORKDIR /app/payment-service
RUN npm install
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app
COPY --from=builder /app/shared ./shared

WORKDIR /app/payment-service
COPY --from=builder /app/payment-service/package*.json ./
COPY --from=builder /app/payment-service/prisma ./prisma/
RUN npm install --omit=dev && npx prisma generate
COPY --from=builder /app/payment-service/dist ./dist

EXPOSE 3004

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/server.js"]
