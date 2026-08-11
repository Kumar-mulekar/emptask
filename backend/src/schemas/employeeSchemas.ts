import { CANONICAL_COUNTRIES, ISO_4217_CURRENCIES } from '../utils/validationConstants';

export const getEmployeesQuerySchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', minimum: 1, default: 1 },
    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    search: { type: 'string', minLength: 1 },
    country: { type: 'string' },
    department: { type: 'string' },
    employmentType: { type: 'string', enum: ['Full-time', 'Part-time', 'Contract'] },
  },
};

export const createEmployeeSchema = {
  type: 'object',
  required: ['fullName', 'department', 'jobTitle', 'employmentType', 'hireDate', 'country', 'currency', 'salary'],
  properties: {
    fullName: { type: 'string', minLength: 1 },
    department: { type: 'string', minLength: 1 },
    jobTitle: { type: 'string', minLength: 1 },
    employmentType: { type: 'string', enum: ['Full-time', 'Part-time', 'Contract'] },
    hireDate: { type: 'string', format: 'date' },
    country: { type: 'string', enum: CANONICAL_COUNTRIES },
    currency: { type: 'string', enum: ISO_4217_CURRENCIES },
    salary: { type: 'number', exclusiveMinimum: 0 },
  },
  additionalProperties: false,
};

export const updateEmployeeSchema = {
  type: 'object',
  required: ['fullName', 'department', 'jobTitle', 'employmentType', 'hireDate', 'country', 'currency', 'salary'],
  properties: {
    fullName: { type: 'string', minLength: 1 },
    department: { type: 'string', minLength: 1 },
    jobTitle: { type: 'string', minLength: 1 },
    employmentType: { type: 'string', enum: ['Full-time', 'Part-time', 'Contract'] },
    hireDate: { type: 'string', format: 'date' },
    country: { type: 'string', enum: CANONICAL_COUNTRIES },
    currency: { type: 'string', enum: ISO_4217_CURRENCIES },
    salary: { type: 'number', exclusiveMinimum: 0 },
  },
  additionalProperties: false,
};

export const employeeIdParamsSchema = {
  type: 'object',
  required: ['id'],
  properties: {
    id: { type: 'string', minLength: 1 },
  },
};
