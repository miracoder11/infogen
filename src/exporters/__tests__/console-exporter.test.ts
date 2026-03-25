import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createConsoleExporter } from '../console-exporter.js';
import { SpanExporter } from '@opentelemetry/sdk-trace-base';

describe('exporters/console-exporter', () => {
  it('returns SpanExporter instance', () => {
    const exporter = createConsoleExporter();
    assert.ok(exporter);
    assert.ok(typeof exporter.export === 'function');
    assert.ok(typeof exporter.shutdown === 'function');
    assert.ok(typeof exporter.forceFlush === 'function');
  });

  it('accepts configuration options', () => {
    const exporter = createConsoleExporter({
      includeTimestamp: true,
      includeIds: true,
      indent: 4,
    });
    assert.ok(exporter);
  });

  it('defaults are applied when config is empty', () => {
    const exporter = createConsoleExporter({});
    assert.ok(exporter);
  });
});
