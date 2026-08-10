import { prisma } from '../db';
import {
  AnalyticsSummaryDTO,
  CountrySalaryAnalyticsDTO,
  DepartmentHeadcountDTO,
  EmploymentTypeHeadcountDTO,
} from '../dtos/analytics.dto';

export type {
  AnalyticsSummaryDTO,
  CountrySalaryAnalyticsDTO,
  DepartmentHeadcountDTO,
  EmploymentTypeHeadcountDTO,
};

interface RawCountryQueryResult {
  country: string;
  currency: string;
  avgSalary: string | number;
  minSalary: string | number;
  maxSalary: string | number;
  count: bigint | number;
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummaryDTO> {
  // Four concurrent PostgreSQL aggregation queries executed via Promise.all
  const [headcount, rawCountryResult, rawDepartmentResult, rawEmploymentTypeResult] = await Promise.all([
    // Query 1: Active headcount
    prisma.employee.count({
      where: { isActive: true },
    }),

    // Query 2: Country salary aggregation (avg, min, max, count per country + currency)
    prisma.$queryRaw<RawCountryQueryResult[]>`
      SELECT 
        "country", 
        "currency", 
        AVG("salary")::text as "avgSalary", 
        MIN("salary")::text as "minSalary", 
        MAX("salary")::text as "maxSalary", 
        COUNT(*)::int as "count"
      FROM "Employee"
      WHERE "isActive" = true
      GROUP BY "country", "currency"
      ORDER BY "country" ASC
    `,

    // Query 3: Department headcount only (no salary fields)
    prisma.employee.groupBy({
      by: ['department'],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: { department: 'asc' },
    }),

    // Query 4: Employment type headcount
    prisma.employee.groupBy({
      by: ['employmentType'],
      where: { isActive: true },
      _count: { _all: true },
      orderBy: { employmentType: 'asc' },
    }),
  ]);

  // Format byCountry values: ensure salary values are formatted as 2-decimal strings
  const byCountry: CountrySalaryAnalyticsDTO[] = (rawCountryResult || []).map((row: RawCountryQueryResult) => ({
    country: row.country,
    currency: row.currency,
    avgSalary: Number(row.avgSalary).toFixed(2),
    minSalary: Number(row.minSalary).toFixed(2),
    maxSalary: Number(row.maxSalary).toFixed(2),
    count: Number(row.count),
  }));

  // Format byDepartment (headcount only)
  const byDepartment: DepartmentHeadcountDTO[] = (rawDepartmentResult || []).map(
    (row: { department: string; _count: { _all: number } }) => ({
      department: row.department,
      count: row._count._all,
    })
  );

  // Format byEmploymentType
  const byEmploymentType: EmploymentTypeHeadcountDTO[] = (rawEmploymentTypeResult || []).map(
    (row: { employmentType: string; _count: { _all: number } }) => ({
      employmentType: row.employmentType,
      count: row._count._all,
    })
  );

  return {
    headcount,
    byCountry,
    byDepartment,
    byEmploymentType,
  };
}
