import { FastifyRequest, FastifyReply } from 'fastify';
import { WalletService } from './service';

export class WalletController {
  /**
   * GET /balance
   * Protected by API Gateway — x-user-id header is injected by the JWT middleware.
   */
  static async getBalance(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.headers['x-user-id'] as string;
      if (!userId) {
        return reply.code(401).send({ success: false, error: 'Unauthorized: missing x-user-id header' });
      }

      const wallet = await WalletService.getBalance(userId);

      return reply.send({
        success: true,
        data: {
          id: wallet.id,
          balance: parseFloat(wallet.balance.toString()).toFixed(2),
          currency: wallet.currency,
          recentTransactions: wallet.transactions.map((t: { id: string; type: string; amount: { toString: () => string }; description: string | null; createdAt: Date }) => ({
            id: t.id,
            type: t.type,
            amount: parseFloat(t.amount.toString()).toFixed(2),
            description: t.description,
            date: t.createdAt,
          })),
        },
      });
    } catch (error: any) {
      return reply.code(404).send({ success: false, error: error.message });
    }
  }

  /**
   * POST /transfer
   * Body: { toUserId: string, amount: string }
   *
   * Note: In a real system, the client sends a phone number and we look up the
   * userId via an internal call to Auth Service. For simplicity here, we accept
   * toUserId directly. The Auth Service exposes /internal/users/by-phone/:phone
   * for this purpose.
   */
  static async transfer(request: FastifyRequest, reply: FastifyReply) {
    try {
      const fromUserId = request.headers['x-user-id'] as string;
      if (!fromUserId) {
        return reply.code(401).send({ success: false, error: 'Unauthorized: missing x-user-id header' });
      }

      const { toUserId, amount, toUserName, fromUserName } = request.body as { toUserId: string; amount: string; toUserName?: string; fromUserName?: string };

      if (!toUserId || !amount) {
        return reply.code(400).send({ success: false, error: 'toUserId and amount are required' });
      }

      if (fromUserId === toUserId) {
        return reply.code(400).send({ success: false, error: 'Cannot transfer to your own wallet' });
      }

      const result = await WalletService.transfer(fromUserId, toUserId, amount, fromUserName, toUserName);

      return reply.send({ success: true, data: result });
    } catch (error: any) {
      const statusCode = error.message.includes('Insufficient') ? 422 : 400;
      return reply.code(statusCode).send({ success: false, error: error.message });
    }
  }

  /**
   * GET /transactions?page=1&limit=20
   * Returns paginated transaction history for the authenticated user.
   */
  static async getTransactions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.headers['x-user-id'] as string;
      if (!userId) {
        return reply.code(401).send({ success: false, error: 'Unauthorized: missing x-user-id header' });
      }

      const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };
      const transactions = await WalletService.getTransactions(userId, parseInt(page), parseInt(limit));

      return reply.send({
        success: true,
        data: transactions.map((t: { id: string; type: string; amount: { toString: () => string }; description: string | null; createdAt: Date }) => ({
          id: t.id,
          type: t.type,
          amount: parseFloat(t.amount.toString()).toFixed(2),
          description: t.description,
          date: t.createdAt,
        })),
      });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  }

  /**
   * POST /add-money
   * Body: { amount: string, description?: string }
   *
   * Tops up the authenticated user's wallet directly.
   * In production this would be gated behind a payment gateway callback.
   */
  static async addMoney(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.headers['x-user-id'] as string;
      if (!userId) {
        return reply.code(401).send({ success: false, error: 'Unauthorized: missing x-user-id header' });
      }

      const { amount, description } = request.body as { amount: string; description?: string };

      if (!amount) {
        return reply.code(400).send({ success: false, error: 'amount is required' });
      }

      const result = await WalletService.addMoney(userId, amount, description);

      return reply.code(200).send({ success: true, data: result });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  }
}

