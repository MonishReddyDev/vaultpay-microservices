import { FastifyInstance } from 'fastify';
import { WalletController } from './controller';

export async function routes(app: FastifyInstance) {
  // GET /balance — fetch authenticated user's wallet balance & recent transactions
  app.get('/balance', WalletController.getBalance);

  // POST /transfer — send money to another user
  // Body: { toUserId: string, amount: string }
  app.post('/transfer', WalletController.transfer);

  // GET /transactions — paginated transaction history
  // Query: ?page=1&limit=20
  app.get('/transactions', WalletController.getTransactions);

  // POST /add-money — top up the authenticated user's wallet
  // Body: { amount: string, description?: string }
  app.post('/add-money', WalletController.addMoney);

  // Internal health check
  app.get('/health', async () => ({
    service: 'wallet-service',
    status: 'UP',
    timestamp: new Date().toISOString(),
  }));
}

