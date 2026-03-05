import { render, screen } from '@testing-library/react';
import App from './App';

test('renders authentication panel', () => {
  render(<App />);
  const loginTitle = screen.getByText(/real authentication for local demo/i);
  expect(loginTitle).toBeInTheDocument();
});
