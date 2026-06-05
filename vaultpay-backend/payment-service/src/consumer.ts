import { logger, messageBroker, Exchanges, RoutingKeys } from '@digital-wallet/shared';
import { PaymentService, WalletDebitConfirmedPayload } from './service';

/**
 * 🎯 CHOREOGRAPHY SAGA PATTERN — Payment Service Consumer
 *
 * This consumer closes the saga loop that begins when payBill() or recharge()
 * publishes a wallet.debit.request event.
 *
 * Flow:
 *   1. Payment Service initiates: create PENDING record → publish wallet.debit.request
 *   2. Wallet Service processes the debit (atomically) and publishes:
 *      - wallet.debit.confirmed  (success)
 *      - wallet.debit.failed     (insufficient funds or other error)
 *   3. THIS consumer picks up the confirmation/failure and updates the
 *      BillPayment or Recharge record status to COMPLETED or FAILED.
 *
 * Key Design Decisions:
 * 1. DURABLE NAMED QUEUES: Messages survive if this service restarts.
 * 2. IDEMPOTENCY: updateMany with status: 'PENDING' guard — replaying a
 *    confirmed event twice is a no-op (record is already COMPLETED).
 * 3. NO HTTP CALLS: The Payment Service never calls the Wallet Service over
 *    HTTP. Purely event-driven — zero runtime coupling.
 *
 * Interview Talking Point:
 * "The saga pattern here is Choreography, not Orchestration. There's no central
 *  coordinator. Each service reacts to events and emits new events. If I need
 *  to add a Notifications Service that sends a receipt email on payment, I just
 *  subscribe another consumer to the same exchange — zero changes to the
 *  Payment or Wallet Service."
 */

const DEBIT_CONFIRMED_QUEUE = 'payment-service.debit-confirmed';
const DEBIT_FAILED_QUEUE    = 'payment-service.debit-failed';

export async function startConsumers(): Promise<void> {
  logger.info('Starting Payment Service RabbitMQ consumers...');

  // ── Consumer 1: wallet.debit.confirmed ────────────────────────────────────
  // Wallet Service ACKs the debit succeeded → mark payment COMPLETED
  await messageBroker.consumeQueue(
    Exchanges.DOMAIN_EVENTS,
    DEBIT_CONFIRMED_QUEUE,
    RoutingKeys.WALLET_DEBIT_CONFIRMED,
    async (event: WalletDebitConfirmedPayload & { paymentType: 'BILL_PAYMENT' | 'RECHARGE'; referenceId?: string }) => {
      logger.info(
        { idempotencyKey: event.idempotencyKey, userId: event.userId },
        '📨 Received wallet.debit.confirmed — marking payment COMPLETED'
      );
      await PaymentService.confirmByIdempotencyKey(
        event.idempotencyKey,
        event.paymentType,
        event.referenceId
      );
    }
  );

  // ── Consumer 2: wallet.debit.failed ───────────────────────────────────────
  // Wallet Service signals the debit failed (e.g. insufficient funds)
  // → mark payment FAILED so the client gets an accurate status on poll
  await messageBroker.consumeQueue(
    Exchanges.DOMAIN_EVENTS,
    DEBIT_FAILED_QUEUE,
    RoutingKeys.WALLET_DEBIT_FAILED,
    async (event: WalletDebitConfirmedPayload & { paymentType: 'BILL_PAYMENT' | 'RECHARGE' }) => {
      logger.warn(
        { idempotencyKey: event.idempotencyKey, reason: event.reason },
        '📨 Received wallet.debit.failed — marking payment FAILED'
      );
      await PaymentService.failByIdempotencyKey(
        event.idempotencyKey,
        event.paymentType
      );
    }
  );

  logger.info('✅ Payment Service consumers registered successfully.');
}
