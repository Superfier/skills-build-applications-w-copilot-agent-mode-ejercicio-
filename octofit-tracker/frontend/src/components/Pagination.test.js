import React from 'react';
import { render, screen } from '@testing-library/react';
import Pagination from './Pagination';

test('renders nothing when no pagination needed', () => {
  const { container } = render(
    <Pagination page={1} hasNext={false} hasPrev={false} onPageChange={() => {}} />
  );
  expect(container.innerHTML).toBe('');
});

test('renders pagination with next button', () => {
  render(
    <Pagination page={1} hasNext={true} hasPrev={false} total={25} onPageChange={() => {}} />
  );
  expect(screen.getByText('1')).toBeInTheDocument();
  expect(screen.getByText(/next/i)).not.toBeDisabled();
  expect(screen.getByText(/prev/i)).toBeDisabled();
  expect(screen.getByText(/25 total results/i)).toBeInTheDocument();
});

test('renders pagination with prev button enabled on page 2', () => {
  render(
    <Pagination page={2} hasNext={false} hasPrev={true} total={15} onPageChange={() => {}} />
  );
  expect(screen.getByText('2')).toBeInTheDocument();
  expect(screen.getByText(/prev/i)).not.toBeDisabled();
  expect(screen.getByText(/next/i)).toBeDisabled();
});
