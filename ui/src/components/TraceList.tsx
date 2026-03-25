import { useState, useEffect, useCallback } from 'react';
import { TraceDetail } from './TraceDetail';
import { FilterControls, Filters } from './FilterControls';
import { SearchBar } from './SearchBar';
import './TraceList.css';

export interface TraceSummary {
  traceId: string;
  statementId?: string;
  deliverableType?: string;
  spanCount: number;
  startTime: number;
  duration: number;
  storedAt: number;
}

interface TraceListProps {
  onSelectTrace?: (traceId: string) => void;
}

export function TraceList({ onSelectTrace }: TraceListProps) {
  const [traces, setTraces] = useState<TraceSummary[]>([]);
  const [filteredTraces, setFilteredTraces] = useState<TraceSummary[]>([]);
  const [projects, setProjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({});

  const fetchTraces = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();

    if (searchQuery) params.set('q', searchQuery);
    if (filters.statementId) params.set('statementId', filters.statementId);
    if (filters.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters.timeRange && filters.timeRange !== 'all') {
      const now = Date.now() * 1_000_000; // ms to ns
      const ranges: Record<string, number> = {
        '1h': 1 * 60 * 60 * 1_000_000_000,
        '24h': 24 * 60 * 60 * 1_000_000_000,
        '7d': 7 * 24 * 60 * 60 * 1_000_000_000,
      };
      params.set('since', String(now - ranges[filters.timeRange]));
    }

    const url = `/api/traces${params.toString() ? `?${params}` : ''}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch traces');
        return res.json();
      })
      .then((data) => {
        setTraces(data);
        setFilteredTraces(data);
        // Extract unique projects
        const uniqueProjects = [...new Set(data.map((t: TraceSummary) => t.statementId).filter(Boolean))];
        setProjects(uniqueProjects);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [searchQuery, filters]);

  useEffect(() => {
    fetchTraces();
  }, [fetchTraces]);

  const handleTraceClick = (traceId: string) => {
    setSelectedTraceId(traceId);
    onSelectTrace?.(traceId);
  };

  const handleBack = () => {
    setSelectedTraceId(null);
  };

  const handleFilterChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (selectedTraceId) {
    return <TraceDetail traceId={selectedTraceId} onBack={handleBack} />;
  }

  return (
    <div className="trace-list-container">
      <div className="trace-list-header">
        <h2>Execution Traces</h2>
        <SearchBar onSearch={handleSearch} placeholder="Search by span name, attributes..." />
      </div>

      <FilterControls projects={projects} onChange={handleFilterChange} />

      {loading ? (
        <div className="loading">Loading traces...</div>
      ) : error ? (
        <div className="error">Error: {error}</div>
      ) : filteredTraces.length === 0 ? (
        <div className="empty">
          {searchQuery || filters.statementId
            ? 'No traces match your filters.'
            : 'No traces yet. Run some agent code to generate traces.'}
        </div>
      ) : (
        <div className="traces">
          {filteredTraces.map((trace) => (
            <TraceCard key={trace.traceId} trace={trace} onClick={() => handleTraceClick(trace.traceId)} />
          ))}
        </div>
      )}
    </div>
  );
}

function TraceCard({ trace, onClick }: { trace: TraceSummary; onClick: () => void }) {
  const formatDuration = (ns: number): string => {
    const ms = ns / 1_000_000;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTraceId = (id: string): string => {
    return id.substring(0, 8);
  };

  return (
    <div className="trace-card" onClick={onClick}>
      <div className="trace-header">
        <span className="trace-id">{formatTraceId(trace.traceId)}</span>
        {trace.statementId && (
          <span className="statement-id">{trace.statementId}</span>
        )}
      </div>
      <div className="trace-meta">
        <span className="span-count">{trace.spanCount} spans</span>
        <span className="duration">{formatDuration(trace.duration)}</span>
      </div>
    </div>
  );
}
