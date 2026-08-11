import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { prisma } from '../../src/db';
import * as employeeService from '../../src/services/employeeService';
import { CreateEmployeeDTO } from '../../src/dtos/employee.dto';

describe('Phase I — Employee Integration Tests (Real PostgreSQL)', () => {
  const createdIds: string[] = [];

  afterEach(async () => {
    // Clean up created records after each test
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

  it('Create + retrieve round-trip: persists all fields with exact Decimal salary', async () => {
    const input: CreateEmployeeDTO = {
      fullName: 'Integration Test User',
      department: 'Engineering',
      jobTitle: 'QA Lead',
      employmentType: 'Full-time',
      hireDate: '2023-05-15',
      country: 'United States',
      currency: 'USD',
      salary: 135000.50,
    };

    const created = await employeeService.createEmployee(input);
    createdIds.push(created.id);

    expect(created.id).toBeDefined();
    expect(created.fullName).toBe('Integration Test User');
    expect(created.country).toBe('United States');
    expect(created.currency).toBe('USD');
    expect(created.salary).toBe('135000.50');
    expect(created.isActive).toBe(true);

    // Retrieve via service
    const found = await employeeService.getEmployeeById(created.id);
    expect(found).not.toBeNull();
    expect(found?.fullName).toBe('Integration Test User');
    expect(found?.salary).toBe('135000.50');
  });

  it('Soft delete — list exclusion: deactivated employee is excluded from GET employees list', async () => {
    const input: CreateEmployeeDTO = {
      fullName: 'Deactivate Target User',
      department: 'Sales',
      jobTitle: 'Sales Representative',
      employmentType: 'Contract',
      hireDate: '2022-01-10',
      country: 'United Kingdom',
      currency: 'GBP',
      salary: 45000,
    };

    const created = await employeeService.createEmployee(input);
    createdIds.push(created.id);

    // Verify it initially appears in list query
    const initialList = await employeeService.getEmployees({
      search: 'Deactivate Target User',
    });
    expect(initialList.data.some((e) => e.id === created.id)).toBe(true);

    // Soft delete
    const deactivated = await employeeService.deactivateEmployee(created.id);
    expect(deactivated.isActive).toBe(false);

    // Verify it is now EXCLUDED from active listing
    const postList = await employeeService.getEmployees({
      search: 'Deactivate Target User',
    });
    expect(postList.data.some((e) => e.id === created.id)).toBe(false);
  });

  it('Case-insensitive search: finds employees regardless of letter case', async () => {
    const input: CreateEmployeeDTO = {
      fullName: 'UniqueCaseSearchPerson',
      department: 'Marketing',
      jobTitle: 'SEO Specialist',
      employmentType: 'Part-time',
      hireDate: '2024-02-01',
      country: 'India',
      currency: 'INR',
      salary: 1200000,
    };

    const created = await employeeService.createEmployee(input);
    createdIds.push(created.id);

    // Search lowercase
    const searchLower = await employeeService.getEmployees({
      search: 'uniquecase',
    });
    expect(searchLower.data.some((e) => e.id === created.id)).toBe(true);

    // Search uppercase
    const searchUpper = await employeeService.getEmployees({
      search: 'UNIQUECASE',
    });
    expect(searchUpper.data.some((e) => e.id === created.id)).toBe(true);
  });
});
