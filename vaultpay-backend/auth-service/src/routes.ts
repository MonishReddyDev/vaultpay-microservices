import { FastifyInstance } from 'fastify';
import { AuthController } from './controller';

export async function routes(app: FastifyInstance) {
  app.post('/register', AuthController.register);
  app.post('/login', AuthController.login);
  app.get('/profile', AuthController.getProfile);
  app.put('/password', AuthController.changePassword);
  
  // Internal endpoint for Service-to-Service communication (e.g. Transaction service verifying user)
  app.get('/internal/users/by-phone/:phone', async (request, reply) => {
    // This route would normally have private network protections
    const { phone } = request.params as { phone: string };
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const user = await prisma.user.findUnique({ where: { phone } });
    if (!user) return reply.code(404).send({ success: false });
    
    return reply.send({ success: true, data: { id: user.id, name: user.name, phone: user.phone } });
  });
}
