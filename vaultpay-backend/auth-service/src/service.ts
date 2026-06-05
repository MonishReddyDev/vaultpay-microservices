import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { logger, messageBroker, Exchanges, RoutingKeys } from '@digital-wallet/shared';

const prisma = new PrismaClient();

export class AuthService {
  static async register(data: any) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existingUser) {
      throw new Error('User with this email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        kycVerified: true,
        createdAt: true,
      },
    });

    logger.info(`New user registered: ${newUser.email}. Publishing event.`);

    // 🚀 MICROSERVICES PATTERN: Event-Driven Architecture
    // We don't create the wallet here anymore. We publish an event.
    await messageBroker.publishToExchange(
      Exchanges.DOMAIN_EVENTS,
      RoutingKeys.USER_REGISTERED,
      {
        userId: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        name: newUser.name,
        timestamp: new Date().toISOString()
      }
    );

    return newUser;
  }

  static async login(data: any) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    logger.info(`User logged in: ${user.email}`);
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        kycVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }
    
    return user;
  }

  static async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid current password');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    logger.info(`User updated password: ${user.email}`);
    return true;
  }
}
