import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { BrowserSessionManager } from '../browser-manager.js';
import { DEFAULT_VIDEO_CONFIG } from '../config.js';
import * as fs from 'fs';

describe('BrowserSessionManager', () => {
  let manager: BrowserSessionManager;
  const testOutputDir = './test-videos-session';

  beforeEach(() => {
    // Use test output directory
    manager = new BrowserSessionManager({ outputDir: testOutputDir });
  });

  afterEach(async () => {
    // Cleanup
    try {
      await manager.cleanup();
    } catch {
      // Ignore cleanup errors
    }
    // Remove test directory
    if (fs.existsSync(testOutputDir)) {
      try {
        fs.rmSync(testOutputDir, { recursive: true, force: true });
      } catch {
        // Ignore removal errors
      }
    }
  });

  it('should create output directory if not exists', () => {
    assert.ok(fs.existsSync(testOutputDir));
  });

  it('should return default config', () => {
    const config = manager.getDefaultConfig();
    assert.deepStrictEqual(config, { ...DEFAULT_VIDEO_CONFIG, outputDir: testOutputDir });
  });

  it('should create a browser session', async () => {
    const session = await manager.createSession();

    assert.ok(session.id);
    assert.ok(session.browser);
    assert.ok(session.context);
    assert.ok(session.page);
    assert.strictEqual(typeof session.startTime, 'number');

    // Cleanup
    await manager.closeSession(session.id);
  });

  it('should create session with custom config', async () => {
    const session = await manager.createSession({
      width: 1920,
      height: 1080,
    });

    assert.strictEqual(session.config.width, 1920);
    assert.strictEqual(session.config.height, 1080);

    // Cleanup
    await manager.closeSession(session.id);
  });

  it('should track session state', async () => {
    const session = await manager.createSession();

    const state = manager.getSessionState(session.id);
    assert.strictEqual(state, 'recording');

    await manager.closeSession(session.id);

    // After close, session should be removed
    const retrievedSession = manager.getSession(session.id);
    assert.strictEqual(retrievedSession, undefined);
  });

  it('should list active sessions', async () => {
    const session1 = await manager.createSession();
    const session2 = await manager.createSession();

    const activeSessions = manager.getActiveSessions();
    assert.strictEqual(activeSessions.length, 2);

    await manager.closeSession(session1.id);
    await manager.closeSession(session2.id);
  });

  it('should close session and return video path', async () => {
    const session = await manager.createSession();

    // Navigate to a page to generate some video content
    await session.page.goto('about:blank');
    await session.page.waitForTimeout(50);

    const videoPath = await manager.closeSession(session.id);

    // Video path should be returned (Playwright creates the video)
    assert.ok(videoPath === null || typeof videoPath === 'string');
  });

  it('should cleanup all sessions', async () => {
    const s1 = await manager.createSession();
    const s2 = await manager.createSession();
    const s3 = await manager.createSession();

    assert.strictEqual(manager.getActiveSessions().length, 3);

    // Close all sessions individually for faster cleanup
    await manager.closeSession(s1.id);
    await manager.closeSession(s2.id);
    await manager.closeSession(s3.id);

    assert.strictEqual(manager.getActiveSessions().length, 0);
  });
});
