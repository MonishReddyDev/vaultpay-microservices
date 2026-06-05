import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './service';
import jwt from 'jsonwebtoken';
import { logger } from '@digital-wallet/shared';

// Ideally, this comes from ENV
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-auth';

export class AuthController {
  static async register(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = await AuthService.register(request.body as any);
      
      const token = jwt.sign(
        { id: user.id, email: user.email, phone: user.phone },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
      );

      return reply.code(201).send({
        success: true,
        message: 'User registered successfully',
        data: { user, token },
      });
    } catch (error: any) {
      logger.error(error);
      return reply.code(400).send({
        success: false,
        message: error.message,
      });
    }
  }

  static async login(request: FastifyRequest, reply: FastifyReply) {
    try {
      const user = await AuthService.login(request.body as any);
      
      const token = jwt.sign(
        { id: user.id, email: user.email, phone: user.phone },
        JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
      );

      return reply.code(200).send({
        success: true,
        message: 'Login successful',
        data: { user, token },
      });
    } catch (error: any) {
      logger.error(error);
      return reply.code(401).send({
        success: false,
        message: 'Invalid credentials',
      });
    }
  }

  static async getProfile(request: FastifyRequest, reply: FastifyReply) {
    try {
      // In a real system, the API Gateway parses the JWT and passes the userId in headers:
      const userId = request.headers['x-user-id'] as string;
      
      if (!userId) {
        return reply.code(401).send({ success: false, message: 'Unauthorized, missing user ID header from gateway' });
      }

      const user = await AuthService.getUserProfile(userId);

      return reply.code(200).send({
        success: true,
        data: user,
      });
    } catch (error: any) {
      logger.error(error);
      return reply.code(404).send({
        success: false,
        message: error.message,
      });
    }
  }

  static async changePassword(request: FastifyRequest, reply: FastifyReply) {
    try {
      const userId = request.headers['x-user-id'] as string;
      if (!userId) {
        return reply.code(401).send({ success: false, message: 'Unauthorized' });
      }

      const { oldPassword, newPassword } = request.body as any;
      if (!oldPassword || !newPassword) {
        return reply.code(400).send({ success: false, message: 'oldPassword and newPassword are required' });
      }

      await AuthService.changePassword(userId, oldPassword, newPassword);

      return reply.code(200).send({
        success: true,
        message: 'Password updated successfully'
      });
    } catch (error: any) {
      logger.error(error);
      const code = error.message.includes('Invalid current password') ? 400 : 500;
      return reply.code(code).send({
        success: false,
        message: error.message
      });
    }
  }
}
