/**
 * Transforms OpenTelemetry trace data into diagram visualization format.
 * Generates nodes and edges from span hierarchy for data flow visualization.
 */

import { SerializedTrace, SerializedSpan } from './traceTransform.js';

export interface SpanNode {
  id: string;
  label: string;
  type: 'agent' | 'llm' | 'tool' | 'custom';
  x?: number;
  y?: number;
  attributes: Record<string, unknown>;
  status: 'ok' | 'error';
  duration: number;
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  type: 'parent-child' | 'data-flow' | 'call';
}

export interface DiagramData {
  nodes: SpanNode[];
  edges: DiagramEdge[];
  traceId: string;
  statementId?: string;
}

/**
 * Detect the type of span based on its name and attributes.
 */
export function detectSpanType(span: SerializedSpan): SpanNode['type'] {
  const name = span.name.toLowerCase();
  const attrs = span.attributes || {};

  // Check for LLM spans
  if (name.startsWith('llm.') || 'llm.provider' in attrs || 'llm.model' in attrs) {
    return 'llm';
  }

  // Check for tool spans
  if (name.startsWith('tool.') || 'tool.name' in attrs) {
    return 'tool';
  }

  // Check for agent spans
  if (name.startsWith('agent.') || 'agent.action' in attrs) {
    return 'agent';
  }

  return 'custom';
}

/**
 * Generate a human-readable label for a span.
 */
export function generateSpanLabel(span: SerializedSpan): string {
  const name = span.name;
  const attrs = span.attributes || {};

  // Extract meaningful parts from span name
  if (name.startsWith('agent.')) {
    const action = attrs['agent.action'] || name.replace('agent.', '');
    return String(action);
  }

  if (name.startsWith('llm.')) {
    const model = attrs['llm.model'];
    if (model) {
      return `LLM: ${model}`;
    }
    return 'LLM Call';
  }

  if (name.startsWith('tool.')) {
    const toolName = attrs['tool.name'] || name.replace('tool.', '');
    return `Tool: ${toolName}`;
  }

  // For custom spans, use the name directly
  return name;
}

/**
 * Transform a serialized trace into diagram data (nodes and edges).
 */
export function transformToDiagram(trace: SerializedTrace): DiagramData {
  const nodes: SpanNode[] = [];
  const edges: DiagramEdge[] = [];

  if (!trace.spans || trace.spans.length === 0) {
    return {
      nodes,
      edges,
      traceId: trace.traceId,
      statementId: trace.statementId,
    };
  }

  // Create span ID mapping for parent lookups
  const spanMap = new Map<string, SerializedSpan>();
  for (const span of trace.spans) {
    spanMap.set(span.spanId, span);
  }

  // Calculate trace start time for relative positioning
  const traceStartNs = trace.spans[0].startTime[0] * 1e9 + trace.spans[0].startTime[1];

  // Create nodes from spans
  for (const span of trace.spans) {
    const durationMs = span.duration[0] * 1000 + span.duration[1] / 1_000_000;

    const node: SpanNode = {
      id: span.spanId,
      label: generateSpanLabel(span),
      type: detectSpanType(span),
      attributes: span.attributes || {},
      status: span.status.code === 2 ? 'error' : 'ok',
      duration: durationMs,
    };

    nodes.push(node);

    // Create edge for parent-child relationship
    if (span.parentSpanId && spanMap.has(span.parentSpanId)) {
      edges.push({
        id: `edge-${span.parentSpanId}-${span.spanId}`,
        source: span.parentSpanId,
        target: span.spanId,
        type: 'parent-child',
        label: 'calls',
      });
    }
  }

  // Calculate layout positions using a simple top-down layout
  calculateLayout(nodes, edges, traceStartNs);

  return {
    nodes,
    edges,
    traceId: trace.traceId,
    statementId: trace.statementId,
  };
}

/**
 * Calculate layout positions for nodes using a layered approach.
 */
function calculateLayout(
  nodes: SpanNode[],
  edges: DiagramEdge[],
  traceStartNs: number
): void {
  if (nodes.length === 0) return;

  // Build adjacency info
  const nodeMap = new Map<string, SpanNode>();
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    children.set(node.id, []);
  }

  for (const edge of edges) {
    const childList = children.get(edge.source);
    if (childList) {
      childList.push(edge.target);
    }
    hasParent.add(edge.target);
  }

  // Find root nodes (no parent)
  const roots = nodes.filter((n) => !hasParent.has(n.id));

  // Assign layers using BFS from roots
  const layers = new Map<string, number>();
  const queue: Array<{ id: string; layer: number }> = roots.map((r) => ({
    id: r.id,
    layer: 0,
  }));

  let maxLayer = 0;

  while (queue.length > 0) {
    const { id, layer } = queue.shift()!;
    if (layers.has(id)) continue;

    layers.set(id, layer);
    maxLayer = Math.max(maxLayer, layer);

    const nodeChildren = children.get(id) || [];
    for (const childId of nodeChildren) {
      if (!layers.has(childId)) {
        queue.push({ id: childId, layer: layer + 1 });
      }
    }
  }

  // Handle any disconnected nodes
  for (const node of nodes) {
    if (!layers.has(node.id)) {
      layers.set(node.id, 0);
    }
  }

  // Group nodes by layer
  const layerNodes = new Map<number, SpanNode[]>();
  for (const node of nodes) {
    const layer = layers.get(node.id) || 0;
    if (!layerNodes.has(layer)) {
      layerNodes.set(layer, []);
    }
    layerNodes.get(layer)!.push(node);
  }

  // Calculate positions
  const nodeWidth = 180;
  const nodeHeight = 60;
  const horizontalGap = 40;
  const verticalGap = 80;

  for (const [layer, layerNodeList] of layerNodes) {
    // Sort by start time within layer for consistent ordering
    layerNodeList.sort((a, b) => a.duration - b.duration);

    const totalWidth =
      layerNodeList.length * nodeWidth +
      (layerNodeList.length - 1) * horizontalGap;
    const startX = -totalWidth / 2;

    layerNodeList.forEach((node, index) => {
      node.x = startX + index * (nodeWidth + horizontalGap);
      node.y = layer * (nodeHeight + verticalGap);
    });
  }
}

/**
 * Get the main execution path through the diagram.
 * Returns the IDs of nodes on the main path.
 */
export function getMainPath(diagram: DiagramData): string[] {
  const { nodes, edges } = diagram;

  if (nodes.length === 0) return [];

  // Build parent-child relationships
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();

  for (const edge of edges) {
    if (!children.has(edge.source)) {
      children.set(edge.source, []);
    }
    children.get(edge.source)!.push(edge.target);
    hasParent.add(edge.target);
  }

  // Find root (first node with no parent)
  const roots = nodes.filter((n) => !hasParent.has(n.id));
  if (roots.length === 0) return [nodes[0].id];

  // BFS to get longest path
  const path: string[] = [];
  const queue: string[] = [roots[0].id];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    path.push(nodeId);

    const nodeChildren = children.get(nodeId) || [];
    if (nodeChildren.length > 0) {
      // Take first child (main path)
      queue.push(nodeChildren[0]);
    }
  }

  return path;
}

/**
 * Find nodes connected to a specific node.
 */
export function getConnectedNodes(
  diagram: DiagramData,
  nodeId: string
): { incoming: string[]; outgoing: string[] } {
  const incoming: string[] = [];
  const outgoing: string[] = [];

  for (const edge of diagram.edges) {
    if (edge.target === nodeId) {
      incoming.push(edge.source);
    }
    if (edge.source === nodeId) {
      outgoing.push(edge.target);
    }
  }

  return { incoming, outgoing };
}
