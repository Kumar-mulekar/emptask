import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeactivateConfirmModal } from '../employees/DeactivateConfirmModal';
import { describe, it, expect, vi } from 'vitest';
import { Employee } from '@/types/employee';

const mockEmployee: Employee = {
  id: 'emp-123',
  fullName: 'Jane Smith',
  department: 'Engineering',
  jobTitle: 'Lead Developer',
  employmentType: 'Full-time',
  hireDate: '2022-01-01T00:00:00.000Z',
  country: 'United States',
  currency: 'USD',
  salary: '140000.00',
  isActive: true,
};

describe('DeactivateConfirmModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <DeactivateConfirmModal
        isOpen={false}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        employee={mockEmployee}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders employee name and deactivation warning when isOpen is true', () => {
    render(
      <DeactivateConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        employee={mockEmployee}
      />
    );

    expect(screen.getByText('Confirm Deactivation')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Deactivation Notice:')).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const handleClose = vi.fn();
    render(
      <DeactivateConfirmModal
        isOpen={true}
        onClose={handleClose}
        onConfirm={vi.fn()}
        employee={mockEmployee}
      />
    );

    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Deactivate Employee button is clicked', async () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <DeactivateConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        onConfirm={handleConfirm}
        employee={mockEmployee}
      />
    );

    const confirmBtn = screen.getByRole('button', { name: /deactivate employee/i });
    fireEvent.click(confirmBtn);
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
