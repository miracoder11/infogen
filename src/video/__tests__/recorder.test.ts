import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { VideoRecorder } from '../recorder.js';
import { BrowserSessionManager } from '../browser-manager.js';
import * as fs from 'fs';

describe('VideoRecorder', () => {
  let manager: BrowserSessionManager;
  let recorder: VideoRecorder;
  const testOutputDir = './test-videos-recorder';

  beforeEach(() => {
    manager = new BrowserSessionManager({ outputDir: testOutputDir });
    recorder = new VideoRecorder();
  });

  afterEach(async () => {
    try {
      await manager.cleanup();
    } catch {
      // Ignore cleanup errors
    }
    if (fs.existsSync(testOutputDir)) {
      try {
        fs.rmSync(testOutputDir, { recursive: true, force: true });
      } catch {
        // Ignore removal errors
      }
    }
  });

  it('should not be active initially', () => {
    assert.strictEqual(recorder.isActive(), false);
  });

  it('should throw when adding annotation without recording', () => {
    assert.throws(() => {
      recorder.addCustomAnnotation({
        timestamp: 0,
        type: 'text',
        content: 'Test',
      });
    }, /Not recording/);
  });

  it('should start recording with session', async () => {
    const session = await manager.createSession();
    await recorder.startRecording(session);

    assert.strictEqual(recorder.isActive(), true);

    await manager.closeSession(session.id);
  });

  it('should track duration while recording', async () => {
    const session = await manager.createSession();
    await recorder.startRecording(session);

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 50));

    const duration = recorder.getDuration();
    assert.ok(duration >= 50);

    await manager.closeSession(session.id);
  });

  it('should add annotations', async () => {
    const session = await manager.createSession();
    await recorder.startRecording(session);

    await recorder.addAnnotation('Test annotation');
    await recorder.addAnnotation('Timestamp annotation', 'timestamp');

    const annotations = recorder.getAnnotations();
    assert.strictEqual(annotations.length, 2);
    assert.strictEqual(annotations[0].content, 'Test annotation');
    assert.strictEqual(annotations[0].type, 'text');
    assert.strictEqual(annotations[1].type, 'timestamp');

    await manager.closeSession(session.id);
  });

  it('should add custom annotations', async () => {
    const session = await manager.createSession();
    await recorder.startRecording(session);

    recorder.addCustomAnnotation({
      timestamp: 1000,
      type: 'highlight',
      content: 'Highlighted text',
      duration: 2000,
    });

    const annotations = recorder.getAnnotations();
    assert.strictEqual(annotations.length, 1);
    assert.strictEqual(annotations[0].type, 'highlight');
    assert.strictEqual(annotations[0].duration, 2000);

    await manager.closeSession(session.id);
  });

  it('should clear annotations', async () => {
    const session = await manager.createSession();
    await recorder.startRecording(session);

    await recorder.addAnnotation('Test');
    assert.strictEqual(recorder.getAnnotations().length, 1);

    recorder.clearAnnotations();
    assert.strictEqual(recorder.getAnnotations().length, 0);

    await manager.closeSession(session.id);
  });

  it('should stop recording and return result', async () => {
    const session = await manager.createSession();
    await recorder.startRecording(session);

    // Navigate to generate content
    await session.page.goto('about:blank');
    await session.page.waitForTimeout(30);

    await recorder.addAnnotation('Final annotation');

    const result = await recorder.stopRecording();

    assert.ok(result.id);
    assert.ok(result.filePath);
    assert.ok(result.duration >= 0);
    assert.strictEqual(result.resolution.width, session.config.width);
    assert.strictEqual(result.resolution.height, session.config.height);
    assert.ok(result.startedAt);
    assert.ok(result.endedAt);

    // Close the session
    await manager.closeSession(session.id);
  });
});
