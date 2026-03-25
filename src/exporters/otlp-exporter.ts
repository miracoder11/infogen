import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { BatchSpanProcessor, SimpleSpanProcessor, SpanProcessor } from '@opentelemetry/sdk-trace-base';

/**
 * OTLP trace exporter configuration.
 */
interface OTLPTraceExporterConfig {
  url?: string;
  timeoutMillis?: number;
  headers?: Record<string, string>;
}

/**
 * Configuration options for OTLP trace exporter.
 */
export interface OTLPExporterConfig {
  /** OTLP traces endpoint URL */
  url?: string;
  /** Authentication token (Bearer token) */
  authToken?: string;
  /** Request timeout in milliseconds (default: 10000) */
  timeoutMillis?: number;
  /** Use batch processor (default: true) */
  useBatch?: boolean;
  /** Batch processor options */
  batchOptions?: {
    /** Maximum queue size (default: 2048) */
    maxQueueSize?: number;
    /** Maximum batch size (default: 512) */
    maxExportBatchSize?: number;
    /** Scheduled export delay in ms (default: 5000) */
    scheduledDelayMillis?: number;
    /** Export timeout in ms (default: 30000) */
    exportTimeoutMillis?: number;
  };
}

/**
 * Create an OTLP trace exporter with standard configuration.
 *
 * Reads from environment variables by default:
 * - OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
 * - OTEL_AUTH_TOKEN
 * - OTEL_EXPORTER_OTLP_TIMEOUT
 *
 * @example
 * ```ts
 * const exporter = createTraceExporter({
 *   url: 'https://otel-collector.example.com:4318/v1/traces',
 *   authToken: 'my-token',
 * });
 * ```
 */
export function createTraceExporter(config: OTLPExporterConfig = {}): OTLPTraceExporter {
  const {
    url = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
    authToken = process.env.OTEL_AUTH_TOKEN,
    timeoutMillis = parseInt(process.env.OTEL_EXPORTER_OTLP_TIMEOUT || '10000', 10),
  } = config;

  const exporterConfig: OTLPTraceExporterConfig = {
    url,
    timeoutMillis,
  };

  // Add auth header if token provided
  if (authToken) {
    exporterConfig.headers = {
      Authorization: `Bearer ${authToken}`,
    };
  }

  return new OTLPTraceExporter(exporterConfig);
}

/**
 * Create a span processor for the OTLP exporter.
 *
 * By default, uses BatchSpanProcessor for production efficiency.
 * Set useBatch: false for SimpleSpanProcessor (immediate export, useful for debugging).
 *
 * @example
 * ```ts
 * const exporter = createTraceExporter();
 * const processor = createBatchSpanProcessor(exporter);
 * sdk.addSpanProcessor(processor);
 * ```
 */
export function createSpanProcessor(
  config: OTLPExporterConfig = {}
): SpanProcessor {
  const exporter = createTraceExporter(config);
  const { useBatch = true, batchOptions } = config;

  if (useBatch) {
    const {
      maxQueueSize = 2048,
      maxExportBatchSize = 512,
      scheduledDelayMillis = 5000,
      exportTimeoutMillis = 30000,
    } = batchOptions || {};

    return new BatchSpanProcessor(exporter, {
      maxQueueSize,
      maxExportBatchSize,
      scheduledDelayMillis,
      exportTimeoutMillis,
    });
  }

  // SimpleSpanProcessor exports immediately (synchronous)
  return new SimpleSpanProcessor(exporter);
}

/**
 * Create a BatchSpanProcessor (alias for createSpanProcessor with useBatch: true).
 */
export function createBatchSpanProcessor(
  config?: OTLPExporterConfig
): SpanProcessor {
  return createSpanProcessor({ ...config, useBatch: true });
}

/**
 * Create a SimpleSpanProcessor (immediate export, no batching).
 */
export function createSimpleSpanProcessor(
  config?: OTLPExporterConfig
): SpanProcessor {
  return createSpanProcessor({ ...config, useBatch: false });
}
