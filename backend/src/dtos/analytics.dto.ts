export interface CountrySalaryAnalyticsDTO {
  country: string;
  currency: string;
  avgSalary: string;
  minSalary: string;
  maxSalary: string;
  count: number;
}

export interface DepartmentHeadcountDTO {
  department: string;
  count: number;
}

export interface EmploymentTypeHeadcountDTO {
  employmentType: string;
  count: number;
}

export interface AnalyticsSummaryDTO {
  headcount: number;
  byCountry: CountrySalaryAnalyticsDTO[];
  byDepartment: DepartmentHeadcountDTO[];
  byEmploymentType: EmploymentTypeHeadcountDTO[];
}
