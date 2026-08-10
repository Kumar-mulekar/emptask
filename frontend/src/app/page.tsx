'use client';

import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  Globe2,
  ArrowRight,
  RotateCcw,
  Info,
} from 'lucide-react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { formatSalary } from '@/lib/formatters';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useAnalytics();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" size={26} />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time organizational headcount, country salary statistics, and employment metrics.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            title="Refresh analytics data"
            className="p-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-xs transition-colors"
          >
            <RotateCcw size={16} />
          </button>
          <Link
            href="/employees"
            className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
          >
            <Users size={16} />
            <span>Manage Employees</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-xs">
          <LoadingSpinner message="Calculating real-time analytics aggregations..." size={36} />
        </div>
      ) : isError ? (
        <ErrorMessage
          title="Failed to Load Dashboard Analytics"
          message={error?.message || 'Unable to fetch analytics summary from the server.'}
          onRetry={() => refetch()}
        />
      ) : data ? (
        <div className="space-y-8">
          {/* SECTION 1: Active Headcount Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Primary Headcount Stat Card */}
            <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                    Global Headcount
                  </span>
                  <h2 className="text-3xl font-extrabold mt-1 tracking-tight">
                    {data.headcount.toLocaleString()} Active Employees
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Excludes deactivated employee records. Computed via server-side PostgreSQL aggregation.
                  </p>
                </div>
                <div className="p-3 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/30">
                  <Users size={28} />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Globe2 size={14} className="text-blue-400" />
                  {data.byCountry.length} Countries / Currencies
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-emerald-400" />
                  {data.byDepartment.length} Departments
                </span>
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} className="text-purple-400" />
                  {data.byEmploymentType.length} Employment Types
                </span>
              </div>
            </div>

            {/* Quick Stat Summary Card */}
            <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Data Distribution
                </h3>
                <div className="mt-3 space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Full-time Ratio</span>
                      <span className="font-bold">
                        {data.headcount > 0
                          ? Math.round(
                              ((data.byEmploymentType.find((t) => t.employmentType === 'Full-time')?.count ||
                                0) /
                                data.headcount) *
                                100
                            )
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 mt-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${
                            data.headcount > 0
                              ? ((data.byEmploymentType.find((t) => t.employmentType === 'Full-time')?.count ||
                                  0) /
                                  data.headcount) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>Top Country Share</span>
                      <span className="font-bold">
                        {data.byCountry.length > 0 && data.headcount > 0
                          ? `${data.byCountry[0].country} (${Math.round(
                              (data.byCountry[0].count / data.headcount) * 100
                            )}%)`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400">
                100% active employee compliance
              </div>
            </div>
          </div>

          {/* SECTION 2: Salary Statistics by Country */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Globe2 className="text-blue-600" size={18} />
                  Salary Metrics by Country
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Aggregated salary statistics grouped strictly per country and native currency code.
                </p>
              </div>
            </div>

            {/* Currency Isolation Notice */}
            <div className="bg-blue-50/70 border-b border-blue-100 px-5 py-2.5 text-xs text-blue-800 flex items-center gap-2">
              <Info size={15} className="text-blue-600 shrink-0" />
              <span>
                <strong>Currency Isolation Guarantee:</strong> All salary metrics are reported in local ISO currency codes. Currencies are never converted or combined.
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-5">Country</th>
                    <th className="py-3 px-4">Currency</th>
                    <th className="py-3 px-4 text-right">Headcount</th>
                    <th className="py-3 px-5 text-right">Avg Annual Salary</th>
                    <th className="py-3 px-5 text-right">Min Salary</th>
                    <th className="py-3 px-5 text-right">Max Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {data.byCountry.map((c) => (
                    <tr key={`${c.country}-${c.currency}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{c.country}</td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-700">
                        <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded">
                          {c.currency}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                        {c.count.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono font-bold text-blue-600 whitespace-nowrap">
                        {formatSalary(c.avgSalary, c.currency)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatSalary(c.minSalary, c.currency)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono text-slate-600 whitespace-nowrap">
                        {formatSalary(c.maxSalary, c.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* SECTION 3 & SECTION 4 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* SECTION 3: Headcount by Department */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building2 className="text-blue-600" size={18} />
                    Headcount by Department
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Employee distribution across organizational departments.
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  {data.byDepartment.map((d) => {
                    const percentage =
                      data.headcount > 0 ? Math.round((d.count / data.headcount) * 100) : 0;
                    return (
                      <div key={d.department} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-slate-800 font-semibold">{d.department}</span>
                          <span className="text-slate-600 font-mono">
                            {d.count.toLocaleString()} employees ({percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Policy Banner Notice */}
              <div className="bg-amber-50/60 border-t border-amber-100 p-3.5 text-xs text-amber-900 flex items-center gap-2">
                <Info size={14} className="text-amber-600 shrink-0" />
                <span>
                  <strong>Headcount Only:</strong> Department salary aggregations are excluded per organisation compliance policy.
                </span>
              </div>
            </div>

            {/* SECTION 4: Headcount by Employment Type */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-5 border-b border-slate-200 bg-slate-50">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Briefcase className="text-blue-600" size={18} />
                    Employment Type Breakdown
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Distribution of Full-time, Part-time, and Contract staff.
                  </p>
                </div>

                <div className="p-5 space-y-5">
                  {data.byEmploymentType.map((t) => {
                    const percentage =
                      data.headcount > 0 ? Math.round((t.count / data.headcount) * 100) : 0;
                    return (
                      <div
                        key={t.employmentType}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between"
                      >
                        <div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold ${
                              t.employmentType === 'Full-time'
                                ? 'bg-blue-100 text-blue-800'
                                : t.employmentType === 'Part-time'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {t.employmentType}
                          </span>
                          <p className="text-xs text-slate-500 mt-1">
                            {percentage}% of active workforce
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold font-mono text-slate-900">
                            {t.count.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-500 block">staff</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50 border-t border-slate-200 p-3.5 text-xs text-slate-500 text-center">
                All metrics derived from active database records
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
