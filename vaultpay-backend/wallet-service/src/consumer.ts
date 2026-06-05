import { logger, messageBroker, Exchanges, RoutingKeys } from '@digital-wallet/shared';
import { WalletService } from './service';

/**
 * 🎯 CHOREOGRAPHY SAGA PATTERN — Wallet Service Consumers
 *
 * This module registers TWO RabbitMQ consumers:
 *
 * ── Consumer 1: user.registered ───────────────────────────────────────────
 * Subscribes to the `user.registered` event from the Auth Service.
 * Auto-provisions a new zero-balance wallet for every new user.
 *
 * ── Consumer 2: wallet.debit.request ──────────────────────────────────────
 * Subscribes to the `wallet.debit.request` event from the Payment Service.
 * Atomically debits the user's wallet, then publishes either:
 *   • wallet.debit.confirmed  → Payment Service marks record COMPLETED
 *   • wallet.debit.failed     → Payment Service marks record FAILED
 *
 * Key Design Guarantees (shared across both consumers):
 * 1. DURABLE NAMED QUEUES: Messages wait in RabbitMQ if this service restarts.
 *    No messages are lost during deployments or crashes.
 * 2. IDEMPOTENCY: WalletService.createWallet() silently skips duplicate events.
 *    WalletService.debitFromPayment() is protected by the atomic Prisma transaction.
 * 3. NO HTTP COUPLING: Neither consumer calls any service over HTTP.
 *    Everything is purely event-driven.
 *
 * Interview Talking Point:
 * "Adding a second consumer here required zero changes to the Payment Service,
 *  API Gateway, or Auth Service. That's the power of EDA — new behaviours are
 *  added by subscribing to events, not by modifying existing services."
 */
export async function startConsumers(): Promise<void> {
  logger.info('Starting Wallet Service RabbitMQ consumers...');

  // ── Consumer 1: Provision wallet on user registration ─────────────────────
  await messageBroker.consumeQueue(
    Exchanges.DOMAIN_EVENTS,              // Exchange : 'wallet.domain.events'
    'wallet-service.user-registered',     // Queue    : durable, named
    RoutingKeys.USER_REGISTERED,          // Routing  : 'user.registered'
    async (event: { userId: string; email: string; name: string }) => {
      logger.info({ userId: event.userId }, '📨 user.registered → creating wallet');
      await WalletService.createWallet(event.userId);
    }
  );

  // ── Consumer 2: Debit wallet on behalf of the Payment Service ─────────────
  // This closes the Choreography Saga loop:
  //
  //   Payment Service          Wallet Service (here)         Payment Service consumer
  //        │                          │                               │
  //        │─ wallet.debit.request ──►│                               │
  //        │                          │── atomic debit ──►DB          │
  //        │                          │── wallet.debit.confirmed ─────►│
  //        │                          │   OR wallet.debit.failed  ────►│
  //
  await messageBroker.consumeQueue(
    Exchanges.DOMAIN_EVENTS,              // Exchange : 'wallet.domain.events'
    'wallet-service.debit-request',       // Queue    : durable, named
    RoutingKeys.WALLET_DEBIT_REQUEST,     // Routing  : 'wallet.debit.request'
    async (event: {
      idempotencyKey: string;
      userId:         string;
      amount:         string;
      description?:   string;
      paymentType:    'BILL_PAYMENT' | 'RECHARGE';
      metadata:       Record<string, string>;
    }) => {
      logger.info(
        { idempotencyKey: event.idempotencyKey, userId: event.userId, amount: event.amount },
        '📨 wallet.debit.request → processing payment debit'
      );
      await WalletService.debitFromPayment(
        event.idempotencyKey,
        event.userId,
        event.amount,
        event.description ?? `Payment debit for ${event.paymentType}`,
        event.paymentType,
        event.metadata ?? {}
      );
    }
  );

  logger.info('✅ All Wallet Service consumers registered successfully.');
}
