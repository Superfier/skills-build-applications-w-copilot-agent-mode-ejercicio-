import { render, screen } from '@testing-library/react';
import App from './App';

test('renders authentication panel when not logged in', () => {
  localStorage.removeItem('octofit_token');
  render(<App />);
  expect(screen.getByText(/real authentication for local demo/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
});

test('shows login and register toggle', () => {
  localStorage.removeItem('octofit_token');
  render(<App />);
  expect(screen.getByText(/need an account\? register/i)).toBeInTheDocument();
});

test('renders navbar brand', () => {
  localStorage.removeItem('octofit_token');
  render(<App />);
  expect(screen.getAllByText(/octofit tracker/i).length).toBeGreaterThan(0);
});
