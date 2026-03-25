import { useState } from 'react';
import { Timeline } from './Timeline';
import { SpanInspector } from './SpanInspector';
import { DataFlowDiagram } from './DataFlowDiagram';
import './TraceDetail.css';

type ViewTab = 'timeline' | 'diagram';

interface TraceDetailProps {
  traceId: string;
  onBack?: () => void;
}

export function TraceDetail({ traceId, onBack }: TraceDetailProps) {
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('timeline');

  return (
    <div className="trace-detail">
      <div className="trace-detail-header">
        {onBack && (
          <button className="back-button" onClick={onBack}>
            Back to List
          </button>
        )}
        <h2>Trace: {traceId.substring(0, 8)}</h2>
      </div>

      <div className="trace-detail-tabs">
        <button
          className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline
        </button>
        <button
          className={`tab-button ${activeTab === 'diagram' ? 'active' : ''}`}
          onClick={() => setActiveTab('diagram')}
        >
          Diagram
        </button>
      </div>

      <div className="trace-detail-content">
        <div className="main-panel">
          {activeTab === 'timeline' && (
            <Timeline traceId={traceId} onSpanSelect={setSelectedSpanId} />
          )}
          {activeTab === 'diagram' && (
            <DataFlowDiagram
              traceId={traceId}
              onNodeSelect={setSelectedSpanId}
              selectedNodeId={selectedSpanId}
            />
          )}
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
