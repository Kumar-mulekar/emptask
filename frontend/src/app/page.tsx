import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="text-blue-600" size={26} />
            Analytics Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Overview of organisation headcount, salary distribution by country, and department metrics.
          </p>
        </div>
        <Link
          href="/employees"
          className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
        >
          <Users size={16} />
          <span>Manage Employees</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm text-center">
        <div className="mx-auto w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
          <LayoutDashboard size={24} />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">Dashboard Foundation Established</h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto mt-2">
          The analytics API integration will be implemented in Phase H. API client, TanStack Query, and shell layout are wired and ready.
        </p>
      </div>
    </div>
  );
}
