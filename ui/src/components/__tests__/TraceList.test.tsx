import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TraceList } from '../TraceList';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TraceList', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('renders loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<TraceList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays traces after fetch', async () => {
    const mockTraces = [
      {
        traceId: 'abc123def456',
        statementId: 'ds-20260326-001',
        spanCount: 5,
        duration: 1000000000,
      },
      {
        traceId: 'xyz789ghi012',
        statementId: 'ds-20260326-002',
        spanCount: 3,
        duration: 500000000,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTraces),
    });

    render(<TraceList />);

    await waitFor(() => {
      // Check for trace cards by looking for span counts which are unique to the cards
      expect(screen.getByText(/5 spans/)).toBeInTheDocument();
      expect(screen.getByText(/3 spans/)).toBeInTheDocument();
      // Check that statement IDs appear in the filter dropdown
      const options = screen.getAllByRole('option');
      expect(options.some(opt => opt.textContent?.includes('ds-20260326-001'))).toBe(true);
      expect(options.some(opt => opt.textContent?.includes('ds-20260326-002'))).toBe(true);
    });
  });

  it('shows empty state when no traces', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<TraceList />);

    await waitFor(() => {
      expect(screen.getByText(/no traces/i)).toBeInTheDocument();
    });
  });

  it('displays span count for each trace', async () => {
    const mockTraces = [
      {
        traceId: 'abc123',
        statementId: 'test-project',
        spanCount: 7,
        duration: 1000000000,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTraces),
    });

    render(<TraceList />);

    await waitFor(() => {
      expect(screen.getByText(/7 spans/)).toBeInTheDocument();
    });
  });
});
