import { SpanExporter } from '@opentelemetry/sdk-trace-base';
import { ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { ExportResult, ExportResultCode } from '@opentelemetry/core';

/**
 * Configuration for console exporter.
 */
export interface ConsoleExporterConfig {
  /** Include timestamp in output (default: true) */
  includeTimestamp?: boolean;
  /** Include trace and span IDs (default: true) */
  includeIds?: boolean;
  /** Indentation level for JSON output (default: 2) */
  indent?: number;
}

/**
 * Create a console exporter for development/debugging.
 *
 * Outputs traces to console in a readable format.
 * Useful for local development without a collector.
 *
 * @example
 * ```ts
 * const exporter = createConsoleExporter({ indent: 2 });
 * const processor = new SimpleSpanProcessor(exporter);
 * ```
 */
export function createConsoleExporter(
  config: ConsoleExporterConfig = {}
): SpanExporter {
  const { includeTimestamp = true, includeIds = true, indent = 2 } = config;

  return new FormattedConsoleExporter({
    includeTimestamp,
    includeIds,
    indent,
  });
}

/**
 * Custom console exporter with formatted output.
 */
class FormattedConsoleExporter implements SpanExporter {
  private readonly config: Required<ConsoleExporterConfig>;

  constructor(config: ConsoleExporterConfig) {
    this.config = {
      includeTimestamp: config.includeTimestamp ?? true,
      includeIds: config.includeIds ?? true,
      indent: config.indent ?? 2,
    };
  }

  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    for (const span of spans) {
      const formatted = this.formatSpan(span);
      console.log(formatted);
    }
    resultCallback({ code: ExportResultCode.SUCCESS });
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }

  private formatSpan(span: ReadableSpan): string {
    const { includeTimestamp, includeIds, indent } = this.config;

    const output: Record<string, unknown> = {
      name: span.name,
      kind: span.kind,
      status: span.status,
    };

    if (includeTimestamp) {
      output.startTime = span.startTime;
      output.endTime = span.endTime;
      output.duration = `${span.duration[0]}.${span.duration[1].toString().padStart(9, '0')}ms`;
    }

    if (includeIds) {
      output.traceId = span.spanContext().traceId.substring(0, 8);
      output.spanId = span.spanContext().spanId.substring(0, 8);
    }

    if (span.attributes && Object.keys(span.attributes).length > 0) {
      output.attributes = this.sanitizeAttributes(span.attributes);
    }

    if (span.events && span.events.length > 0) {
      output.events = span.events.map((e: { name: string; time: unknown; attributes?: Record<string, unknown> }) => ({
        name: e.name,
        time: e.time,
        attributes: this.sanitizeAttributes(e.attributes || {}),
      }));
    }

    return JSON.stringify(output, null, indent);
  }

  private sanitizeAttributes(attributes: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(attributes)) {
      // Truncate long string values (e.g., prompts, responses)
      if (typeof value === 'string' && value.length > 200) {
        sanitized[key] = value.substring(0, 200) + '... (truncated)';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
