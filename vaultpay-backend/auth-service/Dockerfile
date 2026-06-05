FROM node:20-alpine AS builder

# Install OpenSSL for Prisma query engine
RUN apk add --no-cache openssl

WORKDIR /app

COPY shared/package*.json ./shared/
COPY shared/src ./shared/src/
COPY shared/tsconfig.json ./shared/
RUN cd shared && npm install && npm run build

COPY auth-service/package*.json ./auth-service/
COPY auth-service/prisma ./auth-service/prisma/
COPY auth-service/tsconfig.json ./auth-service/
COPY auth-service/src ./auth-service/src/

WORKDIR /app/auth-service
RUN npm install
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production

RUN apk add --no-cache openssl

WORKDIR /app
COPY --from=builder /app/shared ./shared

WORKDIR /app/auth-service
COPY --from=builder /app/auth-service/package*.json ./
COPY --from=builder /app/auth-service/prisma ./prisma/
RUN npm install --omit=dev && npx prisma generate
COPY --from=builder /app/auth-service/dist ./dist

EXPOSE 3001

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/server.js"]
