import { FastifyInstance } from 'fastify';
import { TransactionController } from './controller';

export async function routes(app: FastifyInstance) {
  // GET / — paginated full transaction history for the authenticated user
  // Query params: ?page=1&limit=20
  app.get('/', TransactionController.getTransactions);

  // GET /:id — single transaction detail (403 if user is not a participant)
  app.get('/:id', TransactionController.getTransactionById);

  // Internal health check — used by Docker Compose and load balancers
  app.get('/health', async () => ({
    service:   'transaction-service',
    status:    'UP',
    timestamp: new Date().toISOString(),
  }));
}
