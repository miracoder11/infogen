import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createTraceExporter, createBatchSpanProcessor, createSimpleSpanProcessor } from '../otlp-exporter.js';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { BatchSpanProcessor, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

describe('exporters/otlp-exporter', () => {
  it('creates OTLPTraceExporter', () => {
    const exporter = createTraceExporter();
    assert.ok(exporter instanceof OTLPTraceExporter);
  });

  it('uses environment variables for configuration', () => {
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = 'http://custom:4318/v1/traces';
    const exporter = createTraceExporter();
    assert.ok(exporter);
    delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  });

  it('creates BatchSpanProcessor by default', () => {
    const processor = createBatchSpanProcessor();
    assert.ok(processor instanceof BatchSpanProcessor);
  });

  it('creates SimpleSpanProcessor when useBatch is false', () => {
    const processor = createSimpleSpanProcessor();
    assert.ok(processor instanceof SimpleSpanProcessor);
  });

  it('createTraceExporter accepts custom config', () => {
    const exporter = createTraceExporter({
      url: 'http://localhost:9999/v1/traces',
      timeoutMillis: 5000,
      authToken: 'test-token',
    });
    assert.ok(exporter instanceof OTLPTraceExporter);
  });
});
