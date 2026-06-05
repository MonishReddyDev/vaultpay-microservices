import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { logger, messageBroker } from '@digital-wallet/shared';
import { routes } from './routes';
import { PrismaClient } from '@prisma/client';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const prisma = new PrismaClient();

async function bootstrap() {
  const app = fastify({ logger: false });

  try {
    await app.register(helmet);
    await app.register(cors, { origin: '*' });

    // Ensure DB connection is alive
    await prisma.$connect();
    logger.info('Connected to Auth PostgreSQL Schema successfully');

    // Connect to RabbitMQ so we can publish events later
    await messageBroker.connect();

    // Register our domain routes (mapped to / by gateway, so no prefix needed here)
    await app.register(routes);

    app.get('/health', async () => ({ service: 'auth-service', status: 'UP' }));

    await app.listen({ port: PORT, host: HOST });
    logger.info(`🔐 Auth Service running at http://${HOST}:${PORT}`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled Rejection');
  process.exit(1);
});

bootstrap();
