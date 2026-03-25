/**
 * Transforms OpenTelemetry trace data into execution trajectory format.
 * Shows step-by-step execution path with branch visualization.
 */

import { SerializedTrace, SerializedSpan, formatDuration } from './traceTransform.js';

export interface TrajectoryStep {
  spanId: string;
  name: string;
  label: string;
  order: number;
  branch: 'main' | 'alternate' | 'error';
  startTime: number; // relative to trace start (ms)
  duration: number; // milliseconds
  status: 'ok' | 'error';
  depth: number;
  children: TrajectoryStep[];
  attributes: Record<string, unknown>;
}

export interface ExecutionTrajectory {
  traceId: string;
  statementId?: string;
  steps: TrajectoryStep[];
  branches: string[];
  totalDuration: number;
  mainPath: string[];
}

/**
 * Detect the type of step based on span name.
 */
function getStepBranch(span: SerializedSpan, isMainPath: boolean): TrajectoryStep['branch'] {
  if (span.status.code === 2) {
    return 'error';
  }
  return isMainPath ? 'main' : 'alternate';
}

/**
 * Generate a human-readable label for a step.
 */
function generateStepLabel(span: SerializedSpan): string {
  const name = span.name;
  const attrs = span.attributes || {};

  if (name.startsWith('agent.')) {
    return String(attrs['agent.action'] || name.replace('agent.', ''));
  }

  if (name.startsWith('llm.')) {
    const model = attrs['llm.model'];
    if (model) {
      return `LLM: ${model}`;
    }
    return 'LLM Call';
  }

  if (name.startsWith('tool.')) {
    return String(attrs['tool.name'] || name.replace('tool.', ''));
  }

  return name;
}

/**
 * Build hierarchy from flat span list using parent-child relationships.
 */
function buildHierarchy(
  spans: SerializedSpan[],
  traceStartMs: number
): { roots: TrajectoryStep[]; allSteps: TrajectoryStep[] } {
  const spanMap = new Map<string, SerializedSpan>();
  const stepMap = new Map<string, TrajectoryStep>();
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();

  // First pass: create maps
  for (const span of spans) {
    spanMap.set(span.spanId, span);
    children.set(span.spanId, []);
    if (span.parentSpanId) {
      hasParent.add(span.spanId);
      const parentChildren = children.get(span.parentSpanId);
      if (parentChildren) {
        parentChildren.push(span.spanId);
      }
    }
  }

  // Find roots (spans without parents)
  const roots = spans.filter((s) => !hasParent.has(s.spanId));

  // Build hierarchy recursively
  const allSteps: TrajectoryStep[] = [];
  let order = 0;

  function buildStep(span: SerializedSpan, depth: number, isMainPath: boolean): TrajectoryStep {
    const startTimeMs = span.startTime[0] * 1000 + span.startTime[1] / 1_000_000;
    const durationMs = span.duration[0] * 1000 + span.duration[1] / 1_000_000;

    const step: TrajectoryStep = {
      spanId: span.spanId,
      name: span.name,
      label: generateStepLabel(span),
      order: order++,
      branch: getStepBranch(span, isMainPath),
      startTime: startTimeMs - traceStartMs,
      duration: durationMs,
      status: span.status.code === 2 ? 'error' : 'ok',
      depth,
      children: [],
      attributes: span.attributes || {},
    };

    stepMap.set(span.spanId, step);
    allSteps.push(step);

    // Build children
    const spanChildren = children.get(span.spanId) || [];
    for (let i = 0; i < spanChildren.length; i++) {
      const childSpan = spanMap.get(spanChildren[i]);
      if (childSpan) {
        // First child is on main path, others are alternate
        const childIsMainPath = isMainPath && i === 0;
        step.children.push(buildStep(childSpan, depth + 1, childIsMainPath));
      }
    }

    return step;
  }

  // Build from roots
  const rootSteps: TrajectoryStep[] = [];
  for (let i = 0; i < roots.length; i++) {
    const isMainPath = i === 0;
    rootSteps.push(buildStep(roots[i], 0, isMainPath));
  }

  return { roots: rootSteps, allSteps };
}

/**
 * Extract main execution path from trajectory.
 */
function extractMainPath(steps: TrajectoryStep[]): string[] {
  const path: string[] = [];

  function traverse(step: TrajectoryStep) {
    if (step.branch === 'main') {
      path.push(step.spanId);
      if (step.children.length > 0) {
        traverse(step.children[0]);
      }
    }
  }

  for (const step of steps) {
    if (step.branch === 'main') {
      traverse(step);
      break;
    }
  }

  return path;
}

/**
 * Extract all branch IDs from trajectory.
 */
function extractBranches(steps: TrajectoryStep[]): string[] {
  const branches: string[] = [];

  function traverse(step: TrajectoryStep) {
    if (step.branch === 'alternate' || step.branch === 'error') {
      branches.push(step.spanId);
    }
    for (const child of step.children) {
      traverse(child);
    }
  }

  for (const step of steps) {
    traverse(step);
  }

  return branches;
}

/**
 * Transform a serialized trace into execution trajectory.
 */
export function transformToTrajectory(trace: SerializedTrace): ExecutionTrajectory {
  if (!trace.spans || trace.spans.length === 0) {
    return {
      traceId: trace.traceId,
      statementId: trace.statementId,
      steps: [],
      branches: [],
      totalDuration: 0,
      mainPath: [],
    };
  }

  // Calculate trace start time
  const traceStartMs =
    trace.spans[0].startTime[0] * 1000 + trace.spans[0].startTime[1] / 1_000_000;

  // Build hierarchy
  const { roots, allSteps } = buildHierarchy(trace.spans, traceStartMs);

  // Calculate total duration
  const totalDurationMs = trace.duration / 1_000_000;

  // Extract paths
  const mainPath = extractMainPath(roots);
  const branches = extractBranches(roots);

  return {
    traceId: trace.traceId,
    statementId: trace.statementId,
    steps: roots,
    branches,
    totalDuration: totalDurationMs,
    mainPath,
  };
}

/**
 * Flatten trajectory steps for linear display.
 */
export function flattenSteps(steps: TrajectoryStep[]): TrajectoryStep[] {
  const result: TrajectoryStep[] = [];

  function collect(stepList: TrajectoryStep[]) {
    for (const step of stepList) {
      result.push(step);
      collect(step.children);
    }
  }

  collect(steps);
  result.sort((a, b) => a.startTime - b.startTime);

  return result;
}

/**
 * Get step at specific time position.
 */
export function getStepAtTime(
  trajectory: ExecutionTrajectory,
  timeMs: number
): TrajectoryStep | null {
  const flatSteps = flattenSteps(trajectory.steps);

  for (const step of flatSteps) {
    const stepEnd = step.startTime + step.duration;
    if (timeMs >= step.startTime && timeMs < stepEnd) {
      return step;
    }
  }

  return null;
}

/**
 * Get all steps up to a specific time.
 */
export function getStepsUpToTime(
  trajectory: ExecutionTrajectory,
  timeMs: number
): TrajectoryStep[] {
  const flatSteps = flattenSteps(trajectory.steps);

  return flatSteps.filter((step) => step.startTime <= timeMs);
}
