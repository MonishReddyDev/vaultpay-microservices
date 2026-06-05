import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { logger, messageBroker } from '@digital-wallet/shared';
import { PrismaClient } from '@prisma/client';
import { routes } from './routes';
import { startConsumers } from './consumer';

const PORT = parseInt(process.env.PORT || '3002', 10);
const HOST = process.env.HOST || '0.0.0.0';
const prisma = new PrismaClient();

async function bootstrap() {
  const app = fastify({ logger: false });

  try {
    // Register global security & CORS middleware
    await app.register(helmet);
    await app.register(cors, { origin: '*' });

    // Verify PostgreSQL connection
    await prisma.$connect();
    logger.info('Connected to Wallet PostgreSQL schema successfully');

    // Connect to RabbitMQ (needed for both consuming events and future publishing)
    await messageBroker.connect();

    // Register REST API routes
    await app.register(routes);

    // Start listening for RabbitMQ events AFTER the HTTP server is registered
    // This ensures Prisma is fully ready before we try to create wallets
    await startConsumers();

    await app.listen({ port: PORT, host: HOST });
    logger.info(`💳 Wallet Service running at http://${HOST}:${PORT}`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled Rejection');
  process.exit(1);
});

bootstrap();
