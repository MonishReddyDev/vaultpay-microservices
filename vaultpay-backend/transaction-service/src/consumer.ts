import { logger, messageBroker, Exchanges } from '@digital-wallet/shared';
import { TransactionService, TransferEventPayload } from './service';

/**
 * 🎯 CHOREOGRAPHY SAGA PATTERN — Transaction Service Consumer
 *
 * Listens for `wallet.transfer.completed` events published by the Wallet
 * Service after every successful atomic transfer. When the event arrives,
 * it records an immutable entry in the Transaction ledger.
 *
 * Key Design Decisions:
 * 1. DURABLE NAMED QUEUE: Messages wait in RabbitMQ if this service is down
 *    and are processed on recovery — zero message loss.
 *
 * 2. IDEMPOTENCY GUARD: TransactionService.record() uses a unique
 *    idempotencyKey index. If RabbitMQ re-delivers the same message (e.g.
 *    after a crash before the consumer sent its ACK), the second write is
 *    a silent no-op — no duplicate ledger entries.
 *
 * 3. NO HTTP COUPLING: The Transaction Service never calls the Wallet Service
 *    or Auth Service over HTTP. It only reacts to events — pure event-driven.
 *
 * Interview Talking Point:
 * "This consumer is the living proof of the Choreography Saga pattern. The
 *  Wallet Service is the 'choreographer' that emits state-change events. The
 *  Transaction Service is a completely decoupled 'dancer' that reacts to those
 *  events. If I ever need a Notification Service, I just add another consumer
 *  on the same exchange — zero code changes to the Wallet or Transaction Service."
 */

const TRANSFER_COMPLETED_ROUTING_KEY = 'wallet.transfer.completed';
const CREDIT_COMPLETED_ROUTING_KEY   = 'wallet.credit.completed';
const DEBIT_CONFIRMED_ROUTING_KEY    = 'wallet.debit.confirmed';

const QUEUE_NAME_TRANSFER = 'transaction-service.transfer-completed';
const QUEUE_NAME_CREDIT   = 'transaction-service.credit-completed';
const QUEUE_NAME_DEBIT    = 'transaction-service.debit-confirmed';

export async function startConsumers(): Promise<void> {
  logger.info('Starting Transaction Service RabbitMQ consumers...');

  // 1. Transfer Completed Consumer
  await messageBroker.consumeQueue(
    Exchanges.DOMAIN_EVENTS,         // Exchange: 'wallet.domain.events'
    QUEUE_NAME_TRANSFER,              // Durable named queue
    TRANSFER_COMPLETED_ROUTING_KEY,   // Routing key
    async (event: TransferEventPayload) => {
      logger.info(
        { idempotencyKey: event.idempotencyKey, from: event.fromUserId, to: event.toUserId },
        `📨 Received wallet.transfer.completed event`
      );
      await TransactionService.record({ ...event, type: 'TRANSFER' });
    }
  );

  // 2. Credit Completed (Top-Up) Consumer
  await messageBroker.consumeQueue(
    Exchanges.DOMAIN_EVENTS,
    QUEUE_NAME_CREDIT,
    CREDIT_COMPLETED_ROUTING_KEY,
    async (event: any) => {
      logger.info(
        { idempotencyKey: event.idempotencyKey, userId: event.userId },
        `📨 Received wallet.credit.completed event`
      );
      await TransactionService.record({
        idempotencyKey: event.idempotencyKey,
        fromUserId: 'SYSTEM',
        toUserId: event.userId,
        amount: event.amount,
        currency: 'USD',
        description: event.description || 'Wallet Top-up',
        type: 'TOPUP'
      });
    }
  );

  // 3. Debit Confirmed (Bill Payment) Consumer
  await messageBroker.consumeQueue(
    Exchanges.DOMAIN_EVENTS,
    QUEUE_NAME_DEBIT,
    DEBIT_CONFIRMED_ROUTING_KEY,
    async (event: any) => {
      // We only want to record BILL_PAYMENT or RECHARGE types here
      if (event.success) {
        logger.info(
          { idempotencyKey: event.idempotencyKey, userId: event.userId },
          `📨 Received wallet.debit.confirmed event`
        );
        await TransactionService.record({
          idempotencyKey: event.idempotencyKey,
          fromUserId: event.userId,
          toUserId: 'SYSTEM',
          amount: event.amount,
          currency: 'USD',
          description: event.description || `Payment for ${event.paymentType}`,
          type: 'BILL_PAYMENT'
        });
      }
    }
  );

  logger.info('✅ Transaction Service consumers registered successfully.');
}
