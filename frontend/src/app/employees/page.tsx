'use client';

import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  X,
  Filter,
  Edit2,
  UserX,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import {
  useCreateEmployee,
  useDeactivateEmployee,
  useEmployees,
  useUpdateEmployee,
} from '@/hooks/useEmployees';
import { useDebounce } from '@/hooks/useDebounce';
import { CreateEmployeeInput, Employee, EmployeeQueryParams } from '@/types/employee';
import { formatDate, formatSalary } from '@/lib/formatters';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal';
import { DeactivateConfirmModal } from '@/components/employees/DeactivateConfirmModal';
import { CANONICAL_COUNTRIES } from '@/lib/constants';

const COUNTRIES = CANONICAL_COUNTRIES;
const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Sales',
  'Marketing',
  'Human Resources',
  'Finance',
  'Operations',
];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract'];

export default function EmployeesPage() {
  // Query state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [deactivatingEmployee, setDeactivatingEmployee] = useState<Employee | null>(null);

  // Debounced search
  const debouncedSearch = useDebounce(searchInput, 300);

  // Build query params
  const queryParams: EmployeeQueryParams = {
    page,
    limit,
    search: debouncedSearch.trim() || undefined,
    country: selectedCountry || undefined,
    department: selectedDept || undefined,
    employmentType: selectedType || undefined,
  };

  // React Query data & mutations
  const { data, isLoading, isError, error, refetch } = useEmployees(queryParams);
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();
  const deactivateEmployeeMutation = useDeactivateEmployee();

  // Reset all filters
  const handleResetFilters = () => {
    setSearchInput('');
    setSelectedCountry('');
    setSelectedDept('');
    setSelectedType('');
    setPage(1);
  };

  const hasActiveFilters =
    searchInput !== '' || selectedCountry !== '' || selectedDept !== '' || selectedType !== '';

  // Form Submit Handler (Create & Update)
  const handleFormSubmit = async (formData: CreateEmployeeInput) => {
    if (editingEmployee) {
      await updateEmployeeMutation.mutateAsync({
        id: editingEmployee.id,
        data: formData,
      });
    } else {
      await createEmployeeMutation.mutateAsync(formData);
    }
  };

  // Deactivate Handler
  const handleDeactivateConfirm = async () => {
    if (deactivatingEmployee) {
      await deactivateEmployeeMutation.mutateAsync(deactivatingEmployee.id);
    }
  };

  const pagination = data?.pagination;
  const employees = data?.data || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="text-blue-600" size={26} />
            Employee Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Browse, search, filter, add, edit, and deactivate active organisation employees.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingEmployee(null);
            setIsFormModalOpen(true);
          }}
          className="inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors shrink-0"
        >
          <UserPlus size={18} />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative col-span-1 sm:col-span-2 md:col-span-1">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name..."
              className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Country Filter */}
          <div>
            <select
              value={selectedCountry}
              onChange={(e) => {
                setSelectedCountry(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="">All Countries</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => {
                setSelectedDept(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Employment Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="">All Employment Types</option>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Toolbar Footer */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <Filter size={14} className="text-blue-600" />
              Active filters applied
            </span>
            <button
              onClick={handleResetFilters}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
            >
              <RotateCcw size={12} />
              <span>Reset Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <LoadingSpinner message="Fetching active employee records..." size={32} />
        </div>
      ) : isError ? (
        <ErrorMessage
          title="Failed to Load Employees"
          message={error?.message || 'Network error occurred while fetching employees.'}
          onRetry={() => refetch()}
        />
      ) : employees.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="mx-auto w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-3">
            <Users size={24} />
          </div>
          <h3 className="text-lg font-semibold text-slate-900">No Employees Found</h3>
          <p className="text-slate-500 text-sm max-w-sm mx-auto mt-1">
            {hasActiveFilters
              ? 'No active employee records match your search or filter criteria. Try adjusting or clearing your filters.'
              : 'There are currently no active employee records in the system.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <RotateCcw size={14} />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>
      ) : (
        /* Employee Table */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Job Title</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Country</th>
                  <th className="py-3.5 px-4 text-right">Annual Salary</th>
                  <th className="py-3.5 px-4">Hire Date</th>
                  <th className="py-3.5 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{emp.fullName}</td>

                    {/* Department */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {emp.department}
                      </span>
                    </td>

                    {/* Job Title */}
                    <td className="py-3.5 px-4 text-slate-600">{emp.jobTitle}</td>

                    {/* Employment Type */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          emp.employmentType === 'Full-time'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : emp.employmentType === 'Part-time'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {emp.employmentType}
                      </span>
                    </td>

                    {/* Country & Currency */}
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="font-medium">{emp.country}</span>
                      <span className="text-xs text-slate-400 block">{emp.currency}</span>
                    </td>

                    {/* Annual Salary (always explicit currency code) */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {formatSalary(emp.salary, emp.currency)}
                    </td>

                    {/* Hire Date */}
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {formatDate(emp.hireDate)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <button
                          onClick={() => {
                            setEditingEmployee(emp);
                            setIsFormModalOpen(true);
                          }}
                          title="Edit Employee"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setDeactivatingEmployee(emp);
                            setIsDeactivateModalOpen(true);
                          }}
                          title="Deactivate Employee"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <UserX size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
              {/* Pagination Summary */}
              <div>
                Showing <span className="font-semibold text-slate-900">{(page - 1) * limit + 1}</span> to{' '}
                <span className="font-semibold text-slate-900">
                  {Math.min(page * limit, pagination.total)}
                </span>{' '}
                of <span className="font-semibold text-slate-900">{pagination.total.toLocaleString()}</span> active employees
              </div>

              {/* Page Controls & Limit Selector */}
              <div className="flex items-center space-x-4">
                {/* Limit Selector */}
                <div className="flex items-center space-x-1.5">
                  <span>Per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-2 py-1 border border-slate-300 rounded bg-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Prev / Next Buttons */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 border border-slate-300 rounded bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="px-2 font-semibold text-slate-800">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="p-1.5 border border-slate-300 rounded bg-white disabled:opacity-40 hover:bg-slate-100 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Modal (Create / Edit) */}
      <EmployeeFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingEmployee(null);
        }}
        onSubmit={handleFormSubmit}
        initialData={editingEmployee}
        isLoading={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}
      />

      {/* Deactivate Confirm Modal */}
      <DeactivateConfirmModal
        isOpen={isDeactivateModalOpen}
        onClose={() => {
          setIsDeactivateModalOpen(false);
          setDeactivatingEmployee(null);
        }}
        onConfirm={handleDeactivateConfirm}
        employee={deactivatingEmployee}
        isLoading={deactivateEmployeeMutation.isPending}
      />
    </div>
  );
}
