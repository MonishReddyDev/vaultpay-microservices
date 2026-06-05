import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { logger } from '@digital-wallet/shared';
import { setupProxies } from './proxy';

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  const app = fastify({
    logger: false, // We use our custom Pino logger explicitly
  });

  try {
    // 1. Register Global Middleware (Security & Performance)
    await app.register(helmet);
    await app.register(cors, { origin: '*' });

    // API Gateway Rate Limiting
    // Prevents DDoS before it ever reaches internal microservices
    await app.register(rateLimit, {
      max: 100, // 100 requests per window
      timeWindow: '1 minute',
    });

    // 2. Setup Reverse Proxies to Microservices
    await setupProxies(app);

    // 3. Gateway Level Health Check
    app.get('/health', async () => {
      return { 
        service: 'api-gateway', 
        status: 'UP', 
        timestamp: new Date().toISOString() 
      };
    });

    // 4. Start Server
    await app.listen({ port: PORT, host: HOST });
    logger.info(`🚀 API Gateway running at http://${HOST}:${PORT}`);
    
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

// Global unhandled error handlers
process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled Rejection');
  process.exit(1);
});

bootstrap();
