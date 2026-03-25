import { useState, useEffect } from 'react';
import { TraceDetail } from './TraceDetail';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/traces')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch traces');
        return res.json();
      })
      .then((data) => {
        setTraces(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleTraceClick = (traceId: string) => {
    setSelectedTraceId(traceId);
    onSelectTrace?.(traceId);
  };

  const handleBack = () => {
    setSelectedTraceId(null);
  };

  if (selectedTraceId) {
    return <TraceDetail traceId={selectedTraceId} onBack={handleBack} />;
  }

  if (loading) return <div className="loading">Loading traces...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  if (traces.length === 0)
    return <div className="empty">No traces yet. Run some agent code to generate traces.</div>;

  return (
    <div className="trace-list">
      <h2>Execution Traces</h2>
      <div className="traces">
        {traces.map((trace) => (
          <TraceCard key={trace.traceId} trace={trace} onClick={() => handleTraceClick(trace.traceId)} />
        ))}
      </div>
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
