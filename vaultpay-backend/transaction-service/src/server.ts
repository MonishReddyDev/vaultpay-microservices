import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { logger, messageBroker } from '@digital-wallet/shared';
import { prisma } from './service';
import { routes } from './routes';
import { startConsumers } from './consumer';

const PORT = parseInt(process.env.PORT || '3003', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  const app = fastify({ logger: false });

  try {
    // Register global security & CORS middleware
    await app.register(helmet);
    await app.register(cors, { origin: '*' });

    // Verify PostgreSQL connection
    await prisma.$connect();
    logger.info('Connected to Transaction PostgreSQL schema successfully');

    // Connect to RabbitMQ — needed to consume wallet.transfer.completed events
    await messageBroker.connect();

    // Register REST API routes
    await app.register(routes);

    // Start listening for RabbitMQ events AFTER HTTP server is registered
    // This guarantees Prisma is fully ready before we try to write transactions
    await startConsumers();

    await app.listen({ port: PORT, host: HOST });
    logger.info(`📒 Transaction Service running at http://${HOST}:${PORT}`);
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
