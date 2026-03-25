import { describe, it } from 'node:test';
import assert from 'node:assert';
import { withAgentSpan, withLLMSpan, withToolSpan, createChildSpan } from '../span-helpers.js';

describe('tracing/span-helpers', () => {
  it('withAgentSpan function is exported and callable', async () => {
    // Verify function signature exists
    assert.strictEqual(typeof withAgentSpan, 'function');
    assert.strictEqual(withAgentSpan.length, 3); // statementId, actionName, fn
  });

  it('withLLMSpan function is exported and callable', async () => {
    // Verify function signature exists
    assert.strictEqual(typeof withLLMSpan, 'function');
    assert.strictEqual(withLLMSpan.length, 3); // provider, model, fn
  });

  it('withToolSpan function is exported and callable', async () => {
    // Verify function signature exists
    assert.strictEqual(typeof withToolSpan, 'function');
    assert.strictEqual(withToolSpan.length, 3); // toolName, args, fn
  });

  it('createChildSpan function is exported and callable', () => {
    // Verify function signature exists
    assert.strictEqual(typeof createChildSpan, 'function');
    assert.strictEqual(createChildSpan.length, 2); // name, attributes
  });

  it('withAgentSpan returns a promise', async () => {
    // Just verify it returns a promise without executing
    const result = withAgentSpan('ds-test-001', 'test', async () => 'result');
    assert.ok(result instanceof Promise);
    // Consume the promise to avoid unhandled rejection
    await result.catch(() => {});
  });

  it('withLLMSpan returns a promise', async () => {
    const result = withLLMSpan('test-provider', 'test-model', async () => 'result');
    assert.ok(result instanceof Promise);
    await result.catch(() => {});
  });

  it('withToolSpan returns a promise', async () => {
    const result = withToolSpan('test-tool', { arg: 'value' }, async () => 'result');
    assert.ok(result instanceof Promise);
    await result.catch(() => {});
  });

  it('createChildSpan returns a span object', async () => {
    // Note: This may return a no-op span if SDK not initialized
    const span = createChildSpan('test-span');
    assert.ok(span, 'createChildSpan should return a span object');
    assert.ok(typeof span.end === 'function', 'Span should have end method');
    assert.ok(typeof span.setAttribute === 'function', 'Span should have setAttribute method');
    assert.ok(typeof span.addEvent === 'function', 'Span should have addEvent method');
    span.end();
  });
});
