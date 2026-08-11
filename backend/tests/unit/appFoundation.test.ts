import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/index';
import { prisma } from '../../src/db';
import { FastifyInstance } from 'fastify';

describe('Phase C — Backend Foundation & Authoritative Validation', () => {
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

  it('POST /api/employees with invalid country abbreviation ("USA", "UK") should return 400 Bad Request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/employees',
      payload: {
        fullName: 'Test User',
        department: 'Engineering',
        jobTitle: 'Developer',
        employmentType: 'Full-time',
        hireDate: '2023-01-01',
        country: 'USA', // Abbreviation rejected
        currency: 'USD',
        salary: 100000,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.error).toContain('Validation Error');
  });

  it('POST /api/employees with invalid currency code ("USDD") should return 400 Bad Request', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/employees',
      payload: {
        fullName: 'Test User',
        department: 'Engineering',
        jobTitle: 'Developer',
        employmentType: 'Full-time',
        hireDate: '2023-01-01',
        country: 'United States',
        currency: 'USDD', // 4-letter invalid code rejected
        salary: 100000,
      },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.error).toContain('Validation Error');
  });
});
