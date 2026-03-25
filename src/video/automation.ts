import type { Page, Locator } from 'playwright';
import type { SemanticSelector } from './selectors.js';
import { toPlaywrightOptions, isTestIdSelector, isCssSelector } from './selectors.js';
import type { BrowserSession } from './types.js';

/**
 * Automation action types
 */
export type ActionType =
  | 'navigate'
  | 'click'
  | 'dblclick'
  | 'type'
  | 'fill'
  | 'press'
  | 'wait'
  | 'waitForSelector'
  | 'waitForLoadState'
  | 'screenshot'
  | 'scroll'
  | 'hover'
  | 'focus'
  | 'selectOption'
  | 'check'
  | 'uncheck';

/**
 * Base action interface
 */
export interface AutomationAction {
  type: ActionType;
  selector?: SemanticSelector;
  value?: string | number | string[];
  options?: Record<string, unknown>;
}

/**
 * Result of script execution
 */
export interface ExecutionResult {
  success: boolean;
  actionsCompleted: number;
  duration: number;
  error?: string;
  screenshots: string[];
}

/**
 * Automation script builder for recording browser interactions
 */
export class AutomationScript {
  private actions: AutomationAction[] = [];

  /**
   * Navigate to URL
   */
  navigate(url: string, options?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }): this {
    this.actions.push({
      type: 'navigate',
      value: url,
      options,
    });
    return this;
  }

  /**
   * Click on element
   */
  click(selector: SemanticSelector, options?: { timeout?: number; force?: boolean }): this {
    this.actions.push({
      type: 'click',
      selector,
      options,
    });
    return this;
  }

  /**
   * Double click on element
   */
  dblclick(selector: SemanticSelector, options?: { timeout?: number }): this {
    this.actions.push({
      type: 'dblclick',
      selector,
      options,
    });
    return this;
  }

  /**
   * Type text into focused element
   */
  type(text: string, options?: { delay?: number }): this {
    this.actions.push({
      type: 'type',
      value: text,
      options,
    });
    return this;
  }

  /**
   * Fill form field with text
   */
  fill(selector: SemanticSelector, value: string, options?: { timeout?: number }): this {
    this.actions.push({
      type: 'fill',
      selector,
      value,
      options,
    });
    return this;
  }

  /**
   * Press a key
   */
  press(key: string): this {
    this.actions.push({
      type: 'press',
      value: key,
    });
    return this;
  }

  /**
   * Wait for specified milliseconds
   */
  wait(ms: number): this {
    this.actions.push({
      type: 'wait',
      value: ms,
    });
    return this;
  }

  /**
   * Wait for selector to appear
   */
  waitForSelector(selector: SemanticSelector, options?: { timeout?: number; state?: 'visible' | 'hidden' | 'attached' }): this {
    this.actions.push({
      type: 'waitForSelector',
      selector,
      options,
    });
    return this;
  }

  /**
   * Wait for page load state
   */
  waitForLoadState(state: 'load' | 'domcontentloaded' | 'networkidle' = 'load'): this {
    this.actions.push({
      type: 'waitForLoadState',
      value: state,
    });
    return this;
  }

  /**
   * Take screenshot
   */
  screenshot(filename: string, options?: { fullPage?: boolean }): this {
    this.actions.push({
      type: 'screenshot',
      value: filename,
      options,
    });
    return this;
  }

  /**
   * Scroll element into view
   */
  scroll(selector: SemanticSelector): this {
    this.actions.push({
      type: 'scroll',
      selector,
    });
    return this;
  }

  /**
   * Hover over element
   */
  hover(selector: SemanticSelector, options?: { timeout?: number }): this {
    this.actions.push({
      type: 'hover',
      selector,
      options,
    });
    return this;
  }

  /**
   * Focus element
   */
  focus(selector: SemanticSelector): this {
    this.actions.push({
      type: 'focus',
      selector,
    });
    return this;
  }

  /**
   * Select option in dropdown
   */
  selectOption(selector: SemanticSelector, value: string | string[]): this {
    this.actions.push({
      type: 'selectOption',
      selector,
      value,
    });
    return this;
  }

  /**
   * Check checkbox or radio
   */
  check(selector: SemanticSelector): this {
    this.actions.push({
      type: 'check',
      selector,
    });
    return this;
  }

  /**
   * Uncheck checkbox
   */
  uncheck(selector: SemanticSelector): this {
    this.actions.push({
      type: 'uncheck',
      selector,
    });
    return this;
  }

  /**
   * Get all actions
   */
  getActions(): AutomationAction[] {
    return [...this.actions];
  }

  /**
   * Clear all actions
   */
  clear(): this {
    this.actions = [];
    return this;
  }

  /**
   * Get action count
   */
  length(): number {
    return this.actions.length;
  }
}

/**
 * Get Playwright locator from semantic selector
 */
export function getLocator(page: Page, selector: SemanticSelector): Locator {
  const options = toPlaywrightOptions(selector);

  switch (options.type) {
    case 'role':
      // Cast to any to allow dynamic role strings
      return page.getByRole(options.value as any, options.options as any);
    case 'text':
      return page.getByText(options.value as string | RegExp, options.options as any);
    case 'testId':
      return page.getByTestId(options.value as string);
    case 'label':
      return page.getByLabel(options.value as string | RegExp);
    case 'placeholder':
      return page.getByPlaceholder(options.value as string | RegExp);
    case 'css':
      return page.locator(options.value as string);
    default:
      throw new Error(`Unknown selector type: ${(options as any).type}`);
  }
}
