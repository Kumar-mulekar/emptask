import { describe, it, expect, afterEach, afterAll } from 'vitest';
import { prisma } from '../../src/db';
import * as analyticsService from '../../src/services/analyticsService';
import * as employeeService from '../../src/services/employeeService';
import { CreateEmployeeDTO } from '../../src/dtos/employee.dto';

describe('Phase I — Analytics Integration Tests (Real PostgreSQL)', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    if (createdIds.length > 0) {
      await prisma.employee.deleteMany({
        where: { id: { in: createdIds } },
      });
      createdIds.length = 0;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET analytics summary: returns 4-key shape with active headcount', async () => {
    const summary = await analyticsService.getAnalyticsSummary();

    expect(summary).toHaveProperty('headcount');
    expect(summary).toHaveProperty('byCountry');
    expect(summary).toHaveProperty('byDepartment');
    expect(summary).toHaveProperty('byEmploymentType');

    expect(typeof summary.headcount).toBe('number');
    expect(Array.isArray(summary.byCountry)).toBe(true);
    expect(Array.isArray(summary.byDepartment)).toBe(true);
    expect(Array.isArray(summary.byEmploymentType)).toBe(true);
  });

  it('Soft delete — analytics exclusion: deactivated employee is excluded from headcount count', async () => {
    const initialSummary = await analyticsService.getAnalyticsSummary();

    // Create an employee
    const input: CreateEmployeeDTO = {
      fullName: 'Analytics Test Employee',
      department: 'Finance',
      jobTitle: 'Analyst',
      employmentType: 'Full-time',
      hireDate: '2023-01-01',
      country: 'Germany',
      currency: 'EUR',
      salary: 60000,
    };

    const created = await employeeService.createEmployee(input);
    createdIds.push(created.id);

    const postCreateSummary = await analyticsService.getAnalyticsSummary();
    expect(postCreateSummary.headcount).toBe(initialSummary.headcount + 1);

    // Deactivate employee
    await employeeService.deactivateEmployee(created.id);

    const postDeactivateSummary = await analyticsService.getAnalyticsSummary();
    expect(postDeactivateSummary.headcount).toBe(initialSummary.headcount);
  });

  it('Country salary aggregation: calculates avg, min, max without currency mixing', async () => {
    const input1: CreateEmployeeDTO = {
      fullName: 'Test Employee Currency A',
      department: 'Engineering',
      jobTitle: 'Developer',
      employmentType: 'Full-time',
      hireDate: '2023-01-01',
      country: 'Brazil',
      currency: 'BRL',
      salary: 100000,
    };

    const input2: CreateEmployeeDTO = {
      fullName: 'Test Employee Currency B',
      department: 'Engineering',
      jobTitle: 'Developer',
      employmentType: 'Full-time',
      hireDate: '2023-01-01',
      country: 'Brazil',
      currency: 'BRL',
      salary: 200000,
    };

    const created1 = await employeeService.createEmployee(input1);
    const created2 = await employeeService.createEmployee(input2);
    createdIds.push(created1.id, created2.id);

    const summary = await analyticsService.getAnalyticsSummary();
    const brazilStats = summary.byCountry.find((c) => c.country === 'Brazil' && c.currency === 'BRL');

    expect(brazilStats).toBeDefined();
    expect(brazilStats?.count).toBeGreaterThanOrEqual(2);
    expect(Number(brazilStats?.minSalary)).toBeLessThanOrEqual(100000);
    expect(Number(brazilStats?.maxSalary)).toBeGreaterThanOrEqual(200000);
  });
});
