import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { ToastProvider, useToast } from './ToastProvider';

const ToastTrigger = ({ message, type }) => {
  const addToast = useToast();
  return (
    <button onClick={() => addToast(message, type)}>Show Toast</button>
  );
};

test('shows and hides toast', async () => {
  jest.useFakeTimers();
  render(
    <ToastProvider>
      <ToastTrigger message="Test message" type="success" />
    </ToastProvider>
  );

  const button = screen.getByText('Show Toast');
  act(() => { button.click(); });

  expect(screen.getByText('Test message')).toBeInTheDocument();

  act(() => { jest.advanceTimersByTime(4000); });

  expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  jest.useRealTimers();
});
