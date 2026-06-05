import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '@digital-wallet/shared';

export const prisma = new PrismaClient();

// --------------------------------------------------------------------------
// Payload shape that the Wallet Service publishes on wallet.transfer.completed
// --------------------------------------------------------------------------
export interface TransferEventPayload {
  idempotencyKey: string;         // "<senderWalletId>-<receiverWalletId>-<isoTimestamp>"
  fromUserId:     string;
  toUserId:       string;
  amount:         string;         // e.g. "50.00"
  currency?:      string;         // defaults to "USD"
  description?:   string;
  metadata?:      Prisma.InputJsonValue;
}

export class TransactionService {
  /**
   * 📌 IDEMPOTENT RECORD
   *
   * Called by the RabbitMQ consumer each time a wallet.transfer.completed
   * event arrives. Uses Prisma upsert on the unique idempotencyKey so that
   * replaying the same message twice is completely safe — no duplicates.
   *
   * Interview Talking Point:
   * "The Transaction Service is the system of record for all financial events.
   *  Because RabbitMQ gives us at-least-once delivery, the same event can
   *  arrive more than once after a crash or retry. My idempotency key
   *  (a unique index on the transactions table) means the second write is a no-op.
   *  This is exactly how Stripe prevents double-charges on their platform."
   */
  static async record(payload: TransferEventPayload): Promise<void> {
    const {
      idempotencyKey,
      fromUserId,
      toUserId,
      amount,
      currency = 'USD',
      description,
      metadata,
    } = payload;

    const existing = await prisma.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      logger.warn(
        { idempotencyKey },
        '⚠️  Duplicate event received — transaction already recorded. Skipping.'
      );
      return;
    }

    const transaction = await prisma.transaction.create({
      data: {
        idempotencyKey,
        fromUserId,
        toUserId,
        amount:      parseFloat(amount),
        currency,
        status:      'COMPLETED' as const,
        type:        'TRANSFER' as const,
        description: description ?? `Transfer from ${fromUserId} to ${toUserId}`,
        ...(metadata !== undefined && { metadata }),
      },
    });

    logger.info(
      { transactionId: transaction.id, fromUserId, toUserId, amount },
      '✅ Transaction recorded.'
    );
  }

  /**
   * Returns a paginated list of all transactions where the user is either
   * the sender OR the receiver — giving a full 360° view of their activity.
   *
   * Interview Talking Point:
   * "Rather than joining wallet_transactions from the Wallet Service, the
   *  Transaction Service owns a clean, queryable ledger. This separation
   *  means we can independently scale read-heavy transaction history queries
   *  (add read replicas, move to Elasticsearch, etc.) without touching the
   *  Wallet Service's hot write path."
   */
  static async getByUser(userId: string, page = 1, limit = 20) {
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          OR: [
            { fromUserId: userId },
            { toUserId:   userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.transaction.count({
        where: {
          OR: [
            { fromUserId: userId },
            { toUserId:   userId },
          ],
        },
      }),
    ]);

    return { transactions, total, page, limit };
  }

  /**
   * Fetch a single transaction by its UUID.
   * Only visible if the requesting user is the sender or receiver.
   */
  static async getById(id: string, userId: string) {
    const transaction = await prisma.transaction.findUnique({ where: { id } });

    if (!transaction) {
      throw new Error('Transaction not found.');
    }

    if (transaction.fromUserId !== userId && transaction.toUserId !== userId) {
      throw new Error('Forbidden: you are not a participant in this transaction.');
    }

    return transaction;
  }
}
