import { useState, useEffect } from 'react';
import { Timeline } from './Timeline';
import { SpanInspector } from './SpanInspector';
import { DataFlowDiagram } from './DataFlowDiagram';
import { ExecutionTrajectory } from './ExecutionTrajectory';
import { MermaidExport } from './MermaidExport';
import { transformToDiagram, DiagramData } from '../utils/diagramTransform';
import { transformToTrajectory, ExecutionTrajectory as TrajectoryData } from '../utils/trajectoryTransform';
import { SerializedTrace } from '../utils/traceTransform';
import './TraceDetail.css';

type ViewTab = 'timeline' | 'diagram' | 'trajectory';

interface TraceDetailProps {
  traceId: string;
  onBack?: () => void;
}

export function TraceDetail({ traceId, onBack }: TraceDetailProps) {
  const [selectedSpanId, setSelectedSpanId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('timeline');
  const [showExport, setShowExport] = useState(false);
  const [trace, setTrace] = useState<SerializedTrace | null>(null);
  const [diagram, setDiagram] = useState<DiagramData | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryData | null>(null);

  // Load trace data for export
  useEffect(() => {
    fetch(`/api/traces/${traceId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch trace');
        return res.json();
      })
      .then((data: SerializedTrace) => {
        setTrace(data);
        setDiagram(transformToDiagram(data));
        setTrajectory(transformToTrajectory(data));
      })
      .catch((err) => {
        console.error('Failed to load trace for export:', err);
      });
  }, [traceId]);

  return (
    <div className="trace-detail">
      <div className="trace-detail-header">
        <div className="header-left">
          {onBack && (
            <button className="back-button" onClick={onBack}>
              Back to List
            </button>
          )}
          <h2>Trace: {traceId.substring(0, 8)}</h2>
        </div>
        <button className="export-button" onClick={() => setShowExport(true)}>
          Export
        </button>
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
        <button
          className={`tab-button ${activeTab === 'trajectory' ? 'active' : ''}`}
          onClick={() => setActiveTab('trajectory')}
        >
          Trajectory
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
          {activeTab === 'trajectory' && (
            <ExecutionTrajectory
              traceId={traceId}
              onStepSelect={setSelectedSpanId}
              selectedStepId={selectedSpanId}
            />
          )}
        </div>

        {selectedSpanId && (
          <div className="inspector-panel">
            <SpanInspector traceId={traceId} spanId={selectedSpanId} />
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExport && trace && diagram && trajectory && (
        <div className="export-modal-overlay" onClick={() => setShowExport(false)}>
          <div className="export-modal" onClick={(e) => e.stopPropagation()}>
            <MermaidExport
              diagram={diagram}
              trajectory={trajectory}
              trace={trace}
              onClose={() => setShowExport(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
