import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
}

export function LoadingSpinner({ message = 'Loading...', size = 24 }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <Loader2 className="animate-spin text-blue-600" size={size} />
      {message && <p className="text-sm font-medium text-slate-600">{message}</p>}
    </div>
  );
}
