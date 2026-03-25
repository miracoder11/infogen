import { describe, it, expect } from 'vitest';
import {
  transformToTrajectory,
  flattenSteps,
  getStepAtTime,
  getStepsUpToTime,
  TrajectoryStep,
  ExecutionTrajectory,
} from '../trajectoryTransform';
import { SerializedTrace, SerializedSpan } from '../traceTransform';

function createMockSpan(
  spanId: string,
  name: string,
  parentSpanId?: string,
  options?: {
    startTime?: [number, number];
    duration?: [number, number];
    status?: { code: number };
    attributes?: Record<string, unknown>;
  }
): SerializedSpan {
  const opts = options || {};
  return {
    spanId,
    parentSpanId,
    name,
    kind: 1,
    startTime: opts.startTime || [0, parseInt(spanId) * 1000000],
    endTime: opts.startTime || [0, parseInt(spanId) * 1000000 + 500000],
    duration: opts.duration || [0, 1000000],
    status: opts.status || { code: 1 },
    attributes: opts.attributes || {},
    events: [],
  };
}

function createMockTrace(spans: SerializedSpan[]): SerializedTrace {
  return {
    traceId: 'test-trajectory-123',
    statementId: 'ds-20260326-001',
    startTime: 0,
    duration: 10000000,
    spans,
  };
}

describe('transformToTrajectory', () => {
  it('returns empty trajectory for empty trace', () => {
    const trace = createMockTrace([]);
    const trajectory = transformToTrajectory(trace);

    expect(trajectory.steps).toEqual([]);
    expect(trajectory.branches).toEqual([]);
    expect(trajectory.mainPath).toEqual([]);
    expect(trajectory.totalDuration).toBe(10);
  });

  it('creates step for single span', () => {
    const trace = createMockTrace([createMockSpan('1', 'agent.execute')]);
    const trajectory = transformToTrajectory(trace);

    expect(trajectory.steps).toHaveLength(1);
    expect(trajectory.steps[0].spanId).toBe('1');
    expect(trajectory.steps[0].name).toBe('agent.execute');
    expect(trajectory.steps[0].branch).toBe('main');
  });

  it('creates parent-child hierarchy', () => {
    const parent = createMockSpan('1', 'agent.execute');
    const child = createMockSpan('2', 'tool.readFile', '1');

    const trace = createMockTrace([parent, child]);
    const trajectory = transformToTrajectory(trace);

    expect(trajectory.steps).toHaveLength(1);
    expect(trajectory.steps[0].children).toHaveLength(1);
    expect(trajectory.steps[0].children[0].spanId).toBe('2');
  });

  it('marks first child as main branch', () => {
    const parent = createMockSpan('1', 'agent.execute');
    const child1 = createMockSpan('2', 'tool.readFile', '1');
    const child2 = createMockSpan('3', 'tool.writeFile', '1');

    const trace = createMockTrace([parent, child1, child2]);
    const trajectory = transformToTrajectory(trace);

    expect(trajectory.steps[0].children[0].branch).toBe('main');
    expect(trajectory.steps[0].children[1].branch).toBe('alternate');
  });

  it('marks error spans as error branch', () => {
    const span = createMockSpan('1', 'agent.execute', undefined, {
      status: { code: 2 },
    });

    const trace = createMockTrace([span]);
    const trajectory = transformToTrajectory(trace);

    expect(trajectory.steps[0].branch).toBe('error');
    expect(trajectory.steps[0].status).toBe('error');
  });

  it('extracts main path correctly', () => {
    const parent = createMockSpan('1', 'agent.execute');
    const child1 = createMockSpan('2', 'tool.readFile', '1');
    const grandchild = createMockSpan('3', 'llm.inference', '2');
    const child2 = createMockSpan('4', 'tool.writeFile', '1');

    const trace = createMockTrace([parent, child1, grandchild, child2]);
    const trajectory = transformToTrajectory(trace);

    expect(trajectory.mainPath).toContain('1');
    expect(trajectory.mainPath).toContain('2');
    expect(trajectory.mainPath).toContain('3');
    expect(trajectory.mainPath).not.toContain('4');
  });

  it('extracts alternate branches', () => {
    const parent = createMockSpan('1', 'agent.execute');
    const child1 = createMockSpan('2', 'tool.readFile', '1');
    const child2 = createMockSpan('3', 'tool.writeFile', '1');

    const trace = createMockTrace([parent, child1, child2]);
    const trajectory = transformToTrajectory(trace);

    expect(trajectory.branches).toContain('3');
    expect(trajectory.branches).not.toContain('1');
    expect(trajectory.branches).not.toContain('2');
  });

  it('preserves statementId from trace', () => {
    const trace = createMockTrace([createMockSpan('1', 'agent.execute')]);
    const trajectory = transformToTrajectory(trace);

    expect(trajectory.statementId).toBe('ds-20260326-001');
  });

  it('calculates step depth correctly', () => {
    const parent = createMockSpan('1', 'agent.execute');
    const child = createMockSpan('2', 'tool.readFile', '1');
    const grandchild = createMockSpan('3', 'llm.inference', '2');

    const trace = createMockTrace([parent, child, grandchild]);
    const trajectory = transformToTrajectory(trace);

    expect(trajectory.steps[0].depth).toBe(0);
    expect(trajectory.steps[0].children[0].depth).toBe(1);
    expect(trajectory.steps[0].children[0].children[0].depth).toBe(2);
  });
});

describe('flattenSteps', () => {
  it('returns empty array for empty steps', () => {
    expect(flattenSteps([])).toEqual([]);
  });

  it('returns single step unchanged', () => {
    const step: TrajectoryStep = {
      spanId: '1',
      name: 'test',
      label: 'Test',
      order: 0,
      branch: 'main',
      startTime: 0,
      duration: 100,
      status: 'ok',
      depth: 0,
      children: [],
      attributes: {},
    };

    expect(flattenSteps([step])).toHaveLength(1);
  });

  it('flattens nested hierarchy', () => {
    const steps: TrajectoryStep[] = [
      {
        spanId: '1',
        name: 'parent',
        label: 'Parent',
        order: 0,
        branch: 'main',
        startTime: 0,
        duration: 100,
        status: 'ok',
        depth: 0,
        children: [
          {
            spanId: '2',
            name: 'child',
            label: 'Child',
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
    ];

    const flat = flattenSteps(steps);
    expect(flat).toHaveLength(2);
    expect(flat.map((s) => s.spanId)).toContain('1');
    expect(flat.map((s) => s.spanId)).toContain('2');
  });

  it('sorts by start time', () => {
    const steps: TrajectoryStep[] = [
      {
        spanId: '1',
        name: 'late',
        label: 'Late',
        order: 1,
        branch: 'main',
        startTime: 100,
        duration: 50,
        status: 'ok',
        depth: 0,
        children: [],
        attributes: {},
      },
      {
        spanId: '2',
        name: 'early',
        label: 'Early',
        order: 0,
        branch: 'main',
        startTime: 0,
        duration: 50,
        status: 'ok',
        depth: 0,
        children: [],
        attributes: {},
      },
    ];

    const flat = flattenSteps(steps);
    expect(flat[0].spanId).toBe('2');
    expect(flat[1].spanId).toBe('1');
  });
});

describe('getStepAtTime', () => {
  function createTestTrajectory(): ExecutionTrajectory {
    return {
      traceId: 'test',
      steps: [
        {
          spanId: '1',
          name: 'step1',
          label: 'Step 1',
          order: 0,
          branch: 'main',
          startTime: 0,
          duration: 100,
          status: 'ok',
          depth: 0,
          children: [
            {
              spanId: '2',
              name: 'step2',
              label: 'Step 2',
              order: 1,
              branch: 'main',
              startTime: 100,
              duration: 100,
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
      totalDuration: 200,
      mainPath: ['1', '2'],
    };
  }

  it('returns null for empty trajectory', () => {
    const trajectory: ExecutionTrajectory = {
      traceId: 'test',
      steps: [],
      branches: [],
      totalDuration: 0,
      mainPath: [],
    };

    expect(getStepAtTime(trajectory, 0)).toBeNull();
  });

  it('finds step at given time', () => {
    const trajectory = createTestTrajectory();
    const step = getStepAtTime(trajectory, 50);

    expect(step).not.toBeNull();
    expect(step?.spanId).toBe('1');
  });

  it('finds second step', () => {
    const trajectory = createTestTrajectory();
    const step = getStepAtTime(trajectory, 150);

    expect(step).not.toBeNull();
    expect(step?.spanId).toBe('2');
  });

  it('returns null for time beyond duration', () => {
    const trajectory = createTestTrajectory();
    const step = getStepAtTime(trajectory, 500);

    expect(step).toBeNull();
  });
});

describe('getStepsUpToTime', () => {
  function createTestTrajectory(): ExecutionTrajectory {
    return {
      traceId: 'test',
      steps: [
        {
          spanId: '1',
          name: 'step1',
          label: 'Step 1',
          order: 0,
          branch: 'main',
          startTime: 0,
          duration: 100,
          status: 'ok',
          depth: 0,
          children: [],
          attributes: {},
        },
        {
          spanId: '2',
          name: 'step2',
          label: 'Step 2',
          order: 1,
          branch: 'main',
          startTime: 100,
          duration: 100,
          status: 'ok',
          depth: 0,
          children: [],
          attributes: {},
        },
        {
          spanId: '3',
          name: 'step3',
          label: 'Step 3',
          order: 2,
          branch: 'main',
          startTime: 200,
          duration: 100,
          status: 'ok',
          depth: 0,
          children: [],
          attributes: {},
        },
      ],
      branches: [],
      totalDuration: 300,
      mainPath: ['1', '2', '3'],
    };
  }

  it('returns empty array for empty trajectory', () => {
    const trajectory: ExecutionTrajectory = {
      traceId: 'test',
      steps: [],
      branches: [],
      totalDuration: 0,
      mainPath: [],
    };

    expect(getStepsUpToTime(trajectory, 100)).toEqual([]);
  });

  it('returns steps started before given time', () => {
    const trajectory = createTestTrajectory();
    const steps = getStepsUpToTime(trajectory, 150);

    expect(steps).toHaveLength(2);
    expect(steps.map((s) => s.spanId)).toContain('1');
    expect(steps.map((s) => s.spanId)).toContain('2');
    expect(steps.map((s) => s.spanId)).not.toContain('3');
  });

  it('returns all steps for time beyond duration', () => {
    const trajectory = createTestTrajectory();
    const steps = getStepsUpToTime(trajectory, 500);

    expect(steps).toHaveLength(3);
  });
});
