import { PrismaClient, Prisma } from '@prisma/client';
import { logger, messageBroker, Exchanges, RoutingKeys } from '@digital-wallet/shared';

const prisma = new PrismaClient();

export class WalletService {
  /**
   * Called by the RabbitMQ consumer when a `user.registered` event arrives.
   * Creates a brand-new wallet for the user with a zero balance.
   * This is the Choreography Saga pattern in action.
   */
  static async createWallet(userId: string): Promise<void> {
    // Idempotency guard: if wallet already exists, skip silently
    const existing = await prisma.wallet.findUnique({ where: { userId } });
    if (existing) {
      logger.warn(`Wallet already exists for userId: ${userId}. Skipping creation.`);
      return;
    }

    const wallet = await prisma.wallet.create({
      data: { userId },
    });

    logger.info(`✅ Wallet created for userId: ${userId}, walletId: ${wallet.id}`);
  }

  /**
   * Returns the wallet and the last 10 transactions for a given user.
   */
  static async getBalance(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!wallet) {
      throw new Error('Wallet not found. It may not have been provisioned yet.');
    }

    return wallet;
  }

  /**
   * Atomically transfer money between two wallets.
   * Uses a Prisma $transaction to guarantee both the debit and credit
   * succeed or fail together — preventing partial updates.
   *
   * @param fromUserId - The sender's userId (from x-user-id gateway header)
   * @param toUserId   - The recipient's userId (looked up by phone via Auth Service)
   * @param amount     - The amount as a string (e.g., "50.00")
   */
  static async transfer(fromUserId: string, toUserId: string, amount: string, fromUserName?: string, toUserName?: string) {
    const amountDecimal = parseFloat(amount);

    if (isNaN(amountDecimal) || amountDecimal <= 0) {
      throw new Error('Invalid transfer amount. Must be a positive number.');
    }

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const [senderWallet, receiverWallet] = await Promise.all([
          prisma.wallet.findUnique({ where: { userId: fromUserId } }),
          prisma.wallet.findUnique({ where: { userId: toUserId } }),
        ]);

        if (!senderWallet) throw new Error('Sender wallet not found.');
        if (!receiverWallet) throw new Error('Recipient wallet not found.');

        const senderBalance = parseFloat(senderWallet.balance.toString());
        if (senderBalance < amountDecimal) {
          throw new Error(`Insufficient funds. Available balance: ${senderBalance.toFixed(2)}`);
        }

        // 🔒 ATOMICITY: Both DB operations run in a single transaction with version checks.
        const result = await prisma.$transaction(async (tx) => {
          // 1. Debit the sender (conditional update on sender's read version)
          const senderUpdate = await tx.wallet.updateMany({
            where: { id: senderWallet.id, version: senderWallet.version },
            data: { 
              balance: { decrement: amountDecimal },
              version: { increment: 1 }
            },
          });

          // 2. Credit the receiver (conditional update on receiver's read version)
          const receiverUpdate = await tx.wallet.updateMany({
            where: { id: receiverWallet.id, version: receiverWallet.version },
            data: { 
              balance: { increment: amountDecimal },
              version: { increment: 1 }
            },
          });

          if (senderUpdate.count === 0 || receiverUpdate.count === 0) {
            throw new Error('CONCURRENCY_CONFLICT');
          }

          // 3. Record the debit transaction for the sender
          await tx.walletTransaction.create({
            data: {
              walletId: senderWallet.id,
              type: 'DEBIT',
              amount: amountDecimal,
              description: toUserName ? `Transfer to ${toUserName}` : `Transfer to userId: ${toUserId}`,
            },
          });

          // 4. Record the credit transaction for the receiver
          await tx.walletTransaction.create({
            data: {
              walletId: receiverWallet.id,
              type: 'CREDIT',
              amount: amountDecimal,
              description: fromUserName ? `Transfer from ${fromUserName}` : `Transfer from userId: ${fromUserId}`,
            },
          });

          // Fetch the updated sender state to return their new balance
          const updatedSender = await tx.wallet.findUnique({ where: { id: senderWallet.id } });
          if (!updatedSender) throw new Error('Sender wallet went missing.');

          return { updatedSender };
        });

        logger.info(`💸 Transfer: $${amountDecimal} from ${fromUserId} → ${toUserId}`);

        // 📢 PUBLISH EVENT: Notify the Transaction Service via RabbitMQ.
        const idempotencyKey = `${senderWallet.id}-${receiverWallet.id}-${new Date().toISOString()}`;
        await messageBroker.publishToExchange(
          Exchanges.DOMAIN_EVENTS,
          RoutingKeys.TRANSFER_COMPLETED,
          {
            idempotencyKey,
            fromUserId,
            toUserId,
            amount:      amountDecimal.toFixed(2),
            currency:    'USD',
            description: toUserName ? `Transfer from ${fromUserName || 'User'} to ${toUserName}` : `Transfer from userId: ${fromUserId} to userId: ${toUserId}`,
          }
        );
        logger.info({ idempotencyKey }, '📤 Published wallet.transfer.completed event');

        return {
          message: 'Transfer successful',
          yourNewBalance: parseFloat(result.updatedSender.balance.toString()).toFixed(2),
        };

      } catch (error: any) {
        if (error.message === 'CONCURRENCY_CONFLICT') {
          attempts++;
          logger.warn(
            `Concurrency conflict during transfer from ${fromUserId} → ${toUserId}. Attempt ${attempts}/${maxAttempts}.`
          );
          if (attempts >= maxAttempts) {
            throw new Error('Transaction failed due to high concurrency. Please try again.');
          }
          // Backoff with random jitter
          const delayTime = Math.floor(Math.random() * 30) + 50 * attempts;
          await new Promise((resolve) => setTimeout(resolve, delayTime));
        } else {
          // Propagate valid logic errors (e.g. Insufficient funds) immediately
          throw error;
        }
      }
    }
    throw new Error('Transaction failed due to unexpected concurrency error.');
  }

  /**
   * Returns a paginated list of transactions for a user's wallet.
   */
  static async getTransactions(userId: string, page = 1, limit = 20) {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new Error('Wallet not found.');

    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return transactions;
  }

  /**
   * 💳 DEBIT FROM PAYMENT REQUEST (Choreography Saga — Payment Service leg)
   *
   * Called by the consumer when a `wallet.debit.request` event arrives from the
   * Payment Service (bill payment or mobile recharge).
   *
   * Flow:
   *  1. Validates the user's wallet & balance
   *  2. Atomically debits the wallet and writes a WalletTransaction row
   *  3a. On SUCCESS → publishes wallet.debit.confirmed so Payment Service can
   *      mark its record COMPLETED
   *  3b. On FAILURE (insufficient funds / wallet not found) → publishes
   *      wallet.debit.failed so Payment Service can mark its record FAILED
   *
   * Interview Talking Point:
   * "This method closes the Choreography Saga initiated by the Payment Service.
   *  The debit is still ACID atomic — if the WalletTransaction.create() fails
   *  mid-write, the balance decrement is rolled back automatically by Prisma's
   *  $transaction. The Payment Service never calls us over HTTP; it just reacts
   *  to the confirmed/failed event we publish."
   *
   * @param idempotencyKey - Passed back in the reply event so Payment Service
   *                         can correlate the confirmation to its PENDING record.
   * @param userId         - The Auth Service userId whose wallet should be debited.
   * @param amount         - Amount string, e.g. "30.00".
   * @param description    - Human-readable label stored in WalletTransaction.
   * @param paymentType    - 'BILL_PAYMENT' | 'RECHARGE' — echoed in the reply.
   * @param metadata       - Arbitrary k/v pairs from the Payment Service (e.g.
   *                         billerCode, mobileNumber) — echoed in the reply.
   */
  static async debitFromPayment(
    idempotencyKey: string,
    userId:         string,
    amount:         string,
    description:    string,
    paymentType:    'BILL_PAYMENT' | 'RECHARGE',
    metadata:       Record<string, string>
  ): Promise<void> {
    const amountDecimal = parseFloat(amount);

    if (isNaN(amountDecimal) || amountDecimal <= 0) {
      logger.error({ idempotencyKey, amount }, '❌ Invalid debit amount — publishing wallet.debit.failed');
      await messageBroker.publishToExchange(
        Exchanges.DOMAIN_EVENTS,
        RoutingKeys.WALLET_DEBIT_FAILED,
        { idempotencyKey, userId, success: false, paymentType, metadata, reason: 'Invalid amount' }
      );
      return;
    }

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const wallet = await prisma.wallet.findUnique({ where: { userId } });

        if (!wallet) {
          logger.error({ idempotencyKey, userId }, '❌ Wallet not found — publishing wallet.debit.failed');
          await messageBroker.publishToExchange(
            Exchanges.DOMAIN_EVENTS,
            RoutingKeys.WALLET_DEBIT_FAILED,
            { idempotencyKey, userId, success: false, paymentType, metadata, reason: 'Wallet not found' }
          );
          return;
        }

        const currentBalance = parseFloat(wallet.balance.toString());
        if (currentBalance < amountDecimal) {
          logger.warn(
            { idempotencyKey, userId, currentBalance, required: amountDecimal },
            '❌ Insufficient funds — publishing wallet.debit.failed'
          );
          await messageBroker.publishToExchange(
            Exchanges.DOMAIN_EVENTS,
            RoutingKeys.WALLET_DEBIT_FAILED,
            {
              idempotencyKey,
              userId,
              success:     false,
              paymentType,
              metadata,
              reason:      `Insufficient funds. Balance: ${currentBalance.toFixed(2)}, Required: ${amountDecimal.toFixed(2)}`,
            }
          );
          return;
        }

        // 🔒 ATOMIC: Debit + audit row with version check (OCC)
        const referenceId = `WAL-${wallet.id}-${Date.now()}`;
        await prisma.$transaction(async (tx) => {
          const updateResult = await tx.wallet.updateMany({
            where: { id: wallet.id, version: wallet.version },
            data:  { 
              balance: { decrement: amountDecimal },
              version: { increment: 1 }
            },
          });

          if (updateResult.count === 0) {
            throw new Error('CONCURRENCY_CONFLICT');
          }

          await tx.walletTransaction.create({
            data: {
              walletId:    wallet.id,
              type:        'DEBIT',
              amount:      amountDecimal,
              description: description || `Payment debit for ${paymentType}`,
            },
          });
        });

        logger.info(
          { idempotencyKey, userId, amountDecimal, paymentType },
          '✅ Wallet debited for payment — publishing wallet.debit.confirmed'
        );

        // ✅ Notify Payment Service the debit succeeded
        await messageBroker.publishToExchange(
          Exchanges.DOMAIN_EVENTS,
          RoutingKeys.WALLET_DEBIT_CONFIRMED,
          {
            idempotencyKey,
            userId,
            success:     true,
            paymentType,
            metadata,
            referenceId,
          }
        );
        return; // Success, break loop & return

      } catch (err: any) {
        if (err.message === 'CONCURRENCY_CONFLICT') {
          attempts++;
          logger.warn(
            { idempotencyKey, userId, attempt: attempts },
            'Concurrency conflict during payment debit. Retrying...'
          );
          if (attempts >= maxAttempts) {
            logger.error({ idempotencyKey, userId }, '❌ Max retries reached for payment debit due to concurrency conflicts');
            await messageBroker.publishToExchange(
              Exchanges.DOMAIN_EVENTS,
              RoutingKeys.WALLET_DEBIT_FAILED,
              { idempotencyKey, userId, success: false, paymentType, metadata, reason: 'Concurrency conflict limit exceeded' }
            );
            return;
          }
          const delayTime = Math.floor(Math.random() * 30) + 50 * attempts;
          await new Promise((resolve) => setTimeout(resolve, delayTime));
        } else {
          logger.error({ err, idempotencyKey, userId }, '❌ DB error during payment debit — publishing wallet.debit.failed');
          await messageBroker.publishToExchange(
            Exchanges.DOMAIN_EVENTS,
            RoutingKeys.WALLET_DEBIT_FAILED,
            { idempotencyKey, userId, success: false, paymentType, metadata, reason: err.message || 'Database error during debit' }
          );
          return;
        }
      }
    }
  }

  /**
   * 💰 ADD MONEY (Top-up / Deposit)
   *
   * Credits the user's wallet. In a real system this would be preceded by a
   * payment gateway charge (Stripe, Razorpay, etc.). Here it's a direct
   * top-up for demo/interview purposes.
   *
   * Atomically:
   *  1. Increments the wallet balance
   *  2. Creates a CREDIT WalletTransaction row as an audit trail
   *
   * @param userId      - Authenticated user's ID (from x-user-id header)
   * @param amount      - Deposit amount string, e.g. "500.00"
   * @param description - Optional label — defaults to "Wallet top-up"
   */
  static async addMoney(
    userId:       string,
    amount:       string,
    description?: string
  ) {
    const amountDecimal = parseFloat(amount);

    if (isNaN(amountDecimal) || amountDecimal < 1) {
      throw new Error('Minimum top-up amount is 1.00.');
    }

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
      try {
        const wallet = await prisma.wallet.findUnique({ where: { userId } });
        if (!wallet) throw new Error('Wallet not found.');

        const result = await prisma.$transaction(async (tx) => {
          const updateResult = await tx.wallet.updateMany({
            where: { id: wallet.id, version: wallet.version },
            data:  { 
              balance: { increment: amountDecimal },
              version: { increment: 1 }
            },
          });

          if (updateResult.count === 0) {
            throw new Error('CONCURRENCY_CONFLICT');
          }

          await tx.walletTransaction.create({
            data: {
              walletId:    wallet.id,
              type:        'CREDIT',
              amount:      amountDecimal,
              description: description || 'Wallet top-up',
            },
          });

          const updatedWallet = await tx.wallet.findUnique({ where: { id: wallet.id } });
          if (!updatedWallet) throw new Error('Wallet went missing during update.');
          return updatedWallet;
        });

        logger.info({ userId, amountDecimal }, '💰 Wallet topped up successfully');

        return {
          message:    'Money added successfully',
          newBalance: parseFloat(result.balance.toString()).toFixed(2),
          credited:   amountDecimal.toFixed(2),
        };

      } catch (error: any) {
        if (error.message === 'CONCURRENCY_CONFLICT') {
          attempts++;
          logger.warn(`Concurrency conflict during addMoney for user ${userId}. Attempt ${attempts}/${maxAttempts}.`);
          if (attempts >= maxAttempts) {
            throw new Error('Failed to top up wallet due to high concurrency. Please try again.');
          }
          const delayTime = Math.floor(Math.random() * 30) + 50 * attempts;
          await new Promise((resolve) => setTimeout(resolve, delayTime));
        } else {
          throw error;
        }
      }
    }
    throw new Error('Top-up failed due to unexpected error.');
  }
}

