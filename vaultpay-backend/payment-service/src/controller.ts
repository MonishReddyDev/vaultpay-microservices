import { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentService } from './service';

export class PaymentController {
  // ─────────────────────────────────────────────────────────────────────────
  // BILL PAYMENTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/bills/pay
   * Body: { billerCode, billerName, accountNumber, amount, description? }
   *
   * Initiates a bill payment saga:
   *   creates PENDING record → publishes wallet.debit.request
   * The consumer will later mark it COMPLETED or FAILED.
   */
  static async payBill(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.headers['x-user-id'] as string;
      if (!userId) {
        return reply.code(401).send({ success: false, error: 'Unauthorized: missing x-user-id header' });
      }

      const { billerCode, billerName, accountNumber, amount, description } =
        request.body as {
          billerCode:    string;
          billerName:    string;
          accountNumber: string;
          amount:        string;
          description?:  string;
        };

      if (!billerCode || !billerName || !accountNumber || !amount) {
        return reply.code(400).send({
          success: false,
          error: 'billerCode, billerName, accountNumber, and amount are required.',
        });
      }

      const record = await PaymentService.payBill(
        userId, billerCode, billerName, accountNumber, amount, description
      );

      return reply.code(202).send({
        success: true,
        message: 'Bill payment initiated. Processing asynchronously.',
        data: {
          id:            record.id,
          status:        record.status,
          billerName:    record.billerName,
          accountNumber: record.accountNumber,
          amount:        parseFloat(record.amount.toString()).toFixed(2),
          currency:      record.currency,
          createdAt:     record.createdAt,
        },
      });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/bills
   * Returns paginated bill payment history for the authenticated user.
   * Query: ?page=1&limit=20
   */
  static async getBills(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.headers['x-user-id'] as string;
      if (!userId) {
        return reply.code(401).send({ success: false, error: 'Unauthorized: missing x-user-id header' });
      }

      const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };
      const result = await PaymentService.getBillPayments(userId, parseInt(page, 10), parseInt(limit, 10));

      return reply.send({
        success: true,
        data: {
          records: result.records.map((r) => ({
            id:            r.id,
            billerCode:    r.billerCode,
            billerName:    r.billerName,
            accountNumber: r.accountNumber,
            amount:        parseFloat(r.amount.toString()).toFixed(2),
            currency:      r.currency,
            status:        r.status,
            referenceId:   r.referenceId,
            description:   r.description,
            date:          r.createdAt,
          })),
          pagination: {
            total:      result.total,
            page:       result.page,
            limit:      result.limit,
            totalPages: Math.ceil(result.total / result.limit),
          },
        },
      });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MOBILE RECHARGES
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * POST /api/recharge
   * Body: { mobileNumber, operator, planCode, amount, description? }
   *
   * Returns 202 Accepted because the recharge is processed asynchronously
   * via the wallet debit saga.
   */
  static async recharge(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.headers['x-user-id'] as string;
      if (!userId) {
        return reply.code(401).send({ success: false, error: 'Unauthorized: missing x-user-id header' });
      }

      const { mobileNumber, operator, planCode, amount, description } =
        request.body as {
          mobileNumber: string;
          operator:     string;
          planCode:     string;
          amount:       string;
          description?: string;
        };

      if (!mobileNumber || !operator || !planCode || !amount) {
        return reply.code(400).send({
          success: false,
          error:   'mobileNumber, operator, planCode, and amount are required.',
        });
      }

      const record = await PaymentService.recharge(
        userId, mobileNumber, operator, planCode, amount, description
      );

      return reply.code(202).send({
        success: true,
        message: 'Recharge initiated. Processing asynchronously.',
        data: {
          id:           record.id,
          status:       record.status,
          mobileNumber: record.mobileNumber,
          operator:     record.operator,
          planCode:     record.planCode,
          amount:       parseFloat(record.amount.toString()).toFixed(2),
          currency:     record.currency,
          createdAt:    record.createdAt,
        },
      });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/recharge
   * Returns paginated recharge history for the authenticated user.
   * Query: ?page=1&limit=20
   */
  static async getRecharges(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.headers['x-user-id'] as string;
      if (!userId) {
        return reply.code(401).send({ success: false, error: 'Unauthorized: missing x-user-id header' });
      }

      const { page = '1', limit = '20' } = request.query as { page?: string; limit?: string };
      const result = await PaymentService.getRecharges(userId, parseInt(page, 10), parseInt(limit, 10));

      return reply.send({
        success: true,
        data: {
          records: result.records.map((r) => ({
            id:           r.id,
            mobileNumber: r.mobileNumber,
            operator:     r.operator,
            planCode:     r.planCode,
            amount:       parseFloat(r.amount.toString()).toFixed(2),
            currency:     r.currency,
            status:       r.status,
            referenceId:  r.referenceId,
            description:  r.description,
            date:         r.createdAt,
          })),
          pagination: {
            total:      result.total,
            page:       result.page,
            limit:      result.limit,
            totalPages: Math.ceil(result.total / result.limit),
          },
        },
      });
    } catch (error: any) {
      return reply.code(400).send({ success: false, error: error.message });
    }
  }
}
