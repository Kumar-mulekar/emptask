export interface Employee {
  id: string;
  fullName: string;
  department: string;
  jobTitle: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract';
  hireDate: string;
  country: string;
  currency: string;
  salary: string; // Decimal preserved as string e.g. "120000.00"
  isActive: boolean;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedEmployeesResponse {
  data: Employee[];
  pagination: PaginationMeta;
}

export interface EmployeeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  department?: string;
  employmentType?: string;
}

export interface CreateEmployeeInput {
  fullName: string;
  department: string;
  jobTitle: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract';
  hireDate: string;
  country: string;
  currency: string;
  salary: number;
}

export type UpdateEmployeeInput = CreateEmployeeInput;

export interface ApiErrorResponse {
  error: string;
  statusCode: number;
}
