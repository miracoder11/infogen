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
      expect(screen.getByText(/ds-20260326-001/)).toBeInTheDocument();
      expect(screen.getByText(/ds-20260326-002/)).toBeInTheDocument();
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
