import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { getAnalyticsSummary } from '../services/analyticsService';

export async function analyticsRoutes(fastify: FastifyInstance) {
  // GET /api/analytics/summary — Dashboard summary analytics
  fastify.get('/summary', async (_request: FastifyRequest, reply: FastifyReply) => {
    const summary = await getAnalyticsSummary();
    return reply.status(200).send(summary);
  });
}
