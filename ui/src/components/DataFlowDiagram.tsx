import { useState, useEffect, useRef, useCallback } from 'react';
import {
  DiagramData,
  SpanNode,
  DiagramEdge,
  transformToDiagram,
  getConnectedNodes,
} from '../utils/diagramTransform';
import { SerializedTrace } from '../utils/traceTransform';
import { formatDuration } from '../utils/traceTransform';
import './DataFlowDiagram.css';

interface DataFlowDiagramProps {
  traceId: string;
  onNodeSelect?: (nodeId: string) => void;
  selectedNodeId?: string | null;
}

export function DataFlowDiagram({
  traceId,
  onNodeSelect,
  selectedNodeId,
}: DataFlowDiagramProps) {
  const [trace, setTrace] = useState<SerializedTrace | null>(null);
  const [diagram, setDiagram] = useState<DiagramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/traces/${traceId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch trace');
        return res.json();
      })
      .then((data: SerializedTrace) => {
        setTrace(data);
        setDiagram(transformToDiagram(data));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [traceId]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      onNodeSelect?.(nodeId);
    },
    [onNodeSelect]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as HTMLElement).classList.contains('diagram-canvas')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) {
        setPan({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 5));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.2, 0.2));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  if (loading) return <div className="diagram-loading">Loading diagram...</div>;
  if (error) return <div className="diagram-error">Error: {error}</div>;
  if (!diagram || diagram.nodes.length === 0)
    return <div className="diagram-empty">No data to visualize</div>;

  const viewBoxWidth = 800;
  const viewBoxHeight = 600;

  // Calculate bounds for auto-fit
  const nodeWidth = 180;
  const nodeHeight = 60;

  return (
    <div className="diagram-container">
      <div className="diagram-header">
        <h3>Data Flow Diagram</h3>
        <div className="diagram-controls">
          <button onClick={handleZoomIn} title="Zoom In">
            +
          </button>
          <button onClick={handleZoomOut} title="Zoom Out">
            -
          </button>
          <button onClick={handleResetView} title="Reset View">
            Reset
          </button>
          <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div className="diagram-legend">
        <div className="legend-item">
          <span className="legend-color agent"></span>
          <span>Agent</span>
        </div>
        <div className="legend-item">
          <span className="legend-color llm"></span>
          <span>LLM</span>
        </div>
        <div className="legend-item">
          <span className="legend-color tool"></span>
          <span>Tool</span>
        </div>
        <div className="legend-item">
          <span className="legend-color custom"></span>
          <span>Custom</span>
        </div>
      </div>

      <svg
        ref={svgRef}
        className="diagram-canvas"
        viewBox={`${-viewBoxWidth / 2} ${-40} ${viewBoxWidth} ${viewBoxHeight}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render edges */}
          {diagram.edges.map((edge) => (
            <DiagramEdgePath
              key={edge.id}
              edge={edge}
              nodes={diagram.nodes}
              highlighted={
                selectedNodeId === edge.source || selectedNodeId === edge.target
              }
            />
          ))}

          {/* Render nodes */}
          {diagram.nodes.map((node) => (
            <DiagramNodeComponent
              key={node.id}
              node={node}
              selected={selectedNodeId === node.id}
              onClick={() => handleNodeClick(node.id)}
              connected={
                selectedNodeId
                  ? getConnectedNodes(diagram, selectedNodeId)
                  : { incoming: [], outgoing: [] }
              }
            />
          ))}
        </g>
      </svg>

      {selectedNodeId && (
        <div className="diagram-node-info">
          <NodeDetails
            node={diagram.nodes.find((n) => n.id === selectedNodeId)}
          />
        </div>
      )}
    </div>
  );
}

interface DiagramEdgePathProps {
  edge: DiagramEdge;
  nodes: SpanNode[];
  highlighted: boolean;
}

function DiagramEdgePath({ edge, nodes, highlighted }: DiagramEdgePathProps) {
  const source = nodes.find((n) => n.id === edge.source);
  const target = nodes.find((n) => n.id === edge.target);

  if (!source || !target || source.x === undefined || source.y === undefined ||
      target.x === undefined || target.y === undefined) {
    return null;
  }

  const nodeWidth = 180;
  const nodeHeight = 60;

  // Calculate edge start (bottom of source) and end (top of target)
  const startX = source.x + nodeWidth / 2;
  const startY = source.y + nodeHeight;
  const endX = target.x + nodeWidth / 2;
  const endY = target.y;

  // Create curved path
  const midY = (startY + endY) / 2;
  const path = `M ${startX} ${startY} C ${startX} ${midY}, ${endX} ${midY}, ${endX} ${endY}`;

  return (
    <g className={`diagram-edge ${highlighted ? 'highlighted' : ''}`}>
      <path
        d={path}
        fill="none"
        stroke={highlighted ? '#3b82f6' : '#94a3b8'}
        strokeWidth={highlighted ? 2 : 1.5}
        markerEnd="url(#arrowhead)"
      />
      {edge.label && (
        <text
          x={(startX + endX) / 2}
          y={(startY + endY) / 2 - 5}
          textAnchor="middle"
          className="edge-label"
          fontSize="10"
          fill="#64748b"
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}

interface DiagramNodeComponentProps {
  node: SpanNode;
  selected: boolean;
  onClick: () => void;
  connected: { incoming: string[]; outgoing: string[] };
}

function DiagramNodeComponent({
  node,
  selected,
  onClick,
  connected,
}: DiagramNodeComponentProps) {
  if (node.x === undefined || node.y === undefined) return null;

  const nodeWidth = 180;
  const nodeHeight = 60;
  const isConnected =
    connected.incoming.includes(node.id) || connected.outgoing.includes(node.id);

  return (
    <g
      className={`diagram-node type-${node.type} ${selected ? 'selected' : ''} ${
        isConnected ? 'connected' : ''
      } ${node.status === 'error' ? 'error' : ''}`}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Node background */}
      <rect
        x={node.x}
        y={node.y}
        width={nodeWidth}
        height={nodeHeight}
        rx={8}
        ry={8}
        className="node-bg"
      />

      {/* Node label */}
      <text
        x={node.x + nodeWidth / 2}
        y={node.y + 24}
        textAnchor="middle"
        className="node-label"
        fontWeight="500"
        fontSize="12"
      >
        {node.label.length > 18 ? node.label.substring(0, 16) + '...' : node.label}
      </text>

      {/* Duration */}
      <text
        x={node.x + nodeWidth / 2}
        y={node.y + 44}
        textAnchor="middle"
        className="node-duration"
        fontSize="10"
        fill="#64748b"
      >
        {formatDuration(node.duration)}
      </text>

      {/* Status indicator */}
      {node.status === 'error' && (
        <circle
          cx={node.x + nodeWidth - 12}
          cy={node.y + 12}
          r={6}
          fill="#ef4444"
        />
      )}
    </g>
  );
}

interface NodeDetailsProps {
  node: SpanNode | undefined;
}

function NodeDetails({ node }: NodeDetailsProps) {
  if (!node) return null;

  return (
    <div className="node-details-panel">
      <h4>{node.label}</h4>
      <div className="node-detail-row">
        <span className="label">Type:</span>
        <span className={`type-badge ${node.type}`}>{node.type}</span>
      </div>
      <div className="node-detail-row">
        <span className="label">Duration:</span>
        <span>{formatDuration(node.duration)}</span>
      </div>
      <div className="node-detail-row">
        <span className="label">Status:</span>
        <span className={`status-badge ${node.status}`}>{node.status}</span>
      </div>
      {Object.keys(node.attributes).length > 0 && (
        <div className="node-attributes">
          <span className="label">Attributes:</span>
          <pre>{JSON.stringify(node.attributes, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
