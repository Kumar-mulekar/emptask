import { describe, it, expect } from 'vitest';
import { seedDatabase } from '../../prisma/seed';

// Mock prisma.employee to intercept createMany without hitting a live DB in unit tests
import { vi } from 'vitest';
vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      employee = {
        deleteMany: vi.fn().mockResolvedValue({ count: 10000 }),
        createMany: vi.fn().mockResolvedValue({ count: 500 }),
      };
      $disconnect = vi.fn().mockResolvedValue(undefined);
    },
  };
});

describe('Phase B — Seed Determinism & Schema Verification', () => {
  it('should generate exactly 10,000 records', async () => {
    const records = await seedDatabase(42, 10000);
    expect(records.length).toBe(10000);
  });

  it('should be 100% deterministic — identical records across runs with same seed constant', async () => {
    const run1 = await seedDatabase(42, 10000);
    const run2 = await seedDatabase(42, 10000);

    expect(run1).toEqual(run2);
  });

  it('should verify country distribution and zero cross-currency mixing', async () => {
    const records = await seedDatabase(42, 10000);

    const countryCounts: Record<string, number> = {};
    const validPairs: Record<string, string> = {
      India: 'INR',
      USA: 'USD',
      UK: 'GBP',
      Germany: 'EUR',
      Canada: 'CAD',
      Australia: 'AUD',
      Singapore: 'SGD',
      UAE: 'AED',
    };

    for (const rec of records) {
      // Verify country count
      countryCounts[rec.country] = (countryCounts[rec.country] || 0) + 1;

      // Verify native currency mapping (no mixing)
      expect(rec.currency).toBe(validPairs[rec.country]);
    }

    // All 8 countries present
    expect(Object.keys(countryCounts).length).toBe(8);

    // Approximate weights check
    expect(countryCounts['India']).toBeGreaterThan(2500);
    expect(countryCounts['USA']).toBeGreaterThan(2200);
  });

  it('should verify employment type distribution', async () => {
    const records = await seedDatabase(42, 10000);
    const typeCounts: Record<string, number> = {};

    for (const rec of records) {
      typeCounts[rec.employmentType] = (typeCounts[rec.employmentType] || 0) + 1;
    }

    expect(typeCounts['Full-time']).toBeGreaterThan(7500);
    expect(typeCounts['Contract']).toBeGreaterThan(800);
    expect(typeCounts['Part-time']).toBeGreaterThan(500);
  });

  it('should verify active / inactive split', async () => {
    const records = await seedDatabase(42, 10000);
    const activeCount = records.filter((r) => r.isActive).length;
    const inactiveCount = records.filter((r) => !r.isActive).length;

    expect(activeCount).toBeGreaterThan(9000);
    expect(inactiveCount).toBeGreaterThan(300);
    expect(activeCount + inactiveCount).toBe(10000);
  });

  it('should verify salary ranges and rounding to nearest 1,000', async () => {
    const records = await seedDatabase(42, 10000);

    for (const rec of records) {
      expect(rec.salary % 1000).toBe(0);
      expect(rec.salary).toBeGreaterThan(0);
    }
  });
});
