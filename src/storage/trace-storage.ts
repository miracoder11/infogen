import { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { CUSTOM_ATTRIBUTES } from '../tracing/attributes.js';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Stored trace data with metadata.
 */
export interface StoredTrace {
  /** Trace ID */
  traceId: string;
  /** Demo statement ID from Phase 1 */
  statementId?: string;
  /** Deliverable type */
  deliverableType?: string;
  /** All spans in this trace */
  spans: ReadableSpan[];
  /** Timestamp when trace was stored */
  storedAt: number;
  /** Trace start time */
  startTime: number;
  /** Trace duration in milliseconds */
  duration: number;
}

/**
 * Storage options for traces.
 */
export interface StorageOptions {
  /** Maximum number of traces to store in memory (default: 1000) */
  maxTraces?: number;
  /** Directory for file exports (default: './traces') */
  exportDir?: string;
}

/**
 * In-memory trace storage with file export capability.
 */
export class TraceStorage {
  private traces: Map<string, StoredTrace> = new Map();
  private readonly maxTraces: number;
  private readonly exportDir: string;

  constructor(options: StorageOptions = {}) {
    this.maxTraces = options.maxTraces ?? 1000;
    this.exportDir = options.exportDir ?? './traces';
  }

  /**
   * Store a span. Automatically groups by trace ID.
   */
  store(span: ReadableSpan): void {
    const traceId = span.spanContext().traceId;

    if (this.traces.has(traceId)) {
      // Add to existing trace
      const stored = this.traces.get(traceId)!;
      stored.spans.push(span);

      // Update duration if this span extends the trace
      const spanEndTime = span.startTime[0] * 1e9 + span.startTime[1];
      if (spanEndTime > stored.startTime + stored.duration) {
        stored.duration = spanEndTime - stored.startTime;
      }
    } else {
      // Create new trace entry
      const statementId = this.extractAttribute(span, CUSTOM_ATTRIBUTES.STATEMENT_ID);
      const deliverableType = this.extractAttribute(span, CUSTOM_ATTRIBUTES.DELIVERABLE_TYPE);

      const stored: StoredTrace = {
        traceId,
        statementId: typeof statementId === 'string' ? statementId : undefined,
        deliverableType: typeof deliverableType === 'string' ? deliverableType : undefined,
        spans: [span],
        storedAt: Date.now(),
        startTime: span.startTime[0] * 1e9 + span.startTime[1],
        duration: span.duration[0] * 1e9 + span.duration[1],
      };

      this.traces.set(traceId, stored);

      // Evict oldest if at capacity
      if (this.traces.size > this.maxTraces) {
        const oldestKey = this.traces.keys().next().value;
        if (oldestKey) {
          this.traces.delete(oldestKey);
        }
      }
    }
  }

  /**
   * Get a stored trace by ID.
   */
  get(traceId: string): StoredTrace | undefined {
    return this.traces.get(traceId);
  }

  /**
   * Get all stored traces.
   */
  getAll(): StoredTrace[] {
    return Array.from(this.traces.values());
  }

  /**
   * Get traces by statement ID.
   */
  getByStatementId(statementId: string): StoredTrace[] {
    return this.getAll().filter((t) => t.statementId === statementId);
  }

  /**
   * Clear all stored traces.
   */
  clear(): void {
    this.traces.clear();
  }

  /**
   * Export a trace to JSON file.
   */
  async exportToFile(traceId: string, filename?: string): Promise<string> {
    const trace = this.get(traceId);
    if (!trace) {
      throw new Error(`Trace not found: ${traceId}`);
    }

    // Ensure export directory exists
    if (!existsSync(this.exportDir)) {
      await mkdir(this.exportDir, { recursive: true });
    }

    // Generate filename if not provided
    const finalFilename =
      filename ||
      `${trace.statementId || 'trace'}-${traceId.substring(0, 8)}.json`;

    const filepath = join(this.exportDir, finalFilename);

    // Convert spans to serializable format
    const serializable = {
      traceId: trace.traceId,
      statementId: trace.statementId,
      deliverableType: trace.deliverableType,
      startTime: trace.startTime,
      duration: trace.duration,
      spans: trace.spans.map((span) => ({
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

    await writeFile(filepath, JSON.stringify(serializable, null, 2));

    return filepath;
  }

  /**
   * Export all traces to JSON files.
   */
  async exportAll(): Promise<string[]> {
    const filepaths: string[] = [];

    for (const traceId of this.traces.keys()) {
      const filepath = await this.exportToFile(traceId);
      filepaths.push(filepath);
    }

    return filepaths;
  }

  private extractAttribute(span: ReadableSpan, key: string): unknown {
    return span.attributes[key];
  }
}

/**
 * Global trace storage instance.
 */
let globalStorage: TraceStorage | null = null;

/**
 * Get or create the global trace storage instance.
 */
export function getTraceStorage(options?: StorageOptions): TraceStorage {
  if (!globalStorage) {
    globalStorage = new TraceStorage(options);
  }
  return globalStorage;
}

/**
 * Store a span using the global storage.
 */
export function storeTrace(span: ReadableSpan): void {
  const storage = getTraceStorage();
  storage.store(span);
}

/**
 * Export traces to file using the global storage.
 */
export async function exportTracesToFile(traceId: string, filename?: string): Promise<string> {
  const storage = getTraceStorage();
  return storage.exportToFile(traceId, filename);
}

/**
 * Clear global trace storage.
 */
export function clearTraceStorage(): void {
  const storage = getTraceStorage();
  storage.clear();
}

/**
 * Reset global storage (for testing).
 */
export function resetStorageForTesting(): void {
  globalStorage = null;
}
