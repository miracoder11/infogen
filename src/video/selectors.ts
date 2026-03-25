/**
 * Semantic Selector Types
 * Type definitions for reliable, maintainable browser automation
 */

/**
 * Selector by ARIA role
 */
export interface RoleSelector {
  role: string;
  name?: string | RegExp;
}

/**
 * Selector by text content
 */
export interface TextSelector {
  text: string | RegExp;
  exact?: boolean;
}

/**
 * Selector by test ID (data-testid attribute)
 */
export interface TestIdSelector {
  testId: string;
}

/**
 * Selector by label text
 */
export interface LabelSelector {
  label: string | RegExp;
}

/**
 * Selector by placeholder text
 */
export interface PlaceholderSelector {
  placeholder: string | RegExp;
}

/**
 * Selector by CSS selector
 */
export interface CssSelector {
  css: string;
}

/**
 * Union type for all semantic selectors
 */
export type SemanticSelector =
  | RoleSelector
  | TextSelector
  | TestIdSelector
  | LabelSelector
  | PlaceholderSelector
  | CssSelector;

/**
 * Type guard for role selector
 */
export function isRoleSelector(selector: SemanticSelector): selector is RoleSelector {
  return 'role' in selector;
}

/**
 * Type guard for text selector
 */
export function isTextSelector(selector: SemanticSelector): selector is TextSelector {
  return 'text' in selector && !('role' in selector);
}

/**
 * Type guard for test ID selector
 */
export function isTestIdSelector(selector: SemanticSelector): selector is TestIdSelector {
  return 'testId' in selector;
}

/**
 * Type guard for label selector
 */
export function isLabelSelector(selector: SemanticSelector): selector is LabelSelector {
  return 'label' in selector;
}

/**
 * Type guard for placeholder selector
 */
export function isPlaceholderSelector(selector: SemanticSelector): selector is PlaceholderSelector {
  return 'placeholder' in selector;
}

/**
 * Type guard for CSS selector
 */
export function isCssSelector(selector: SemanticSelector): selector is CssSelector {
  return 'css' in selector;
}

/**
 * Selector builder for creating semantic selectors
 */
export const by = {
  /**
   * Select by ARIA role
   * @example by.role('button', { name: 'Submit' })
   */
  role(role: string, options?: { name?: string | RegExp }): RoleSelector {
    return { role, ...options };
  },

  /**
   * Select by text content
   * @example by.text('Hello World')
   */
  text(text: string | RegExp, exact?: boolean): TextSelector {
    return { text, exact };
  },

  /**
   * Select by test ID
   * @example by.testId('submit-button')
   */
  testId(testId: string): TestIdSelector {
    return { testId };
  },

  /**
   * Select by label text
   * @example by.label('Email')
   */
  label(label: string | RegExp): LabelSelector {
    return { label };
  },

  /**
   * Select by placeholder text
   * @example by.placeholder('Enter your email')
   */
  placeholder(placeholder: string | RegExp): PlaceholderSelector {
    return { placeholder };
  },

  /**
   * Select by CSS selector
   * @example by.css('.submit-button')
   */
  css(css: string): CssSelector {
    return { css };
  },
};

/**
 * Convert semantic selector to Playwright locator options
 */
export function toPlaywrightOptions(selector: SemanticSelector): {
  type: string;
  value: string | RegExp;
  options?: Record<string, unknown>;
} {
  if (isRoleSelector(selector)) {
    return {
      type: 'role',
      value: selector.role,
      options: selector.name ? { name: selector.name } : undefined,
    };
  }

  if (isTextSelector(selector)) {
    return {
      type: 'text',
      value: selector.text,
      options: selector.exact !== undefined ? { exact: selector.exact } : undefined,
    };
  }

  if (isTestIdSelector(selector)) {
    return {
      type: 'testId',
      value: selector.testId,
    };
  }

  if (isLabelSelector(selector)) {
    return {
      type: 'label',
      value: selector.label,
    };
  }

  if (isPlaceholderSelector(selector)) {
    return {
      type: 'placeholder',
      value: selector.placeholder,
    };
  }

  if (isCssSelector(selector)) {
    return {
      type: 'css',
      value: selector.css,
    };
  }

  throw new Error(`Unknown selector type: ${JSON.stringify(selector)}`);
}
