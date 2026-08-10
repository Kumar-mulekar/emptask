'use client';

import React from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Employee } from '@/types/employee';

interface DeactivateConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  employee: Employee | null;
  isLoading?: boolean;
}

export function DeactivateConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  employee,
  isLoading = false,
}: DeactivateConfirmModalProps) {
  if (!isOpen || !employee) return null;

  const handleDeactivate = async () => {
    try {
      await onConfirm();
      onClose();
    } catch {
      // Error handled by parent
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-red-50 text-red-900">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="text-red-600" size={20} />
            <h3 className="font-bold text-base">Confirm Deactivation</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-700">
            Are you sure you want to deactivate <strong className="text-slate-900">{employee.fullName}</strong>?
          </p>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <p className="font-semibold">Soft-Delete Behavior:</p>
            <p className="mt-0.5">
              This will set <code className="bg-amber-100 px-1 py-0.5 rounded">isActive = false</code>. The employee record is retained in the database for audit integrity but will no longer appear in active employee listings.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeactivate}
            disabled={isLoading}
            className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            {isLoading && <Loader2 className="animate-spin" size={16} />}
            <span>Deactivate Employee</span>
          </button>
        </div>
      </div>
    </div>
  );
}
