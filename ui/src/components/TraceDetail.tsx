import { useState } from 'react';
import { Timeline } from './Timeline';
import { SpanInspector } from './SpanInspector';
import './TraceDetail.css';

interface TraceDetailProps {
  traceId: string;
  onBack?: () => void;
}

export function TraceDetail({ traceId, onBack }: TraceDetailProps) {
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);

  return (
    <div className="trace-detail">
      <div className="trace-detail-header">
        {onBack && (
          <button className="back-button" onClick={onBack}>
            ← Back to List
          </button>
        )}
        <h2>Trace: {traceId.substring(0, 8)}</h2>
      </div>

      <div className="trace-detail-content">
        <div className="timeline-panel">
          <Timeline traceId={traceId} onSpanSelect={setSelectedSpanId} />
        </div>

        {selectedSpanId && (
          <div className="inspector-panel">
            <SpanInspector traceId={traceId} spanId={selectedSpanId} />
          </div>
        )}
      </div>
    </div>
  );
}
