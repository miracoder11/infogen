import { useState, useEffect } from 'react';
import { SerializedTrace, flattenSpans, transformSpans, TimelineSpan, formatDuration } from '../utils/traceTransform';
import './Timeline.css';

interface TimelineProps {
  traceId: string;
  onSpanSelect?: (spanId: string) => void;
}

export function Timeline({ traceId, onSpanSelect }: TimelineProps) {
  const [trace, setTrace] = useState<SerializedTrace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [flatSpans, setFlatSpans] = useState<TimelineSpan[]>([]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/traces/${traceId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch trace');
        return res.json();
      })
      .then((data: SerializedTrace) => {
        setTrace(data);
        const rootSpans = transformSpans(data);
        setFlatSpans(flattenSpans(rootSpans));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [traceId]);

  const handleSpanClick = (spanId: string) => {
    setSelected(spanId);
    onSpanSelect?.(spanId);
  };

  if (loading) return <div className="timeline-loading">Loading timeline...</div>;
  if (error) return <div className="timeline-error">Error: {error}</div>;
  if (!trace || flatSpans.length === 0) return <div className="timeline-empty">No spans to display</div>;

  const traceDuration = trace.duration / 1_000_000; // ns to ms

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h3>Timeline</h3>
        <div className="timeline-controls">
          <button onClick={() => setZoom((z) => Math.min(z * 1.5, 10))} title="Zoom In">
            +
          </button>
          <button onClick={() => setZoom((z) => Math.max(z / 1.5, 0.1))} title="Zoom Out">
            -
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="timeline-scale">
        <div className="scale-label">0ms</div>
        <div className="scale-bar"></div>
        <div className="scale-label">{formatDuration(traceDuration)}</div>
      </div>

      <div className="timeline-rows">
        {flatSpans.map((span) => (
          <SpanBar
            key={span.id}
            span={span}
            traceDuration={traceDuration}
            zoom={zoom}
            selected={selected === span.id}
            onClick={() => handleSpanClick(span.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface SpanBarProps {
  span: TimelineSpan;
  traceDuration: number;
  zoom: number;
  selected: boolean;
  onClick: () => void;
}

function SpanBar({ span, traceDuration, zoom, selected, onClick }: SpanBarProps) {
  const leftPercent = (span.startTime / traceDuration) * 100;
  const widthPercent = Math.max((span.duration / traceDuration) * 100 * zoom, 0.5);

  return (
    <div
      className={`span-row depth-${Math.min(span.depth, 5)} ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="span-label" style={{ paddingLeft: `${span.depth * 16}px` }}>
        <span className="span-name">{span.name}</span>
        <span className="span-duration">{formatDuration(span.duration)}</span>
      </div>
      <div className="span-bar-container">
        <div
          className={`span-bar ${span.status}`}
          style={{
            left: `${leftPercent}%`,
            width: `${Math.min(widthPercent, 100 - leftPercent)}%`,
          }}
        />
      </div>
    </div>
  );
}
