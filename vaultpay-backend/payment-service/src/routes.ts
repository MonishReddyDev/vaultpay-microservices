import { FastifyInstance } from 'fastify';
import { PaymentController } from './controller';

export async function routes(app: FastifyInstance) {
  // ─── Bill Payments ─────────────────────────────────────────────────────────
  // Gateway proxy: prefix='/api/bills', rewritePrefix=''
  // → Client hits /api/bills/pay  → service receives POST /pay
  // → Client hits /api/bills      → service receives GET /

  app.post('/pay', PaymentController.payBill);
  app.get('/', PaymentController.getBills);

  // ─── Mobile Recharges ──────────────────────────────────────────────────────
  // Gateway proxy: prefix='/api/recharge', rewritePrefix='/api/recharge'
  // → Client hits /api/recharge   → service receives POST /api/recharge
  // → Client hits /api/recharge   → service receives GET  /api/recharge

  app.post('/api/recharge', PaymentController.recharge);
  app.get('/api/recharge', PaymentController.getRecharges);

  // ─── Internal Health Check ─────────────────────────────────────────────────
  app.get('/health', async () => ({
    service:   'payment-service',
    status:    'UP',
    timestamp: new Date().toISOString(),
  }));
}
