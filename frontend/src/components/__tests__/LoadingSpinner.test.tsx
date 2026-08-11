import React from 'react';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { describe, it, expect } from 'vitest';

describe('LoadingSpinner Component', () => {
  it('renders default loading message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders custom loading message when provided', () => {
    render(<LoadingSpinner message="Calculating employee metrics..." />);
    expect(screen.getByText('Calculating employee metrics...')).toBeInTheDocument();
  });
});
