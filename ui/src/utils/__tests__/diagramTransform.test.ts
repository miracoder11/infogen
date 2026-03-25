import { describe, it, expect } from 'vitest';
import {
  transformToDiagram,
  detectSpanType,
  generateSpanLabel,
  getMainPath,
  getConnectedNodes,
  SpanNode,
  DiagramData,
  DiagramEdge,
} from '../diagramTransform';
import { SerializedTrace, SerializedSpan } from '../traceTransform';

function createMockSpan(
  spanId: string,
  name: string,
  parentSpanId?: string,
  attributes?: Record<string, unknown>,
  status: { code: number } = { code: 1 }
): SerializedSpan {
  return {
    spanId,
    parentSpanId,
    name,
    kind: 1,
    startTime: [0, 0],
    endTime: [0, 1000000],
    duration: [0, 1000000],
    status,
    attributes: attributes || {},
    events: [],
  };
}

function createMockTrace(spans: SerializedSpan[]): SerializedTrace {
  return {
    traceId: 'test-trace-123',
    statementId: 'ds-20260326-001',
    startTime: 0,
    duration: 10000000,
    spans,
  };
}

describe('detectSpanType', () => {
  it('detects agent span from name', () => {
    const span = createMockSpan('1', 'agent.execute');
    expect(detectSpanType(span)).toBe('agent');
  });

  it('detects agent span from attributes', () => {
    const span = createMockSpan('1', 'custom', undefined, { 'agent.action': 'execute' });
    expect(detectSpanType(span)).toBe('agent');
  });

  it('detects LLM span from name', () => {
    const span = createMockSpan('1', 'llm.inference');
    expect(detectSpanType(span)).toBe('llm');
  });

  it('detects LLM span from attributes', () => {
    const span = createMockSpan('1', 'custom', undefined, { 'llm.provider': 'openai' });
    expect(detectSpanType(span)).toBe('llm');
  });

  it('detects tool span from name', () => {
    const span = createMockSpan('1', 'tool.readFile');
    expect(detectSpanType(span)).toBe('tool');
  });

  it('detects tool span from attributes', () => {
    const span = createMockSpan('1', 'custom', undefined, { 'tool.name': 'readFile' });
    expect(detectSpanType(span)).toBe('tool');
  });

  it('returns custom for unknown span types', () => {
    const span = createMockSpan('1', 'unknown.operation');
    expect(detectSpanType(span)).toBe('custom');
  });
});

describe('generateSpanLabel', () => {
  it('extracts action from agent span', () => {
    const span = createMockSpan('1', 'agent.execute', undefined, { 'agent.action': 'execute' });
    expect(generateSpanLabel(span)).toBe('execute');
  });

  it('extracts model from LLM span', () => {
    const span = createMockSpan('1', 'llm.inference', undefined, { 'llm.model': 'gpt-4' });
    expect(generateSpanLabel(span)).toBe('LLM: gpt-4');
  });

  it('returns default for LLM span without model', () => {
    const span = createMockSpan('1', 'llm.inference');
    expect(generateSpanLabel(span)).toBe('LLM Call');
  });

  it('extracts tool name from tool span', () => {
    const span = createMockSpan('1', 'tool.custom', undefined, { 'tool.name': 'readFile' });
    expect(generateSpanLabel(span)).toBe('Tool: readFile');
  });

  it('uses span name for custom spans', () => {
    const span = createMockSpan('1', 'custom.operation');
    expect(generateSpanLabel(span)).toBe('custom.operation');
  });
});

describe('transformToDiagram', () => {
  it('returns empty diagram for empty trace', () => {
    const trace = createMockTrace([]);
    const diagram = transformToDiagram(trace);

    expect(diagram.nodes).toEqual([]);
    expect(diagram.edges).toEqual([]);
    expect(diagram.traceId).toBe('test-trace-123');
  });

  it('creates node for single span', () => {
    const trace = createMockTrace([createMockSpan('span-1', 'agent.execute')]);
    const diagram = transformToDiagram(trace);

    expect(diagram.nodes).toHaveLength(1);
    expect(diagram.nodes[0].id).toBe('span-1');
    expect(diagram.nodes[0].label).toBe('execute');
    expect(diagram.nodes[0].type).toBe('agent');
    expect(diagram.edges).toHaveLength(0);
  });

  it('creates edge for parent-child relationship', () => {
    const parentSpan = createMockSpan('parent', 'agent.execute');
    const childSpan = createMockSpan('child', 'tool.readFile', 'parent');

    const trace = createMockTrace([parentSpan, childSpan]);
    const diagram = transformToDiagram(trace);

    expect(diagram.nodes).toHaveLength(2);
    expect(diagram.edges).toHaveLength(1);
    expect(diagram.edges[0].source).toBe('parent');
    expect(diagram.edges[0].target).toBe('child');
    expect(diagram.edges[0].type).toBe('parent-child');
  });

  it('creates multiple edges for nested hierarchy', () => {
    const span1 = createMockSpan('1', 'agent.execute');
    const span2 = createMockSpan('2', 'llm.inference', '1', { 'llm.model': 'gpt-4' });
    const span3 = createMockSpan('3', 'tool.readFile', '2');

    const trace = createMockTrace([span1, span2, span3]);
    const diagram = transformToDiagram(trace);

    expect(diagram.nodes).toHaveLength(3);
    expect(diagram.edges).toHaveLength(2);

    // Check edge connections
    const edgeSources = diagram.edges.map((e) => e.source);
    expect(edgeSources).toContain('1');
    expect(edgeSources).toContain('2');
  });

  it('sets error status on nodes with error', () => {
    const span = createMockSpan('1', 'agent.execute', undefined, {}, { code: 2 });
    const trace = createMockTrace([span]);
    const diagram = transformToDiagram(trace);

    expect(diagram.nodes[0].status).toBe('error');
  });

  it('sets ok status on nodes without error', () => {
    const span = createMockSpan('1', 'agent.execute', undefined, {}, { code: 1 });
    const trace = createMockTrace([span]);
    const diagram = transformToDiagram(trace);

    expect(diagram.nodes[0].status).toBe('ok');
  });

  it('calculates layout positions for nodes', () => {
    const span1 = createMockSpan('1', 'agent.execute');
    const span2 = createMockSpan('2', 'tool.readFile', '1');

    const trace = createMockTrace([span1, span2]);
    const diagram = transformToDiagram(trace);

    // Both nodes should have positions
    expect(diagram.nodes[0].x).toBeDefined();
    expect(diagram.nodes[0].y).toBeDefined();
    expect(diagram.nodes[1].x).toBeDefined();
    expect(diagram.nodes[1].y).toBeDefined();
  });

  it('preserves statementId from trace', () => {
    const trace = createMockTrace([createMockSpan('1', 'agent.execute')]);
    const diagram = transformToDiagram(trace);

    expect(diagram.statementId).toBe('ds-20260326-001');
  });
});

describe('getMainPath', () => {
  it('returns empty array for empty diagram', () => {
    const diagram: DiagramData = {
      nodes: [],
      edges: [],
      traceId: 'test',
    };
    expect(getMainPath(diagram)).toEqual([]);
  });

  it('returns single node for diagram with one node', () => {
    const diagram: DiagramData = {
      nodes: [{ id: '1', label: 'test', type: 'agent', attributes: {}, status: 'ok', duration: 100 }],
      edges: [],
      traceId: 'test',
    };
    expect(getMainPath(diagram)).toEqual(['1']);
  });

  it('follows parent-child chain', () => {
    const diagram: DiagramData = {
      nodes: [
        { id: '1', label: 'root', type: 'agent', attributes: {}, status: 'ok', duration: 100 },
        { id: '2', label: 'child', type: 'tool', attributes: {}, status: 'ok', duration: 50 },
      ],
      edges: [
        { id: 'e1', source: '1', target: '2', type: 'parent-child' },
      ],
      traceId: 'test',
    };

    const path = getMainPath(diagram);
    expect(path).toEqual(['1', '2']);
  });
});

describe('getConnectedNodes', () => {
  it('finds incoming and outgoing connections', () => {
    const diagram: DiagramData = {
      nodes: [
        { id: '1', label: 'root', type: 'agent', attributes: {}, status: 'ok', duration: 100 },
        { id: '2', label: 'middle', type: 'tool', attributes: {}, status: 'ok', duration: 50 },
        { id: '3', label: 'leaf', type: 'tool', attributes: {}, status: 'ok', duration: 25 },
      ],
      edges: [
        { id: 'e1', source: '1', target: '2', type: 'parent-child' },
        { id: 'e2', source: '2', target: '3', type: 'parent-child' },
      ],
      traceId: 'test',
    };

    const connections = getConnectedNodes(diagram, '2');
    expect(connections.incoming).toEqual(['1']);
    expect(connections.outgoing).toEqual(['3']);
  });

  it('returns empty arrays for unconnected node', () => {
    const diagram: DiagramData = {
      nodes: [
        { id: '1', label: 'isolated', type: 'agent', attributes: {}, status: 'ok', duration: 100 },
      ],
      edges: [],
      traceId: 'test',
    };

    const connections = getConnectedNodes(diagram, '1');
    expect(connections.incoming).toEqual([]);
    expect(connections.outgoing).toEqual([]);
  });
});
