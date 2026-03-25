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
    spans: trace.spans.map(span => ({
      spanId: span.spanContext().spanId,
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
    })),
  };

  res.json(serialized);
});

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
 * Start the API server
 */
export function startServer(port: number = 3001): ReturnType<typeof app.listen> {
  return app.listen(port, () => {
    console.log(`Trace API server running on http://localhost:${port}`);
  });
}

export { app };
