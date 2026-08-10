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

export type UpdateEmployeeDTO = CreateEmployeeDTO;
