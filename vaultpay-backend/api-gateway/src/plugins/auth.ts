import fp from 'fastify-plugin';
import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import jwt from 'jsonwebtoken';
import { logger } from '@digital-wallet/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-for-auth';

// Extend FastifyRequest to include the decoded user payload
declare module 'fastify' {
  interface FastifyRequest {
    user?: { id: string; email: string; phone: string };
  }
}

export const authPlugin = fp(async (fastify: FastifyInstance) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Unauthorized: Missing or invalid token format' });
      }

      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; phone: string };
      
      // Attach the decoded user payload to the request for downstream processing
      request.user = decoded;

    } catch (error) {
      logger.warn({ err: error }, 'JWT Verification failed at API Gateway');
      return reply.code(401).send({ error: 'Unauthorized: Invalid or expired token' });
    }
  });
});
