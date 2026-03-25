import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { initializeTracing, isTracingInitialized, shutdownTracing, resetSDKForTesting } from '../instrumentation.js';

describe('tracing/instrumentation', () => {
  beforeEach(async () => {
    resetSDKForTesting();
  });

  afterEach(async () => {
    try {
      await shutdownTracing();
    } catch {
      // Ignore shutdown errors in cleanup
    }
    resetSDKForTesting();
  });

  it('should initialize SDK instance', async () => {
    const sdk = await initializeTracing();
    assert.ok(sdk, 'SDK should be initialized');
  });

  it('should use environment variables for config', async () => {
    process.env.OTEL_SERVICE_NAME = 'test-service';
    process.env.OTEL_SERVICE_VERSION = '2.0.0';
    resetSDKForTesting();

    const sdk = await initializeTracing();
    assert.ok(sdk, 'SDK should initialize with env vars');

    delete process.env.OTEL_SERVICE_NAME;
    delete process.env.OTEL_SERVICE_VERSION;
  });

  it('should return true for isTracingInitialized after initialization', async () => {
    resetSDKForTesting();
    await initializeTracing();
    assert.strictEqual(isTracingInitialized(), true);
  });

  it('should return false for isTracingInitialized before initialization', () => {
    resetSDKForTesting();
    assert.strictEqual(isTracingInitialized(), false);
  });

  it('should shut down SDK cleanly', async () => {
    resetSDKForTesting();
    await initializeTracing();
    await shutdownTracing();
    assert.strictEqual(isTracingInitialized(), false);
  });

  it('should warn when shutting down uninitialized SDK', async () => {
    resetSDKForTesting();
    // Should not throw
    await shutdownTracing();
    assert.strictEqual(isTracingInitialized(), false);
  });

  it('should return existing SDK when initialized twice', async () => {
    resetSDKForTesting();
    const sdk1 = await initializeTracing();
    const sdk2 = await initializeTracing();
    assert.strictEqual(sdk1, sdk2, 'Should return same SDK instance');
  });
});
