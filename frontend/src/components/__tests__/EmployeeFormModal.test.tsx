import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EmployeeFormModal } from '../employees/EmployeeFormModal';
import { describe, it, expect, vi } from 'vitest';

describe('EmployeeFormModal Component', () => {
  it('does not render when isOpen is false', () => {
    const { container } = render(
      <EmployeeFormModal
        isOpen={false}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders Add New Employee header in creation mode', () => {
    render(
      <EmployeeFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('Add New Employee')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/alice johnson/i)).toBeInTheDocument();
  });

  it('validates required fields on submission', async () => {
    render(
      <EmployeeFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // Clear name
    const nameInput = screen.getByPlaceholderText(/alice johnson/i);
    fireEvent.change(nameInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /create employee/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Full Name is required')).toBeInTheDocument();
    });
  });

  it('submits canonical country and currency when valid form submitted', async () => {
    const handleSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <EmployeeFormModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmit={handleSubmit}
      />
    );

    // Fill form
    const nameInput = screen.getByPlaceholderText(/alice johnson/i);
    fireEvent.change(nameInput, { target: { value: 'Alice Smith' } });

    const titleInput = screen.getByPlaceholderText(/senior software engineer/i);
    fireEvent.change(titleInput, { target: { value: 'Staff Engineer' } });

    const submitBtn = screen.getByRole('button', { name: /create employee/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'Alice Smith',
          jobTitle: 'Staff Engineer',
          country: 'United States',
          currency: 'USD',
        })
      );
    });
  });
});
