import { useState, useEffect } from 'react';
import { SerializedTrace, SerializedSpan } from '../utils/traceTransform';
import './SpanInspector.css';

interface SpanInspectorProps {
  traceId: string;
  spanId: string;
}

export function SpanInspector({ traceId, spanId }: SpanInspectorProps) {
  const [trace, setTrace] = useState<SerializedTrace | null>(null);
  const [span, setSpan] = useState<SerializedSpan | null>(null);

  useEffect(() => {
    fetch(`/api/traces/${traceId}`)
      .then((res) => res.json())
      .then((data: SerializedTrace) => {
        setTrace(data);
        const found = data.spans.find((s) => s.spanId === spanId);
        setSpan(found || null);
      });
  }, [traceId, spanId]);

  if (!span) return <div className="inspector-loading">Loading span...</div>;

  const prompt = span.attributes['infogen.llm.prompt'];
  const response = span.attributes['infogen.llm.response'];

  return (
    <div className="span-inspector">
      <div className="inspector-header">
        <h3>{span.name}</h3>
        <span className={`status-badge ${span.status.code === 2 ? 'error' : 'ok'}`}>
          {span.status.code === 2 ? 'Error' : 'OK'}
        </span>
      </div>

      <div className="inspector-section">
        <h4>Attributes</h4>
        <div className="attributes-list">
          {Object.entries(span.attributes).map(([key, value]) => (
            <div key={key} className="attribute-row">
              <span className="attribute-key">{key}</span>
              <span className="attribute-value">{formatValue(value)}</span>
            </div>
          ))}
        </div>
      </div>

      {prompt && (
        <div className="inspector-section">
          <h4>Prompt</h4>
          <div className="content-block prompt">
            <pre>{String(prompt)}</pre>
          </div>
        </div>
      )}

      {response && (
        <div className="inspector-section">
          <h4>Response</h4>
          <div className="content-block response">
            <pre>{String(response)}</pre>
          </div>
        </div>
      )}

      {span.events && span.events.length > 0 && (
        <div className="inspector-section">
          <h4>Events ({span.events.length})</h4>
          <div className="events-list">
            {span.events.map((event, idx) => (
              <div key={idx} className="event-row">
                <span className="event-name">{event.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
