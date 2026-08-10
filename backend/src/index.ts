import 'dotenv/config';
import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { prisma } from './db';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : {
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
  });

  // CORS configuration
  await app.register(cors, {
    origin: true,
  });

  // Global Error Handler — matching architecture contract: { "error": "...", "statusCode": N }
  app.setErrorHandler((error: Error & { statusCode?: number; validation?: unknown }, _request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode || 500;
    const message = error.validation ? 'Validation Error: ' + error.message : error.message || 'Internal Server Error';

    if (statusCode >= 500) {
      app.log.error(error);
    }

    reply.status(statusCode).send({
      error: message,
      statusCode,
    });
  });

  // Health Endpoint
  app.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  });

  // Employee API Routes
  const { employeeRoutes } = await import('./routes/employees');
  await app.register(employeeRoutes, { prefix: '/api/employees' });

  // Analytics API Routes
  const { analyticsRoutes } = await import('./routes/analytics');
  await app.register(analyticsRoutes, { prefix: '/api/analytics' });

  return app;
}

export async function startServer() {
  const app = await buildApp();

  // Setup Graceful Shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, starting graceful shutdown...`);
      try {
        await app.close();
        await prisma.$disconnect();
        app.log.info('Server and database connection closed cleanly.');
        process.exit(0);
      } catch (err) {
        app.log.error(err, 'Error during shutdown:');
        process.exit(1);
      }
    });
  }

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Server listening at http://${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err, 'Error starting server:');
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}
