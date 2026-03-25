import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { TraceStorage, getTraceStorage, resetStorageForTesting, clearTraceStorage } from '../trace-storage.js';
import { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { CUSTOM_ATTRIBUTES } from '../../tracing/attributes.js';
import { rmSync, existsSync } from 'fs';

describe('storage/trace-storage', () => {
  let storage: TraceStorage;

  beforeEach(() => {
    resetStorageForTesting();
    storage = new TraceStorage({ maxTraces: 10, exportDir: './test-traces' });
  });

  afterEach(() => {
    storage.clear();
    // Clean up test traces directory
    if (existsSync('./test-traces')) {
      rmSync('./test-traces', { recursive: true, force: true });
    }
  });

  const createMockSpan = (traceId: string, name: string, statementId?: string): ReadableSpan => {
    return {
      name,
      spanContext: () => ({ traceId, spanId: '12345678', traceFlags: 1 }),
      startTime: [1000, 0] as [number, number],
      endTime: [1001, 0] as [number, number],
      duration: [1, 0] as [number, number],
      attributes: {
        [CUSTOM_ATTRIBUTES.STATEMENT_ID]: statementId || `ds-${traceId.substring(0, 8)}-001`,
      },
      status: { code: 0 },
      kind: 1,
      events: [],
      links: [],
      resource: { attributes: {} },
      instrumentationLibrary: { name: 'test', version: '1.0.0' },
    } as unknown as ReadableSpan;
  };

  it('stores spans grouped by traceId', () => {
    const span1 = createMockSpan('trace1', 'span1');
    const span2 = createMockSpan('trace1', 'span2');

    storage.store(span1);
    storage.store(span2);

    const trace = storage.get('trace1');
    assert.ok(trace);
    assert.strictEqual(trace.spans.length, 2);
  });

  it('get retrieves stored trace', () => {
    const span = createMockSpan('trace1', 'span1');
    storage.store(span);

    const trace = storage.get('trace1');
    assert.ok(trace);
    assert.strictEqual(trace.traceId, 'trace1');
  });

  it('get returns undefined for unknown traceId', () => {
    const trace = storage.get('unknown');
    assert.strictEqual(trace, undefined);
  });

  it('getByStatementId finds traces by statement_id', () => {
    const span = createMockSpan('trace1', 'span1', 'ds-20260326-001');
    storage.store(span);

    const traces = storage.getByStatementId('ds-20260326-001');
    assert.strictEqual(traces.length, 1);
    assert.strictEqual(traces[0].statementId, 'ds-20260326-001');
  });

  it('clear removes all traces', () => {
    const span = createMockSpan('trace1', 'span1');
    storage.store(span);

    storage.clear();

    assert.strictEqual(storage.getAll().length, 0);
  });

  it('getAll returns all stored traces', () => {
    const span1 = createMockSpan('trace1', 'span1');
    const span2 = createMockSpan('trace2', 'span2');
    storage.store(span1);
    storage.store(span2);

    const all = storage.getAll();
    assert.strictEqual(all.length, 2);
  });

  it('evicts oldest trace when at capacity', () => {
    const smallStorage = new TraceStorage({ maxTraces: 2 });

    smallStorage.store(createMockSpan('trace1', 'span1'));
    smallStorage.store(createMockSpan('trace2', 'span2'));
    smallStorage.store(createMockSpan('trace3', 'span3'));

    assert.strictEqual(smallStorage.getAll().length, 2);
    assert.strictEqual(smallStorage.get('trace1'), undefined);
  });

  it('exportToFile writes JSON to traces directory', async () => {
    const span = createMockSpan('trace1', 'span1');
    storage.store(span);

    const filepath = await storage.exportToFile('trace1', 'test-trace.json');
    assert.ok(filepath.includes('test-trace.json'));
    assert.ok(existsSync(filepath));
  });

  it('getTraceStorage returns global singleton', () => {
    resetStorageForTesting();
    const storage1 = getTraceStorage();
    const storage2 = getTraceStorage();
    assert.strictEqual(storage1, storage2);
  });

  it('clearTraceStorage clears global storage', () => {
    resetStorageForTesting();
    const globalStorage = getTraceStorage();
    globalStorage.store(createMockSpan('global1', 'span1'));

    clearTraceStorage();

    assert.strictEqual(globalStorage.getAll().length, 0);
  });
});
