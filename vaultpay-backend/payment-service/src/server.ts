import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { logger, messageBroker } from '@digital-wallet/shared';
import { prisma } from './service';
import { routes } from './routes';
import { startConsumers } from './consumer';

const PORT = parseInt(process.env.PORT || '3004', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  const app = fastify({ logger: false });

  try {
    // Global security & CORS middleware
    await app.register(helmet);
    await app.register(cors, { origin: '*' });

    // Verify PostgreSQL connection before accepting traffic
    await prisma.$connect();
    logger.info('Connected to Payment PostgreSQL schema successfully');

    // Connect to RabbitMQ — needed for both publishing debit requests
    // and consuming debit confirmed/failed events
    await messageBroker.connect();

    // Register REST API routes
    await app.register(routes);

    // Start RabbitMQ consumers AFTER Prisma is ready
    // (consumer callbacks write to the DB)
    await startConsumers();

    await app.listen({ port: PORT, host: HOST });
    logger.info(`💳 Payment Service running at http://${HOST}:${PORT}`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

// Graceful shutdown — close DB connection cleanly on SIGTERM (Docker stop)
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down Payment Service gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled Rejection in Payment Service');
  process.exit(1);
});

bootstrap();
