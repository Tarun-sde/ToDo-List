import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import DashboardPage from '../features/dashboard/DashboardPage';
import api from '@/lib/api';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('DashboardPage', () => {
  it('renders loading state initially and fetches tasks', async () => {
    (api.get as any).mockResolvedValueOnce({
      data: { tasks: [], pages: 1, total: 0, page: 1 },
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    // Should display dashboard header
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Wait for the API to resolve and empty state to show
    await waitFor(() => {
      expect(screen.getByText('No tasks here')).toBeInTheDocument();
    });
    
    // Activity feed should render
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });
});
