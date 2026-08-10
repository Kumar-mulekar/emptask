import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/index';
import { prisma } from '../../src/db';
import { FastifyInstance } from 'fastify';

describe('Phase C — Backend Foundation', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should export Prisma singleton instance', () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe('function');
  });

  it('GET /health should respond with status ok and timestamp', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
  });

  it('Invalid route should return 404 with standard error envelope', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/invalid-route-does-not-exist',
    });

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.payload);
    expect(body.error).toBeDefined();
    expect(body.statusCode).toBe(404);
  });
});
