import { Prisma, Employee as PrismaEmployee } from '@prisma/client';
import { prisma } from '../db';

export interface EmployeeResponseDTO {
  id: string;
  fullName: string;
  department: string;
  jobTitle: string;
  employmentType: string;
  hireDate: string;
  country: string;
  currency: string;
  salary: string;
  isActive: boolean;
}

export interface GetEmployeesParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  department?: string;
  employmentType?: string;
}

export interface CreateEmployeeDTO {
  fullName: string;
  department: string;
  jobTitle: string;
  employmentType: string;
  hireDate: string;
  country: string;
  currency: string;
  salary: number;
}

export interface UpdateEmployeeDTO {
  fullName: string;
  department: string;
  jobTitle: string;
  employmentType: string;
  hireDate: string;
  country: string;
  currency: string;
  salary: number;
}

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function mapEmployeeToDTO(emp: PrismaEmployee): EmployeeResponseDTO {
  return {
    id: emp.id,
    fullName: emp.fullName,
    department: emp.department,
    jobTitle: emp.jobTitle,
    employmentType: emp.employmentType,
    hireDate: emp.hireDate instanceof Date ? emp.hireDate.toISOString().split('T')[0] : String(emp.hireDate).split('T')[0],
    country: emp.country,
    currency: emp.currency,
    salary: typeof emp.salary === 'object' && emp.salary !== null && 'toFixed' in emp.salary
      ? emp.salary.toFixed(2)
      : Number(emp.salary).toFixed(2),
    isActive: emp.isActive,
  };
}

export async function getEmployees(params: GetEmployeesParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const skip = (page - 1) * limit;

  const whereClause: Prisma.EmployeeWhereInput = {
    isActive: true,
  };

  if (params.search && params.search.trim() !== '') {
    whereClause.fullName = {
      contains: params.search.trim(),
      mode: 'insensitive',
    };
  }

  if (params.country) {
    whereClause.country = params.country;
  }

  if (params.department) {
    whereClause.department = params.department;
  }

  if (params.employmentType) {
    whereClause.employmentType = params.employmentType;
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.employee.count({
      where: whereClause,
    }),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: employees.map(mapEmployeeToDTO),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

export async function getEmployeeById(id: string): Promise<EmployeeResponseDTO> {
  const employee = await prisma.employee.findUnique({
    where: { id },
  });

  if (!employee || !employee.isActive) {
    throw new AppError('Employee not found', 404);
  }

  return mapEmployeeToDTO(employee);
}

export async function createEmployee(data: CreateEmployeeDTO): Promise<EmployeeResponseDTO> {
  const created = await prisma.employee.create({
    data: {
      fullName: data.fullName,
      department: data.department,
      jobTitle: data.jobTitle,
      employmentType: data.employmentType,
      hireDate: new Date(data.hireDate),
      country: data.country,
      currency: data.currency,
      salary: new Prisma.Decimal(data.salary),
      isActive: true,
    },
  });

  return mapEmployeeToDTO(created);
}

export async function updateEmployee(id: string, data: UpdateEmployeeDTO): Promise<EmployeeResponseDTO> {
  const existing = await prisma.employee.findUnique({
    where: { id },
  });

  if (!existing || !existing.isActive) {
    throw new AppError('Employee not found', 404);
  }

  const updated = await prisma.employee.update({
    where: { id },
    data: {
      fullName: data.fullName,
      department: data.department,
      jobTitle: data.jobTitle,
      employmentType: data.employmentType,
      hireDate: new Date(data.hireDate),
      country: data.country,
      currency: data.currency,
      salary: new Prisma.Decimal(data.salary),
    },
  });

  return mapEmployeeToDTO(updated);
}

export async function deactivateEmployee(id: string): Promise<EmployeeResponseDTO> {
  const existing = await prisma.employee.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('Employee not found', 404);
  }

  if (!existing.isActive) {
    throw new AppError('Employee is already deactivated', 409);
  }

  const deactivated = await prisma.employee.update({
    where: { id },
    data: {
      isActive: false,
    },
  });

  return mapEmployeeToDTO(deactivated);
}
