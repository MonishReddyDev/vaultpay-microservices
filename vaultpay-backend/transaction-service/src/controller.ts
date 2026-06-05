import { FastifyRequest, FastifyReply } from 'fastify';
import { TransactionService } from './service';

export class TransactionController {
  /**
   * GET /
   * Returns paginated transaction history for the authenticated user.
   * The API Gateway injects x-user-id after verifying the JWT — this
   * service never touches auth secrets.
   *
   * Query params: ?page=1&limit=20
   */
  static async getTransactions(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.headers['x-user-id'] as string;
      if (!userId) {
        return reply
          .code(401)
          .send({ success: false, error: 'Unauthorized: missing x-user-id header' });
      }

      const { page = '1', limit = '20' } = request.query as {
        page?: string;
        limit?: string;
      };

      const result = await TransactionService.getByUser(
        userId,
        parseInt(page, 10),
        parseInt(limit, 10)
      );

      return reply.send({
        success: true,
        data: {
          transactions: result.transactions.map((t: { id: any; type: any; status: any; fromUserId: string; amount: { toString: () => string; }; currency: any; toUserId: any; description: any; createdAt: any; }) => ({
            id:            t.id,
            type:          t.type,
            status:        t.status,
            direction:     t.fromUserId === userId ? 'SENT' : 'RECEIVED',
            amount:        parseFloat(t.amount.toString()).toFixed(2),
            currency:      t.currency,
            counterparty:  t.fromUserId === userId ? t.toUserId : t.fromUserId,
            description:   t.description,
            date:          t.createdAt,
          })),
          pagination: {
            total:       result.total,
            page:        result.page,
            limit:       result.limit,
            totalPages:  Math.ceil(result.total / result.limit),
          },
        },
      });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  }

  /**
   * GET /:id
   * Fetches a single transaction by its UUID.
   * Returns 403 if the authenticated user is not a participant.
   */
  static async getTransactionById(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.headers['x-user-id'] as string;
      if (!userId) {
        return reply
          .code(401)
          .send({ success: false, error: 'Unauthorized: missing x-user-id header' });
      }

      const { id } = request.params as { id: string };
      const transaction = await TransactionService.getById(id, userId);

      return reply.send({
        success: true,
        data: {
          id:           transaction.id,
          type:         transaction.type,
          status:       transaction.status,
          direction:    transaction.fromUserId === userId ? 'SENT' : 'RECEIVED',
          amount:       parseFloat(transaction.amount.toString()).toFixed(2),
          currency:     transaction.currency,
          fromUserId:   transaction.fromUserId,
          toUserId:     transaction.toUserId,
          description:  transaction.description,
          date:         transaction.createdAt,
        },
      });
    } catch (error: any) {
      const code = error.message.includes('Forbidden') ? 403
                 : error.message.includes('not found') ? 404
                 : 400;
      return reply.code(code).send({ success: false, error: error.message });
    }
  }
}
