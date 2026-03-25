/**
 * Transforms OpenTelemetry span data into timeline visualization format.
 */

export interface TimelineSpan {
  id: string;
  name: string;
  startTime: number;  // relative to trace start (ms)
  duration: number;   // milliseconds
  depth: number;      // nesting level (0 = root)
  children: TimelineSpan[];
  status: 'ok' | 'error';
  attributes: Record<string, unknown>;
}

export interface SerializedSpan {
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind: number;
  startTime: [number, number];  // [seconds, nanoseconds]
  endTime: [number, number];
  duration: [number, number];
  status: { code: number; message?: string };
  attributes: Record<string, unknown>;
  events: Array<{ name: string; time: [number, number]; attributes?: Record<string, unknown> }>;
  links?: Array<{ spanId: string; traceId: string; attributes?: Record<string, unknown> }>;
}

export interface SerializedTrace {
  traceId: string;
  statementId?: string;
  deliverableType?: string;
  startTime: number;
  duration: number;
  spans: SerializedSpan[];
}

/**
 * Convert HR time [seconds, nanoseconds] to milliseconds
 */
function hrToMs(hr: [number, number]): number {
  return hr[0] * 1000 + hr[1] / 1_000_000;
}

/**
 * Transform serialized trace data into timeline visualization format.
 * Builds parent-child relationships and calculates relative timing.
 */
export function transformSpans(trace: SerializedTrace): TimelineSpan[] {
  if (!trace.spans || trace.spans.length === 0) {
    return [];
  }

  const traceStartMs = hrToMs(trace.spans[0].startTime);

  // Build span map and find roots
  const spanMap = new Map<string, TimelineSpan>();
  const rootSpans: TimelineSpan[] = [];

  // First pass: create all spans
  for (const span of trace.spans) {
    const startMs = hrToMs(span.startTime);
    const durationMs = hrToMs(span.duration);

    const timelineSpan: TimelineSpan = {
      id: span.spanId,
      name: span.name,
      startTime: startMs - traceStartMs,  // relative to trace start
      duration: durationMs,
      depth: 0,  // will be calculated in second pass
      children: [],
      status: span.status.code === 2 ? 'error' : 'ok',
      attributes: span.attributes || {},
    };

    spanMap.set(span.spanId, timelineSpan);
  }

  // Second pass: build hierarchy and calculate depth
  for (const span of trace.spans) {
    const timelineSpan = spanMap.get(span.spanId)!;

    if (span.parentSpanId && spanMap.has(span.parentSpanId)) {
      const parent = spanMap.get(span.parentSpanId)!;
      parent.children.push(timelineSpan);
      timelineSpan.depth = parent.depth + 1;
    } else {
      rootSpans.push(timelineSpan);
    }
  }

  // Recursively update depths based on hierarchy
  function updateDepths(spans: TimelineSpan[], baseDepth: number) {
    for (const span of spans) {
      span.depth = baseDepth;
      updateDepths(span.children, baseDepth + 1);
    }
  }

  updateDepths(rootSpans, 0);

  return rootSpans;
}

/**
 * Flatten span hierarchy for display, sorted by start time.
 */
export function flattenSpans(spans: TimelineSpan[]): TimelineSpan[] {
  const result: TimelineSpan[] = [];

  function collect(spanList: TimelineSpan[]) {
    for (const span of spanList) {
      result.push(span);
      collect(span.children);
    }
  }

  collect(spans);
  result.sort((a, b) => a.startTime - b.startTime);

  return result;
}

/**
 * Format duration in human-readable form.
 */
export function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
