import { FastifyInstance } from 'fastify';
import proxy from '@fastify/http-proxy';
import { logger } from '@digital-wallet/shared';
import { authPlugin } from './plugins/auth';

// Define the target URLs for our internal microservices
// In Docker, the container name resolves to the IP address

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: any;
  }
}

const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  wallet: process.env.WALLET_SERVICE_URL || 'http://localhost:3002',
  transaction: process.env.TRANSACTION_SERVICE_URL || 'http://localhost:3003',
  payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004',
};

export async function setupProxies(app: FastifyInstance) {
  // Register the authentication plugin
  await app.register(authPlugin);
  
  logger.info('Setting up API Gateway reverse proxies...');

  // --- PROTECTED PROXY CONFIG ---
  // preHandler verifies the JWT and attaches request.user.
  // rewriteRequestHeaders (called by @fastify/reply-from when building the upstream request)
  // receives the Fastify request as its first argument, so request.user is available here.
  // We inject identity headers at this single point to avoid the double-write bug where
  // setting request.headers[key] = val may mutate a throwaway copy (when additionalHeaders
  // is set on the Fastify request), and where an undefined value in the return object
  // would override the already-correct value spread from ...headers.
  const protectedProxyOptions = {
    preHandler: async (request: any, reply: any) => {
      await app.authenticate(request, reply);
    },
    replyOptions: {
      rewriteRequestHeaders: (request: any, headers: any) => {
        // request is the Fastify request object (per @fastify/reply-from v9 source, line 141)
        // headers is already { ...request.raw.headers } — a copy of raw incoming headers
        if (!request.user) {
          return headers;
        }
        return {
          ...headers,
          'x-user-id': String(request.user.id),
          'x-user-email': String(request.user.email),
          'x-user-phone': String(request.user.phone),
        };
      }
    }
  };

  // --- AUTH SERVICE (Consolidated) ---
  app.register(proxy, {
    upstream: SERVICES.auth,
    prefix: '/api/auth',
    rewritePrefix: '',
    preHandler: async (request: any, reply: any) => {
      const url = request.url; // e.g. /api/auth/login or /api/auth/profile
      const isPublic = url.includes('login') || url.includes('register');
      if (!isPublic) {
        await app.authenticate(request, reply);
      }
    },
    replyOptions: {
      rewriteRequestHeaders: (request: any, headers: any) => {
        if (!request.user) {
          return headers;
        }
        return {
          ...headers,
          'x-user-id': String(request.user.id),
          'x-user-email': String(request.user.email),
          'x-user-phone': String(request.user.phone),
        };
      }
    }
  });

  // --- OTHER SERVICES ---
  // Route: GET /api/wallet/lookup?phone=... -> Resolve recipient user by phone via Auth Service
  app.get('/api/wallet/lookup', {
    preHandler: async (request: any, reply: any) => {
      await app.authenticate(request, reply);
    },
    handler: async (request: any, reply: any) => {
      const { phone } = request.query as { phone?: string };
      if (!phone) {
        return reply.code(400).send({ success: false, error: 'Phone parameter is required' });
      }

      try {
        const authUrl = SERVICES.auth; // e.g. http://auth-service:3001
        const response = await fetch(`${authUrl}/internal/users/by-phone/${encodeURIComponent(phone)}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            return reply.code(404).send({ success: false, error: 'Recipient not found' });
          }
          return reply.code(response.status).send({ success: false, error: 'Lookup failed' });
        }

        const body = await response.json();
        return reply.send(body);
      } catch (error) {
        logger.error({ error }, 'Error during recipient lookup');
        return reply.code(500).send({ success: false, error: 'Internal server error during recipient lookup' });
      }
    }
  });

  // Route: /api/wallet/* -> Wallet Service
  app.register(proxy, {
    upstream: SERVICES.wallet,
    prefix: '/api/wallet',
    rewritePrefix: '',
    ...protectedProxyOptions
  });

  // Route: /api/transactions/* -> Transaction Service
  app.register(proxy, {
    upstream: SERVICES.transaction,
    prefix: '/api/transactions',
    rewritePrefix: '',
    ...protectedProxyOptions
  });

  // Route: /api/bills/* -> Payment Service
  app.register(proxy, {
    upstream: SERVICES.payment,
    prefix: '/api/bills',
    rewritePrefix: '',
    ...protectedProxyOptions
  });

  // Route: /api/recharge/* -> Payment Service
  app.register(proxy, {
    upstream: SERVICES.payment,
    prefix: '/api/recharge',
    rewritePrefix: '/api/recharge',
    ...protectedProxyOptions
  });

  logger.info('Upstream services configured:');
  Object.entries(SERVICES).forEach(([name, url]) => {
    logger.info(`- ${name.toUpperCase()} Service: ${url}`);
  });
}
