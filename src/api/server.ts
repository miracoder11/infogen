import express, { Request, Response } from 'express';
import cors from 'cors';
import { getTraceStorage, StoredTrace } from '../storage/trace-storage.js';

/**
 * API Server for trace observability interface.
 * Exposes trace data via REST endpoints for the web UI.
 */

const app = express();
app.use(cors());
app.use(express.json());

/**
 * GET /api/traces - List all traces
 * Query params:
 *   - q: search query (searches span names and attributes)
 *   - statementId: filter by statement/project ID
 *   - status: filter by status (ok, error)
 *   - since: filter by timestamp (Unix nanoseconds)
 */
app.get('/api/traces', (req: Request, res: Response) => {
  const storage = getTraceStorage();
  let traces = storage.getAll();

  // Apply filters
  const { q, statementId, status, since } = req.query;

  if (statementId && typeof statementId === 'string') {
    traces = traces.filter(t => t.statementId === statementId);
  }

  if (status && typeof status === 'string') {
    const isError = status === 'error';
    traces = traces.filter(t =>
      t.spans.some(s => {
        const spanStatus = (s as any).status?.code;
        return isError ? spanStatus === 2 : spanStatus === 1;
      })
    );
  }

  if (since && typeof since === 'string') {
    const sinceTime = Number(since);
    if (!isNaN(sinceTime)) {
      traces = traces.filter(t => t.startTime >= sinceTime);
    }
  }

  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    traces = traces.filter(t =>
      t.spans.some(s =>
        s.name.toLowerCase().includes(query) ||
        Object.values(s.attributes || {}).some(v =>
          String(v).toLowerCase().includes(query)
        )
      )
    );
  }

  // Return summary data
  const summaries = traces.map(t => ({
    traceId: t.traceId,
    statementId: t.statementId,
    deliverableType: t.deliverableType,
    spanCount: t.spans.length,
    startTime: t.startTime,
    duration: t.duration,
    storedAt: t.storedAt,
  }));

  res.json(summaries);
});

/**
 * GET /api/traces/:id - Get trace details with full span data
 */
app.get('/api/traces/:id', (req: Request, res: Response) => {
  const storage = getTraceStorage();
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const trace = storage.get(id);

  if (!trace) {
    res.status(404).json({ error: 'Trace not found' });
    return;
  }

  // Serialize spans for JSON response
  const serialized = {
    traceId: trace.traceId,
    statementId: trace.statementId,
    deliverableType: trace.deliverableType,
    startTime: trace.startTime,
    duration: trace.duration,
    storedAt: trace.storedAt,
    spans: trace.spans.map(span => {
      // Handle both real Span objects and plain objects
      const spanId = typeof span.spanContext === 'function' ? span.spanContext().spanId : (span as any).spanId;
      return {
        spanId,
        parentSpanId: (span as any).parentSpanId || null,
        name: span.name,
        kind: span.kind,
        startTime: span.startTime,
        endTime: span.endTime,
        duration: span.duration,
        status: span.status,
        attributes: span.attributes,
        events: span.events,
        links: span.links,
      };
    }),
  };

  res.json(serialized);
});

/**
 * GET /api/traces/:id/mermaid - Get Mermaid diagram syntax for trace
 * Query params:
 *   - type: diagram type (flowchart, sequence, state)
 */
app.get('/api/traces/:id/mermaid', (req: Request, res: Response) => {
  const storage = getTraceStorage();
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const trace = storage.get(id);

  if (!trace) {
    res.status(404).json({ error: 'Trace not found' });
    return;
  }

  const type = (req.query.type as string) || 'flowchart';

  // Serialize trace for diagram generation
  const serializedTrace = {
    traceId: trace.traceId,
    statementId: trace.statementId,
    deliverableType: trace.deliverableType,
    startTime: trace.startTime,
    duration: trace.duration,
    spans: trace.spans.map(span => {
      // Handle both real Span objects and plain objects
      const spanId = typeof span.spanContext === 'function' ? span.spanContext().spanId : (span as any).spanId;
      return {
        spanId,
        parentSpanId: (span as any).parentSpanId || null,
        name: span.name,
        kind: span.kind,
        startTime: span.startTime,
        endTime: span.endTime,
        duration: span.duration,
        status: span.status,
        attributes: span.attributes,
        events: span.events,
        links: span.links,
      };
    }),
  };

  // Generate Mermaid syntax based on type
  let mermaidCode = '';

  switch (type) {
    case 'sequence':
      mermaidCode = generateSequenceDiagram(serializedTrace);
      break;
    case 'state':
      mermaidCode = generateStateDiagram(serializedTrace);
      break;
    case 'flowchart':
    default:
      mermaidCode = generateFlowchartDiagram(serializedTrace);
      break;
  }

  res.type('text/plain').send(mermaidCode);
});

/**
 * Generate flowchart diagram from trace
 */
function generateFlowchartDiagram(trace: any): string {
  const lines: string[] = ['flowchart TD'];

  if (!trace.spans || trace.spans.length === 0) {
    lines.push('    Empty["No data to display"]');
    return lines.join('\n');
  }

  // Define nodes
  for (const span of trace.spans) {
    const label = escapeMermaidLabel(span.name);
    const statusClass = span.status?.code === 2 ? ':::error' : '';
    const shape = getNodeShape(span.name);
    lines.push(`    ${span.spanId}${shape.start}"${label}"${shape.end}${statusClass}`);
  }

  // Add edges
  for (const span of trace.spans) {
    if (span.parentSpanId) {
      lines.push(`    ${span.parentSpanId} --> ${span.spanId}`);
    }
  }

  // Add styling
  lines.push('');
  lines.push('    classDef error fill:#fef2f2,stroke:#ef4444');

  return lines.join('\n');
}

/**
 * Generate sequence diagram from trace
 */
function generateSequenceDiagram(trace: any): string {
  const lines: string[] = ['sequenceDiagram'];

  if (!trace.spans || trace.spans.length === 0) {
    lines.push('    Note over System: No execution data');
    return lines.join('\n');
  }

  // Collect participants
  const participants = new Set<string>();
  for (const span of trace.spans) {
    const participant = span.name.split('.')[0];
    participants.add(participant);
  }

  // Add participants
  for (const participant of participants) {
    lines.push(`    participant ${participant}`);
  }

  // Add messages
  for (const span of trace.spans) {
    const participant = span.name.split('.')[0];
    const label = escapeMermaidLabel(span.name);

    if (span.parentSpanId) {
      const parentSpan = trace.spans.find((s: any) => s.spanId === span.parentSpanId);
      if (parentSpan) {
        const parentParticipant = parentSpan.name.split('.')[0];
        lines.push(`    ${parentParticipant}->>${participant}: ${label}`);
        continue;
      }
    }

    lines.push(`    Note over ${participant}: ${label}`);
  }

  return lines.join('\n');
}

/**
 * Generate state diagram from trace
 */
function generateStateDiagram(trace: any): string {
  const lines: string[] = ['stateDiagram-v2'];

  if (!trace.spans || trace.spans.length === 0) {
    lines.push('    [*] --> Empty');
    return lines.join('\n');
  }

  // Find root span
  const rootSpan = trace.spans.find((s: any) => !s.parentSpanId);
  if (rootSpan) {
    lines.push(`    [*] --> ${rootSpan.spanId}`);
  }

  // Add states
  for (const span of trace.spans) {
    const label = escapeMermaidLabel(span.name);
    lines.push(`    ${span.spanId} : ${label}`);
  }

  // Add transitions
  for (const span of trace.spans) {
    if (span.parentSpanId) {
      lines.push(`    ${span.parentSpanId} --> ${span.spanId}`);
    }
  }

  // Find leaf spans
  const hasChildren = new Set(trace.spans.map((s: any) => s.parentSpanId).filter(Boolean));
  for (const span of trace.spans) {
    if (!hasChildren.has(span.spanId)) {
      lines.push(`    ${span.spanId} --> [*]`);
    }
  }

  return lines.join('\n');
}

/**
 * Escape special characters for Mermaid labels
 */
function escapeMermaidLabel(text: string): string {
  return text
    .replace(/"/g, "'")
    .replace(/[<>]/g, '')
    .replace(/\n/g, ' ')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .substring(0, 50);
}

/**
 * Get node shape based on span name
 */
function getNodeShape(name: string): { start: string; end: string } {
  if (name.startsWith('agent.')) {
    return { start: '[', end: ']' };
  }
  if (name.startsWith('llm.')) {
    return { start: '(', end: ')' };
  }
  if (name.startsWith('tool.')) {
    return { start: '[[', end: ']]' };
  }
  return { start: '{', end: '}' };
}

/**
 * GET /api/projects - Get list of unique statement IDs (projects)
 */
app.get('/api/projects', (req: Request, res: Response) => {
  const storage = getTraceStorage();
  const traces = storage.getAll();

  const projects = [...new Set(traces.map(t => t.statementId).filter(Boolean))];
  res.json(projects);
});

/**
 * DELETE /api/traces - Clear all traces (for testing)
 */
app.delete('/api/traces', (req: Request, res: Response) => {
  const storage = getTraceStorage();
  storage.clear();
  res.json({ message: 'All traces cleared' });
});

/**
 * POST /api/seed - Seed demo traces for UI demonstration
 */
app.post('/api/seed', (req: Request, res: Response) => {
  const storage = getTraceStorage();
  storage.clear();

  const baseTime = Date.now() * 1_000_000;

  // Demo Trace 1: Login Form Implementation
  const trace1 = {
    traceId: 'trace-login-form-001',
    statementId: 'ds-20260326-001',
    deliverableType: 'code',
    startTime: baseTime,
    duration: 500_000_000,
    storedAt: baseTime,
    spans: [
      { spanId: 'span-agent-1', parentSpanId: null, name: 'agent.execute_task', kind: 0, startTime: baseTime, endTime: baseTime + 500_000_000, duration: 500_000_000, status: { code: 1 }, attributes: { 'infogen.statement_id': 'ds-20260326-001', 'infogen.agent_status': 'success' }, events: [{ name: 'task_started', time: baseTime + 1_000_000, attributes: { task: 'Build login form' } }] },
      { spanId: 'span-llm-1', parentSpanId: 'span-agent-1', name: 'llm.inference', kind: 0, startTime: baseTime + 10_000_000, endTime: baseTime + 200_000_000, duration: 190_000_000, status: { code: 1 }, attributes: { 'infogen.llm.provider': 'anthropic', 'infogen.llm.model': 'claude-3-sonnet', 'infogen.llm.input_tokens': 256, 'infogen.llm.output_tokens': 512 }, events: [] },
      { spanId: 'span-tool-1', parentSpanId: 'span-agent-1', name: 'tool.write_file', kind: 0, startTime: baseTime + 210_000_000, endTime: baseTime + 250_000_000, duration: 40_000_000, status: { code: 1 }, attributes: { 'infogen.tool.name': 'write_file', 'infogen.tool.result': 'success' }, events: [{ name: 'file_written', time: baseTime + 249_000_000, attributes: { path: 'LoginForm.tsx', size: 2048 } }] },
      { spanId: 'span-tool-2', parentSpanId: 'span-agent-1', name: 'tool.write_file', kind: 0, startTime: baseTime + 260_000_000, endTime: baseTime + 300_000_000, duration: 40_000_000, status: { code: 1 }, attributes: { 'infogen.tool.name': 'write_file', 'infogen.tool.result': 'success' }, events: [] },
      { spanId: 'span-tool-3', parentSpanId: 'span-agent-1', name: 'tool.run_test', kind: 0, startTime: baseTime + 310_000_000, endTime: baseTime + 450_000_000, duration: 140_000_000, status: { code: 1 }, attributes: { 'infogen.tool.name': 'run_test', 'infogen.tool.result': 'success' }, events: [{ name: 'test_passed', time: baseTime + 449_000_000, attributes: { passed: 5, failed: 0 } }] },
    ],
  };

  // Demo Trace 2: API Endpoint
  const trace2 = {
    traceId: 'trace-api-endpoint-002',
    statementId: 'ds-20260326-002',
    deliverableType: 'code',
    startTime: baseTime + 1_000_000_000,
    duration: 800_000_000,
    storedAt: baseTime + 1_000_000_000,
    spans: [
      { spanId: 'span-agent-2', parentSpanId: null, name: 'agent.execute_task', kind: 0, startTime: baseTime + 1_000_000_000, endTime: baseTime + 1_800_000_000, duration: 800_000_000, status: { code: 1 }, attributes: { 'infogen.statement_id': 'ds-20260326-002', 'infogen.agent_status': 'success' }, events: [] },
      { spanId: 'span-llm-2', parentSpanId: 'span-agent-2', name: 'llm.inference', kind: 0, startTime: baseTime + 1_010_000_000, endTime: baseTime + 1_300_000_000, duration: 290_000_000, status: { code: 1 }, attributes: { 'infogen.llm.provider': 'anthropic', 'infogen.llm.model': 'claude-3-sonnet', 'infogen.llm.input_tokens': 512, 'infogen.llm.output_tokens': 1024 }, events: [] },
      { spanId: 'span-llm-3', parentSpanId: 'span-agent-2', name: 'llm.inference', kind: 0, startTime: baseTime + 1_350_000_000, endTime: baseTime + 1_550_000_000, duration: 200_000_000, status: { code: 1 }, attributes: { 'infogen.llm.provider': 'anthropic', 'infogen.llm.model': 'claude-3-sonnet', 'infogen.llm.input_tokens': 256, 'infogen.llm.output_tokens': 768 }, events: [] },
      { spanId: 'span-tool-4', parentSpanId: 'span-agent-2', name: 'tool.write_file', kind: 0, startTime: baseTime + 1_560_000_000, endTime: baseTime + 1_600_000_000, duration: 40_000_000, status: { code: 1 }, attributes: { 'infogen.tool.name': 'write_file', 'infogen.tool.result': 'success' }, events: [] },
      { spanId: 'span-tool-5', parentSpanId: 'span-agent-2', name: 'tool.run_command', kind: 0, startTime: baseTime + 1_610_000_000, endTime: baseTime + 1_750_000_000, duration: 140_000_000, status: { code: 1 }, attributes: { 'infogen.tool.name': 'run_command', 'infogen.tool.result': 'success' }, events: [] },
    ],
  };

  // Demo Trace 3: Error case
  const trace3 = {
    traceId: 'trace-error-003',
    statementId: 'ds-20260326-003',
    deliverableType: 'code',
    startTime: baseTime + 3_000_000_000,
    duration: 400_000_000,
    storedAt: baseTime + 3_000_000_000,
    spans: [
      { spanId: 'span-agent-3', parentSpanId: null, name: 'agent.execute_task', kind: 0, startTime: baseTime + 3_000_000_000, endTime: baseTime + 3_400_000_000, duration: 400_000_000, status: { code: 2 }, attributes: { 'infogen.statement_id': 'ds-20260326-003', 'infogen.agent_status': 'error' }, events: [] },
      { spanId: 'span-llm-4', parentSpanId: 'span-agent-3', name: 'llm.inference', kind: 0, startTime: baseTime + 3_010_000_000, endTime: baseTime + 3_200_000_000, duration: 190_000_000, status: { code: 1 }, attributes: { 'infogen.llm.provider': 'anthropic', 'infogen.llm.model': 'claude-3-sonnet' }, events: [] },
      { spanId: 'span-tool-6', parentSpanId: 'span-agent-3', name: 'tool.run_test', kind: 0, startTime: baseTime + 3_210_000_000, endTime: baseTime + 3_350_000_000, duration: 140_000_000, status: { code: 2 }, attributes: { 'infogen.tool.name': 'run_test', 'infogen.tool.result': 'error', 'error.type': 'AssertionError', 'error.message': 'Expected true to be false' }, events: [] },
    ],
  };

  // Store traces directly in storage's internal map
  (storage as any).traces.set(trace1.traceId, trace1);
  (storage as any).traces.set(trace2.traceId, trace2);
  (storage as any).traces.set(trace3.traceId, trace3);

  res.json({
    message: 'Demo traces seeded',
    traces: [
      { id: trace1.traceId, spans: trace1.spans.length },
      { id: trace2.traceId, spans: trace2.spans.length },
      { id: trace3.traceId, spans: trace3.spans.length },
    ],
  });
});

/**
 * Start the API server
 */
export function startServer(port: number = 3001): ReturnType<typeof app.listen> {
  return app.listen(port, () => {
    console.log(`Trace API server running on http://localhost:${port}`);
  });
}

export { app };
