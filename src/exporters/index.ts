/**
 * InfoGen Exporters Module
 *
 * Trace exporters for various backends and development.
 */

// OTLP exporter (production)
export {
  createTraceExporter,
  createSpanProcessor,
  createBatchSpanProcessor,
  createSimpleSpanProcessor,
  type OTLPExporterConfig,
} from './otlp-exporter.js';

// Console exporter (development)
export {
  createConsoleExporter,
  type ConsoleExporterConfig,
} from './console-exporter.js';
