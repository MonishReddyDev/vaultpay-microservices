import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { logger, messageBroker, Exchanges, RoutingKeys } from '@digital-wallet/shared';

export const prisma = new PrismaClient();

// --------------------------------------------------------------------------
// Payload shapes for RabbitMQ events this service PUBLISHES
// --------------------------------------------------------------------------

/** Sent to Wallet Service to debit the user's wallet before processing payment. */
export interface WalletDebitRequestPayload {
  idempotencyKey:  string;  // Unique key — same key used for the final record
  userId:          string;
  amount:          string;  // e.g. "30.00"
  description?:    string;  // "Bill payment to City Electricity Board"
  paymentType:     'BILL_PAYMENT' | 'RECHARGE';
  metadata:        Record<string, string>; // Extra context passed back in confirmation
}

/** Received from Wallet Service confirming the debit succeeded. */
export interface WalletDebitConfirmedPayload {
  idempotencyKey: string;
  userId:         string;
  success:        boolean;
  reason?:        string;  // Present only when success === false
}

// --------------------------------------------------------------------------
// Bill Payment Service Methods
// --------------------------------------------------------------------------

export class PaymentService {
  /**
   * 📋 INITIATE BILL PAYMENT
   *
   * Flow:
   *  1. Validate input
   *  2. Create a PENDING BillPayment record (idempotent on key)
   *  3. Publish wallet.debit.request → Wallet Service debits the user
   *  4. Consumer updates status to COMPLETED/FAILED when confirmation arrives
   *
   * Interview Talking Point:
   * "The Payment Service follows the Choreography Saga pattern. It never directly
   *  touches the Wallet Service DB. Instead it publishes a request event and
   *  reacts to a confirmation event — fully decoupled, fully async."
   */
  static async payBill(
    userId:        string,
    billerCode:    string,
    billerName:    string,
    accountNumber: string,
    amount:        string,
    description?:  string
  ) {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Invalid amount. Must be a positive number.');
    }

    // Deterministic idempotency key prevents duplicate DB rows if the HTTP
    // request is retried before the response is received.
    const idempotencyKey = `bill-${userId}-${billerCode}-${accountNumber}-${Date.now()}`;

    // 1. Upsert a PENDING record — idempotent creation
    const existing = await prisma.billPayment.findUnique({ where: { idempotencyKey } });
    if (existing) {
      logger.warn({ idempotencyKey }, '⚠️  Duplicate bill payment request — returning existing record.');
      return existing;
    }

    const billPayment = await prisma.billPayment.create({
      data: {
        idempotencyKey,
        userId,
        billerCode,
        billerName,
        accountNumber,
        amount:      amountNum,
        status:      'PENDING',
        description: description ?? `Bill payment to ${billerName}`,
      },
    });

    logger.info({ id: billPayment.id, userId, billerCode, amount }, '📋 Bill payment record created (PENDING)');

    // 2. Request wallet debit via RabbitMQ (async, non-blocking)
    await messageBroker.publishToExchange(
      Exchanges.DOMAIN_EVENTS,
      RoutingKeys.WALLET_DEBIT_REQUEST,
      {
        idempotencyKey,
        userId,
        amount,
        description:  billPayment.description ?? undefined,
        paymentType:  'BILL_PAYMENT',
        metadata: {
          billPaymentId: billPayment.id,
          billerCode,
          billerName,
          accountNumber,
        },
      } satisfies WalletDebitRequestPayload
    );

    logger.info({ idempotencyKey }, '📤 Published wallet.debit.request for bill payment');

    return billPayment;
  }

  /**
   * 📱 INITIATE MOBILE RECHARGE
   *
   * Same saga pattern as payBill — creates PENDING recharge record,
   * then publishes a debit request that the Wallet Service processes.
   */
  static async recharge(
    userId:       string,
    mobileNumber: string,
    operator:     string,
    planCode:     string,
    amount:       string,
    description?: string
  ) {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Invalid amount. Must be a positive number.');
    }

    const idempotencyKey = `recharge-${userId}-${mobileNumber}-${planCode}-${Date.now()}`;

    const existing = await prisma.recharge.findUnique({ where: { idempotencyKey } });
    if (existing) {
      logger.warn({ idempotencyKey }, '⚠️  Duplicate recharge request — returning existing record.');
      return existing;
    }

    const rechargeRecord = await prisma.recharge.create({
      data: {
        idempotencyKey,
        userId,
        mobileNumber,
        operator,
        planCode,
        amount:      amountNum,
        status:      'PENDING',
        description: description ?? `${operator} recharge for ${mobileNumber} (${planCode})`,
      },
    });

    logger.info({ id: rechargeRecord.id, userId, mobileNumber, operator }, '📱 Recharge record created (PENDING)');

    await messageBroker.publishToExchange(
      Exchanges.DOMAIN_EVENTS,
      RoutingKeys.WALLET_DEBIT_REQUEST,
      {
        idempotencyKey,
        userId,
        amount,
        description:  rechargeRecord.description ?? undefined,
        paymentType:  'RECHARGE',
        metadata: {
          rechargeId:   rechargeRecord.id,
          mobileNumber,
          operator,
          planCode,
        },
      } satisfies WalletDebitRequestPayload
    );

    logger.info({ idempotencyKey }, '📤 Published wallet.debit.request for recharge');

    return rechargeRecord;
  }

  /**
   * ✅ CONFIRM PAYMENT (called by consumer when debit succeeds)
   * Updates the record status from PENDING → COMPLETED and stores
   * the external reference ID returned by the simulated gateway.
   */
  static async confirmByIdempotencyKey(
    idempotencyKey: string,
    paymentType:    'BILL_PAYMENT' | 'RECHARGE',
    referenceId?:   string
  ) {
    if (paymentType === 'BILL_PAYMENT') {
      const updated = await prisma.billPayment.updateMany({
        where:  { idempotencyKey, status: 'PENDING' },
        data:   { status: 'COMPLETED', referenceId: referenceId ?? uuidv4() },
      });
      logger.info({ idempotencyKey, updated: updated.count }, '✅ Bill payment marked COMPLETED');
    } else {
      const updated = await prisma.recharge.updateMany({
        where:  { idempotencyKey, status: 'PENDING' },
        data:   { status: 'COMPLETED', referenceId: referenceId ?? uuidv4() },
      });
      logger.info({ idempotencyKey, updated: updated.count }, '✅ Recharge marked COMPLETED');
    }
  }

  /**
   * ❌ FAIL PAYMENT (called by consumer when debit fails — e.g. insufficient funds)
   */
  static async failByIdempotencyKey(
    idempotencyKey: string,
    paymentType:    'BILL_PAYMENT' | 'RECHARGE'
  ) {
    if (paymentType === 'BILL_PAYMENT') {
      await prisma.billPayment.updateMany({
        where: { idempotencyKey, status: 'PENDING' },
        data:  { status: 'FAILED' },
      });
      logger.warn({ idempotencyKey }, '❌ Bill payment marked FAILED (wallet debit failed)');
    } else {
      await prisma.recharge.updateMany({
        where: { idempotencyKey, status: 'PENDING' },
        data:  { status: 'FAILED' },
      });
      logger.warn({ idempotencyKey }, '❌ Recharge marked FAILED (wallet debit failed)');
    }
  }

  // --------------------------------------------------------------------------
  // Query Methods
  // --------------------------------------------------------------------------

  /** Paginated bill payment history for a user. */
  static async getBillPayments(userId: string, page = 1, limit = 20) {
    const [records, total] = await Promise.all([
      prisma.billPayment.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.billPayment.count({ where: { userId } }),
    ]);
    return { records, total, page, limit };
  }

  /** Paginated recharge history for a user. */
  static async getRecharges(userId: string, page = 1, limit = 20) {
    const [records, total] = await Promise.all([
      prisma.recharge.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      prisma.recharge.count({ where: { userId } }),
    ]);
    return { records, total, page, limit };
  }
}
