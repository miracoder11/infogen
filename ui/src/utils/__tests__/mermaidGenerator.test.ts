import { describe, it, expect } from 'vitest';
import {
  generateMermaidFlowchart,
  generateMermaidSequence,
  generateMermaidState,
  validateMermaidSyntax,
  generateMermaidLiveUrl,
} from '../mermaidGenerator';
import { DiagramData, SpanNode, DiagramEdge } from '../diagramTransform';
import { ExecutionTrajectory, TrajectoryStep } from '../trajectoryTransform';
import { SerializedTrace } from '../traceTransform';

function createMockDiagram(): DiagramData {
  const nodes: SpanNode[] = [
    {
      id: 'span-1',
      label: 'Agent Execute',
      type: 'agent',
      x: 0,
      y: 0,
      attributes: {},
      status: 'ok',
      duration: 100,
    },
    {
      id: 'span-2',
      label: 'LLM: gpt-4',
      type: 'llm',
      x: 0,
      y: 100,
      attributes: { 'llm.model': 'gpt-4' },
      status: 'ok',
      duration: 50,
    },
    {
      id: 'span-3',
      label: 'Tool: readFile',
      type: 'tool',
      x: 0,
      y: 200,
      attributes: { 'tool.name': 'readFile' },
      status: 'ok',
      duration: 25,
    },
  ];

  const edges: DiagramEdge[] = [
    { id: 'e1', source: 'span-1', target: 'span-2', type: 'parent-child' },
    { id: 'e2', source: 'span-2', target: 'span-3', type: 'parent-child' },
  ];

  return {
    nodes,
    edges,
    traceId: 'test-trace',
    statementId: 'ds-001',
  };
}

function createMockTrajectory(): ExecutionTrajectory {
  return {
    traceId: 'test-trace',
    statementId: 'ds-001',
    steps: [
      {
        spanId: 'span-1',
        name: 'agent.execute',
        label: 'execute',
        order: 0,
        branch: 'main',
        startTime: 0,
        duration: 100,
        status: 'ok',
        depth: 0,
        children: [],
        attributes: {},
      },
    ],
    branches: [],
    totalDuration: 100,
    mainPath: ['span-1'],
  };
}

function createMockTrace(): SerializedTrace {
  return {
    traceId: 'test-trace',
    statementId: 'ds-001',
    startTime: 0,
    duration: 100000000,
    spans: [
      {
        spanId: 'span-1',
        parentSpanId: undefined,
        name: 'agent.execute',
        kind: 1,
        startTime: [0, 0],
        endTime: [0, 100000000],
        duration: [0, 100000000],
        status: { code: 1 },
        attributes: {},
        events: [],
      },
      {
        spanId: 'span-2',
        parentSpanId: 'span-1',
        name: 'llm.inference',
        kind: 1,
        startTime: [0, 10000000],
        endTime: [0, 60000000],
        duration: [0, 50000000],
        status: { code: 1 },
        attributes: {},
        events: [],
      },
    ],
  };
}

describe('generateMermaidFlowchart', () => {
  it('generates flowchart for empty diagram', () => {
    const diagram: DiagramData = {
      nodes: [],
      edges: [],
      traceId: 'test',
    };
    const code = generateMermaidFlowchart(diagram);

    expect(code).toContain('flowchart TD');
    expect(code).toContain('No data to display');
  });

  it('generates flowchart with nodes', () => {
    const diagram = createMockDiagram();
    const code = generateMermaidFlowchart(diagram);

    expect(code).toContain('flowchart TD');
    expect(code).toContain('span-1');
    expect(code).toContain('span-2');
    expect(code).toContain('span-3');
  });

  it('generates edges between nodes', () => {
    const diagram = createMockDiagram();
    const code = generateMermaidFlowchart(diagram);

    expect(code).toContain('-->');
    expect(code).toContain('span-1');
    expect(code).toContain('span-2');
  });

  it('escapes special characters in labels', () => {
    const diagram: DiagramData = {
      nodes: [
        {
          id: '1',
          label: 'Test "quoted" [bracket]',
          type: 'agent',
          attributes: {},
          status: 'ok',
          duration: 100,
        },
      ],
      edges: [],
      traceId: 'test',
    };

    const code = generateMermaidFlowchart(diagram);
    expect(code).not.toContain('"quoted"');
    expect(code).toContain("'quoted'");
  });

  it('adds error class for error nodes', () => {
    const diagram: DiagramData = {
      nodes: [
        {
          id: '1',
          label: 'Error Node',
          type: 'agent',
          attributes: {},
          status: 'error',
          duration: 100,
        },
      ],
      edges: [],
      traceId: 'test',
    };

    const code = generateMermaidFlowchart(diagram);
    expect(code).toContain(':::error');
    expect(code).toContain('classDef error');
  });
});

describe('generateMermaidSequence', () => {
  it('generates sequence for empty trajectory', () => {
    const trajectory: ExecutionTrajectory = {
      traceId: 'test',
      steps: [],
      branches: [],
      totalDuration: 0,
      mainPath: [],
    };
    const code = generateMermaidSequence(trajectory);

    expect(code).toContain('sequenceDiagram');
    expect(code).toContain('No execution data');
  });

  it('generates sequence with participants', () => {
    const trajectory = createMockTrajectory();
    const code = generateMermaidSequence(trajectory);

    expect(code).toContain('sequenceDiagram');
    expect(code).toContain('participant');
  });

  it('adds messages between participants', () => {
    const trajectory: ExecutionTrajectory = {
      traceId: 'test',
      steps: [
        {
          spanId: '1',
          name: 'agent.execute',
          label: 'execute',
          order: 0,
          branch: 'main',
          startTime: 0,
          duration: 100,
          status: 'ok',
          depth: 0,
          children: [
            {
              spanId: '2',
              name: 'llm.inference',
              label: 'inference',
              order: 1,
              branch: 'main',
              startTime: 10,
              duration: 50,
              status: 'ok',
              depth: 1,
              children: [],
              attributes: {},
            },
          ],
          attributes: {},
        },
      ],
      branches: [],
      totalDuration: 100,
      mainPath: ['1', '2'],
    };

    const code = generateMermaidSequence(trajectory);
    expect(code).toContain('->>');
  });
});

describe('generateMermaidState', () => {
  it('generates state diagram for empty trace', () => {
    const trace: SerializedTrace = {
      traceId: 'test',
      startTime: 0,
      duration: 0,
      spans: [],
    };

    const code = generateMermaidState(trace);
    expect(code).toContain('stateDiagram-v2');
    expect(code).toContain('[*] --> Empty');
  });

  it('generates state diagram with states', () => {
    const trace = createMockTrace();
    const code = generateMermaidState(trace);

    expect(code).toContain('stateDiagram-v2');
    expect(code).toContain('[*]');
  });

  it('adds transitions between states', () => {
    const trace = createMockTrace();
    const code = generateMermaidState(trace);

    expect(code).toContain('-->');
  });
});

describe('validateMermaidSyntax', () => {
  it('validates correct flowchart syntax', () => {
    const code = 'flowchart TD\n    A --> B';
    const result = validateMermaidSyntax(code);
    expect(result.valid).toBe(true);
  });

  it('validates correct sequence syntax', () => {
    const code = 'sequenceDiagram\n    A->>B: Hello';
    const result = validateMermaidSyntax(code);
    expect(result.valid).toBe(true);
  });

  it('rejects missing diagram type', () => {
    const code = 'A --> B';
    const result = validateMermaidSyntax(code);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing diagram type');
  });

  it('rejects unbalanced brackets', () => {
    const code = 'flowchart TD\n    A[[test]';
    const result = validateMermaidSyntax(code);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Unbalanced');
  });
});

describe('generateMermaidLiveUrl', () => {
  it('generates URL with encoded diagram', () => {
    const code = 'flowchart TD\n    A --> B';
    const url = generateMermaidLiveUrl(code);

    expect(url).toContain('mermaid.live');
    expect(url).toContain('#');
  });
});
