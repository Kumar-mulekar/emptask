import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorMessage } from '../shared/ErrorMessage';
import { describe, it, expect, vi } from 'vitest';

describe('ErrorMessage Component', () => {
  it('renders error title and message', () => {
    render(<ErrorMessage title="Error Title" message="Something went wrong" />);

    expect(screen.getByText('Error Title')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders retry button and triggers onRetry callback when clicked', () => {
    const handleRetry = vi.fn();
    render(<ErrorMessage title="Error Title" message="Network error" onRetry={handleRetry} />);

    const retryBtn = screen.getByRole('button', { name: /try again/i });
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
