import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { AutomationScript, getLocator } from '../automation.js';
import { ScriptExecutor } from '../executor.js';
import { BrowserSessionManager } from '../browser-manager.js';
import { by } from '../selectors.js';
import * as fs from 'fs';

describe('AutomationScript', () => {
  it('should build navigation action', () => {
    const script = new AutomationScript();
    script.navigate('https://example.com');

    const actions = script.getActions();
    assert.strictEqual(actions.length, 1);
    assert.strictEqual(actions[0].type, 'navigate');
    assert.strictEqual(actions[0].value, 'https://example.com');
  });

  it('should build click action', () => {
    const script = new AutomationScript();
    script.click(by.role('button', { name: 'Submit' }));

    const actions = script.getActions();
    assert.strictEqual(actions.length, 1);
    assert.strictEqual(actions[0].type, 'click');
    assert.deepStrictEqual(actions[0].selector, { role: 'button', name: 'Submit' });
  });

  it('should build fill action', () => {
    const script = new AutomationScript();
    script.fill(by.label('Email'), 'test@example.com');

    const actions = script.getActions();
    assert.strictEqual(actions.length, 1);
    assert.strictEqual(actions[0].type, 'fill');
    assert.strictEqual(actions[0].value, 'test@example.com');
  });

  it('should build wait action', () => {
    const script = new AutomationScript();
    script.wait(1000);

    const actions = script.getActions();
    assert.strictEqual(actions.length, 1);
    assert.strictEqual(actions[0].type, 'wait');
    assert.strictEqual(actions[0].value, 1000);
  });

  it('should build screenshot action', () => {
    const script = new AutomationScript();
    script.screenshot('step1.png');

    const actions = script.getActions();
    assert.strictEqual(actions.length, 1);
    assert.strictEqual(actions[0].type, 'screenshot');
    assert.strictEqual(actions[0].value, 'step1.png');
  });

  it('should build multiple actions', () => {
    const script = new AutomationScript();
    script
      .navigate('https://example.com')
      .waitForLoadState('networkidle')
      .click(by.role('button'))
      .wait(500)
      .screenshot('result.png');

    const actions = script.getActions();
    assert.strictEqual(actions.length, 5);
    assert.strictEqual(actions[0].type, 'navigate');
    assert.strictEqual(actions[1].type, 'waitForLoadState');
    assert.strictEqual(actions[2].type, 'click');
    assert.strictEqual(actions[3].type, 'wait');
    assert.strictEqual(actions[4].type, 'screenshot');
  });

  it('should clear actions', () => {
    const script = new AutomationScript();
    script.navigate('https://example.com');
    assert.strictEqual(script.length(), 1);

    script.clear();
    assert.strictEqual(script.length(), 0);
  });
});

describe('ScriptExecutor', () => {
  let manager: BrowserSessionManager;
  let executor: ScriptExecutor;
  const testOutputDir = './test-videos-executor';

  beforeEach(() => {
    manager = new BrowserSessionManager({ outputDir: testOutputDir });
    executor = new ScriptExecutor();
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

  it('should execute navigation script', async () => {
    const session = await manager.createSession();
    const script = new AutomationScript();
    script.navigate('about:blank');

    const result = await executor.execute(script, session);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.actionsCompleted, 1);

    await manager.closeSession(session.id);
  });

  it('should execute wait script', async () => {
    const session = await manager.createSession();
    const script = new AutomationScript();
    script.navigate('about:blank').wait(50);

    const result = await executor.execute(script, session);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.actionsCompleted, 2);

    await manager.closeSession(session.id);
  });

  it('should handle script errors', async () => {
    const session = await manager.createSession();
    const script = new AutomationScript();
    // Click on non-existent element
    script.click(by.testId('non-existent'));

    const result = await executor.execute(script, session);

    assert.strictEqual(result.success, false);
    assert.ok(result.error);

    await manager.closeSession(session.id);
  });

  it('should take screenshot during execution', async () => {
    const session = await manager.createSession();
    const script = new AutomationScript();
    script.navigate('about:blank').screenshot('test.png');

    const result = await executor.execute(script, session);

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.screenshots.length, 1);

    await manager.closeSession(session.id);
  });
});
