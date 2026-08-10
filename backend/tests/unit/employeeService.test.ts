import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createEmployee,
  deactivateEmployee,
  getEmployeeById,
  getEmployees,
  updateEmployee,
} from '../../src/services/employeeService';
import { buildApp } from '../../src/index';
import { prisma } from '../../src/db';
import { FastifyInstance } from 'fastify';

// Mock Prisma client methods for unit tests
vi.mock('../../src/db', () => ({
  prisma: {
    employee: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

const mockEmployee = {
  id: 'c123',
  fullName: 'Alice Johnson',
  department: 'Engineering',
  jobTitle: 'Senior Engineer',
  employmentType: 'Full-time',
  hireDate: new Date('2021-03-15'),
  country: 'USA',
  currency: 'USD',
  salary: { toFixed: (n: number) => '120000.00' },
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('Phase D — Employee Service & API Unit Tests', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  describe('employeeService Logic', () => {
    it('getEmployees should return paginated envelope with salary as string', async () => {
      vi.mocked(prisma.employee.findMany).mockResolvedValue([mockEmployee as any]);
      vi.mocked(prisma.employee.count).mockResolvedValue(100);

      const result = await getEmployees({ page: 1, limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].salary).toBe('120000.00');
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 100,
        totalPages: 5,
      });

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true },
          skip: 0,
          take: 20,
        })
      );
    });

    it('getEmployees should apply name search and filters', async () => {
      vi.mocked(prisma.employee.findMany).mockResolvedValue([]);
      vi.mocked(prisma.employee.count).mockResolvedValue(0);

      await getEmployees({
        page: 2,
        limit: 10,
        search: 'Alice',
        country: 'USA',
        department: 'Engineering',
        employmentType: 'Full-time',
      });

      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            fullName: { contains: 'Alice', mode: 'insensitive' },
            country: 'USA',
            department: 'Engineering',
            employmentType: 'Full-time',
          },
          skip: 10,
          take: 10,
        })
      );
    });

    it('getEmployeeById should return employee DTO when active', async () => {
      vi.mocked(prisma.employee.findUnique).mockResolvedValue(mockEmployee as any);

      const result = await getEmployeeById('c123');
      expect(result.fullName).toBe('Alice Johnson');
      expect(result.salary).toBe('120000.00');
    });

    it('getEmployeeById should throw 404 when employee not found or inactive', async () => {
      vi.mocked(prisma.employee.findUnique).mockResolvedValue(null);

      await expect(getEmployeeById('missing')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Employee not found',
      });
    });

    it('createEmployee should create and return new employee DTO', async () => {
      vi.mocked(prisma.employee.create).mockResolvedValue(mockEmployee as any);

      const input = {
        fullName: 'Alice Johnson',
        department: 'Engineering',
        jobTitle: 'Senior Engineer',
        employmentType: 'Full-time',
        hireDate: '2021-03-15',
        country: 'USA',
        currency: 'USD',
        salary: 120000,
      };

      const result = await createEmployee(input);
      expect(result.id).toBe('c123');
      expect(result.salary).toBe('120000.00');
      expect(prisma.employee.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            fullName: 'Alice Johnson',
            isActive: true,
          }),
        })
      );
    });

    it('deactivateEmployee should set isActive = false (soft delete)', async () => {
      vi.mocked(prisma.employee.findUnique).mockResolvedValue(mockEmployee as any);
      vi.mocked(prisma.employee.update).mockResolvedValue({
        ...mockEmployee,
        isActive: false,
      } as any);

      const result = await deactivateEmployee('c123');
      expect(result.isActive).toBe(false);
      expect(prisma.employee.update).toHaveBeenCalledWith({
        where: { id: 'c123' },
        data: { isActive: false },
      });
    });

    it('deactivateEmployee should throw 409 conflict if already deactivated', async () => {
      vi.mocked(prisma.employee.findUnique).mockResolvedValue({
        ...mockEmployee,
        isActive: false,
      } as any);

      await expect(deactivateEmployee('c123')).rejects.toMatchObject({
        statusCode: 409,
        message: 'Employee is already deactivated',
      });
    });
  });

  describe('Employee Route Endpoints (Fastify inject)', () => {
    it('GET /api/employees should return 200 with list envelope', async () => {
      vi.mocked(prisma.employee.findMany).mockResolvedValue([mockEmployee as any]);
      vi.mocked(prisma.employee.count).mockResolvedValue(1);

      const res = await app.inject({
        method: 'GET',
        url: '/api/employees?page=1&limit=20',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.data).toHaveLength(1);
      expect(body.pagination.total).toBe(1);
    });

    it('POST /api/employees should return 400 when missing required fields', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/employees',
        payload: {
          fullName: 'Incomplete',
        },
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.payload);
      expect(body.error).toContain('Validation Error');
    });

    it('PATCH /api/employees/:id/deactivate should return 200 with deactivated record', async () => {
      vi.mocked(prisma.employee.findUnique).mockResolvedValue(mockEmployee as any);
      vi.mocked(prisma.employee.update).mockResolvedValue({
        ...mockEmployee,
        isActive: false,
      } as any);

      const res = await app.inject({
        method: 'PATCH',
        url: '/api/employees/c123/deactivate',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.payload);
      expect(body.isActive).toBe(false);
    });
  });
});
