export interface CountrySalaryAnalytics {
  country: string;
  currency: string;
  avgSalary: string;
  minSalary: string;
  maxSalary: string;
  count: number;
}

export interface DepartmentHeadcount {
  department: string;
  count: number;
}

export interface EmploymentTypeHeadcount {
  employmentType: string;
  count: number;
}

export interface AnalyticsSummary {
  headcount: number;
  byCountry: CountrySalaryAnalytics[];
  byDepartment: DepartmentHeadcount[];
  byEmploymentType: EmploymentTypeHeadcount[];
}
