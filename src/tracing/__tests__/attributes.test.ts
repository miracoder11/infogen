import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  CUSTOM_ATTRIBUTES,
  addTraceability,
  LOG_LEVELS,
  AGENT_STATUS,
  DELIVERABLE_TYPES,
} from '../attributes.js';
import { Span } from '@opentelemetry/api';

describe('tracing/attributes', () => {
  it('exports all required CUSTOM_ATTRIBUTES', () => {
    assert.ok(CUSTOM_ATTRIBUTES.STATEMENT_ID);
    assert.ok(CUSTOM_ATTRIBUTES.DELIVERABLE_TYPE);
    assert.ok(CUSTOM_ATTRIBUTES.LOG_LEVEL);
    assert.ok(CUSTOM_ATTRIBUTES.AGENT_ACTION);
    assert.ok(CUSTOM_ATTRIBUTES.AGENT_STATUS);
    assert.ok(CUSTOM_ATTRIBUTES.LLM_PROVIDER);
    assert.ok(CUSTOM_ATTRIBUTES.LLM_MODEL);
  });

  it('addTraceability adds statement_id to span', () => {
    const capturedAttrs: Record<string, string> = {};
    const mockSpan = {
      setAttributes: (attrs: Record<string, string>) => {
        Object.assign(capturedAttrs, attrs);
      },
      setAttribute: () => {},
    } as unknown as Span;

    addTraceability(mockSpan, 'ds-20260326-001');
    assert.strictEqual(capturedAttrs['infogen.statement_id'], 'ds-20260326-001');
  });

  it('addTraceability adds optional metadata', () => {
    const capturedAttrs: Record<string, string> = {};
    const mockSpan = {
      setAttributes: (attrs: Record<string, string>) => {
        Object.assign(capturedAttrs, attrs);
      },
      setAttribute: (_key: string, value: string) => {
        capturedAttrs[_key] = value;
      },
    } as unknown as Span;

    addTraceability(mockSpan, 'ds-20260326-001', {
      deliverableType: 'code/framework',
      logLevel: 'INFO',
    });

    assert.strictEqual(capturedAttrs['infogen.deliverable_type'], 'code/framework');
    assert.strictEqual(capturedAttrs['infogen.log_level'], 'INFO');
  });

  it('LOG_LEVELS matches Phase 1 values', () => {
    assert.strictEqual(LOG_LEVELS.DEBUG, 'DEBUG');
    assert.strictEqual(LOG_LEVELS.INFO, 'INFO');
    assert.strictEqual(LOG_LEVELS.WARN, 'WARN');
    assert.strictEqual(LOG_LEVELS.ERROR, 'ERROR');
    assert.strictEqual(LOG_LEVELS.PASS, 'PASS');
    assert.strictEqual(LOG_LEVELS.FAIL, 'FAIL');
  });

  it('AGENT_STATUS exports all values', () => {
    assert.strictEqual(AGENT_STATUS.RUNNING, 'running');
    assert.strictEqual(AGENT_STATUS.SUCCESS, 'success');
    assert.strictEqual(AGENT_STATUS.FAILED, 'failed');
  });

  it('DELIVERABLE_TYPES exports all four core types', () => {
    assert.strictEqual(DELIVERABLE_TYPES.CODE_FRAMEWORK, 'code/framework');
    assert.strictEqual(DELIVERABLE_TYPES.METHODOLOGY_SKILL, 'methodology/skill');
    assert.strictEqual(DELIVERABLE_TYPES.TEST_QUALITY, 'test/quality');
    assert.strictEqual(DELIVERABLE_TYPES.CHANGE_REFACTOR, 'change/refactor');
  });
});
