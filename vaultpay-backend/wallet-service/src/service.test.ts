import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalletService } from './service';
import { PrismaClient } from '@prisma/client';
import { messageBroker } from '@digital-wallet/shared';

// We mock PrismaClient and messageBroker
vi.mock('@prisma/client', () => {
  const mPrismaClient = {
    wallet: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    walletTransaction: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  };
  return { 
    PrismaClient: class {
      constructor() {
        return mPrismaClient;
      }
    } 
  };
});

vi.mock('@digital-wallet/shared', () => ({
  messageBroker: {
    publishToExchange: vi.fn(),
  },
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
  Exchanges: {
    DOMAIN_EVENTS: 'domain_events',
  },
  RoutingKeys: {
    TRANSFER_COMPLETED: 'transfer.completed',
    WALLET_CREDIT_COMPLETED: 'wallet.credit.completed',
  },
}));

describe('WalletService', () => {
  let prisma: any;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
    
    // Default mock implementation for $transaction: simply execute the callback
    prisma.$transaction.mockImplementation(async (callback: any) => {
      return callback(prisma);
    });
  });

  describe('addMoney', () => {
    it('should successfully add money to an existing wallet', async () => {
      const mockWallet = { id: 'w1', userId: 'u1', balance: 100, version: 1 };
      
      prisma.wallet.findUnique.mockResolvedValueOnce(mockWallet);
      prisma.wallet.updateMany.mockResolvedValueOnce({ count: 1 });
      prisma.walletTransaction.create.mockResolvedValueOnce({ id: 'tx1' });
      prisma.wallet.findUnique.mockResolvedValueOnce({ ...mockWallet, balance: 150 });

      const result = await WalletService.addMoney('u1', '50.00', 'Deposit');

      expect(result.message).toBe('Money added successfully');
      expect(result.credited).toBe('50.00');
      
      // Verify prisma calls
      expect(prisma.wallet.updateMany).toHaveBeenCalledWith({
        where: { id: 'w1', version: 1 },
        data: { balance: { increment: 50 }, version: { increment: 1 } },
      });
      
      // Verify rabbitmq publish
      expect(messageBroker.publishToExchange).toHaveBeenCalledWith(
        'domain_events',
        'wallet.credit.completed',
        expect.objectContaining({ userId: 'u1', amount: '50.00' })
      );
    });

    it('should throw an error if amount is less than 1', async () => {
      await expect(WalletService.addMoney('u1', '-50.00'))
        .rejects
        .toThrow('Minimum top-up amount is 1.00.');
      
      expect(prisma.wallet.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('transfer', () => {
    it('should throw Insufficient funds if sender balance is too low', async () => {
      const mockSender = { id: 'w1', userId: 'u1', balance: 20, version: 1 };
      const mockReceiver = { id: 'w2', userId: 'u2', balance: 50, version: 1 };

      prisma.wallet.findUnique
        .mockResolvedValueOnce(mockSender)
        .mockResolvedValueOnce(mockReceiver);

      await expect(WalletService.transfer('u1', 'u2', '50.00'))
        .rejects
        .toThrow('Insufficient funds. Available balance: 20.00');
      
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should successfully transfer money between two wallets', async () => {
      const mockSender = { id: 'w1', userId: 'u1', balance: 100, version: 1 };
      const mockReceiver = { id: 'w2', userId: 'u2', balance: 50, version: 1 };

      // the first Promise.all array of finds
      prisma.wallet.findUnique
        .mockResolvedValueOnce(mockSender) // sender
        .mockResolvedValueOnce(mockReceiver); // receiver

      // inside the transaction
      prisma.wallet.updateMany
        .mockResolvedValueOnce({ count: 1 }) // debit
        .mockResolvedValueOnce({ count: 1 }); // credit
      
      // refetch sender at the end of transaction
      prisma.wallet.findUnique.mockResolvedValueOnce({ ...mockSender, balance: 50 });

      const result = await WalletService.transfer('u1', 'u2', '50.00');

      expect(result.message).toBe('Transfer successful');
      
      // verify rabbitmq
      expect(messageBroker.publishToExchange).toHaveBeenCalledWith(
        'domain_events',
        'transfer.completed',
        expect.objectContaining({ fromUserId: 'u1', toUserId: 'u2', amount: '50.00' })
      );
    });
  });
});
