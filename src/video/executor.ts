import type { BrowserSession } from './types.js';
import { AutomationScript, AutomationAction, ExecutionResult, getLocator } from './automation.js';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Executes automation scripts against browser sessions
 */
export class ScriptExecutor {
  private session: BrowserSession | null = null;
  private screenshots: string[] = [];

  /**
   * Set the browser session for execution
   */
  setSession(session: BrowserSession): void {
    this.session = session;
    this.screenshots = [];
  }

  /**
   * Execute an automation script
   */
  async execute(script: AutomationScript, session: BrowserSession): Promise<ExecutionResult> {
    this.setSession(session);
    const startTime = Date.now();
    let actionsCompleted = 0;

    try {
      const actions = script.getActions();

      for (const action of actions) {
        await this.executeAction(action);
        actionsCompleted++;
      }

      return {
        success: true,
        actionsCompleted,
        duration: Date.now() - startTime,
        screenshots: this.screenshots,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        actionsCompleted,
        duration: Date.now() - startTime,
        error: message,
        screenshots: this.screenshots,
      };
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: AutomationAction): Promise<void> {
    if (!this.session) {
      throw new Error('No browser session set');
    }

    const page = this.session.page;

    switch (action.type) {
      case 'navigate':
        await page.goto(action.value as string, action.options);
        break;

      case 'click':
        await getLocator(page, action.selector!).click(action.options);
        break;

      case 'dblclick':
        await getLocator(page, action.selector!).dblclick(action.options);
        break;

      case 'type':
        await page.keyboard.type(action.value as string, action.options);
        break;

      case 'fill':
        await getLocator(page, action.selector!).fill(action.value as string, action.options);
        break;

      case 'press':
        await page.keyboard.press(action.value as string);
        break;

      case 'wait':
        await page.waitForTimeout(action.value as number);
        break;

      case 'waitForSelector':
        await getLocator(page, action.selector!).waitFor(action.options);
        break;

      case 'waitForLoadState':
        await page.waitForLoadState(action.value as 'load' | 'domcontentloaded' | 'networkidle');
        break;

      case 'screenshot':
        await this.takeScreenshot(action.value as string, action.options);
        break;

      case 'scroll':
        await getLocator(page, action.selector!).scrollIntoViewIfNeeded();
        break;

      case 'hover':
        await getLocator(page, action.selector!).hover(action.options);
        break;

      case 'focus':
        await getLocator(page, action.selector!).focus();
        break;

      case 'selectOption':
        await getLocator(page, action.selector!).selectOption(action.value as string | string[]);
        break;

      case 'check':
        await getLocator(page, action.selector!).check();
        break;

      case 'uncheck':
        await getLocator(page, action.selector!).uncheck();
        break;

      default:
        throw new Error(`Unknown action type: ${(action as AutomationAction).type}`);
    }
  }

  /**
   * Take a screenshot and save it
   */
  private async takeScreenshot(
    filename: string,
    options?: { fullPage?: boolean }
  ): Promise<void> {
    if (!this.session) {
      throw new Error('No browser session set');
    }

    const outputDir = path.join(this.session.config.outputDir, 'screenshots');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const screenshotPath = path.join(outputDir, filename);
    await this.session.page.screenshot({
      path: screenshotPath,
      fullPage: options?.fullPage ?? false,
    });

    this.screenshots.push(screenshotPath);
  }

  /**
   * Get screenshots taken during execution
   */
  getScreenshots(): string[] {
    return [...this.screenshots];
  }
}
