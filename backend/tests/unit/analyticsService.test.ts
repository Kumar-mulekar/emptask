import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAnalyticsSummary } from '../../src/services/analyticsService';
import { buildApp } from '../../src/index';
import { prisma } from '../../src/db';
import { FastifyInstance } from 'fastify';

// Mock Prisma client
vi.mock('../../src/db', () => ({
  prisma: {
    employee: {
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

describe('Phase E — Analytics Service & Route Unit Tests', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  it('getAnalyticsSummary should execute 4 concurrent queries and return formatted DTO', async () => {
    vi.mocked(prisma.employee.count).mockResolvedValue(10000);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      {
        country: 'USA',
        currency: 'USD',
        avgSalary: '112000.00',
        minSalary: '45000.00',
        maxSalary: '280000.00',
        count: 3200,
      },
    ] as any);
    (vi.mocked(prisma.employee.groupBy) as any).mockImplementation(async (args: any) => {
      if (args.by.includes('department')) {
        return [
          { department: 'Engineering', _count: { _all: 1800 } },
          { department: 'Product', _count: { _all: 900 } },
        ];
      }
      if (args.by.includes('employmentType')) {
        return [
          { employmentType: 'Full-time', _count: { _all: 8200 } },
          { employmentType: 'Contract', _count: { _all: 1100 } },
          { employmentType: 'Part-time', _count: { _all: 700 } },
        ];
      }
      return [];
    });

    const result = await getAnalyticsSummary();

    expect(result.headcount).toBe(10000);

    // Verify byCountry shape and string formatting
    expect(result.byCountry).toHaveLength(1);
    expect(result.byCountry[0]).toEqual({
      country: 'USA',
      currency: 'USD',
      avgSalary: '112000.00',
      minSalary: '45000.00',
      maxSalary: '280000.00',
      count: 3200,
    });

    // Verify byDepartment shape (headcount only — no salary fields!)
    expect(result.byDepartment).toEqual([
      { department: 'Engineering', count: 1800 },
      { department: 'Product', count: 900 },
    ]);
    expect((result.byDepartment[0] as any).salary).toBeUndefined();
    expect((result.byDepartment[0] as any).avgSalary).toBeUndefined();

    // Verify byEmploymentType shape
    expect(result.byEmploymentType).toHaveLength(3);
    expect(result.byEmploymentType[0]).toEqual({
      employmentType: 'Full-time',
      count: 8200,
    });
  });

  it('GET /api/analytics/summary route should respond with 200 and summary JSON', async () => {
    vi.mocked(prisma.employee.count).mockResolvedValue(10000);
    vi.mocked(prisma.$queryRaw).mockResolvedValue([
      {
        country: 'India',
        currency: 'INR',
        avgSalary: '1500000.00',
        minSalary: '400000.00',
        maxSalary: '3500000.00',
        count: 2800,
      },
    ] as any);
    (vi.mocked(prisma.employee.groupBy) as any).mockImplementation(async (args: any) => {
      if (args.by.includes('department')) {
        return [{ department: 'Engineering', _count: { _all: 1800 } }];
      }
      if (args.by.includes('employmentType')) {
        return [{ employmentType: 'Full-time', _count: { _all: 8200 } }];
      }
      return [];
    });

    const res = await app.inject({
      method: 'GET',
      url: '/api/analytics/summary',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.headcount).toBe(10000);
    expect(body.byCountry[0].country).toBe('India');
    expect(body.byDepartment[0]).toEqual({ department: 'Engineering', count: 1800 });
  });
});
