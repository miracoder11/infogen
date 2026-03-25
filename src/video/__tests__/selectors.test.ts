import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  by,
  isRoleSelector,
  isTextSelector,
  isTestIdSelector,
  isLabelSelector,
  isPlaceholderSelector,
  isCssSelector,
  toPlaywrightOptions,
} from '../selectors.js';

describe('Semantic Selectors', () => {
  describe('by builder', () => {
    it('should create role selector', () => {
      const selector = by.role('button', { name: 'Submit' });
      assert.strictEqual(selector.role, 'button');
      assert.strictEqual(selector.name, 'Submit');
    });

    it('should create text selector', () => {
      const selector = by.text('Hello World');
      assert.strictEqual(selector.text, 'Hello World');
      assert.strictEqual(selector.exact, undefined);
    });

    it('should create text selector with exact', () => {
      const selector = by.text('Hello World', true);
      assert.strictEqual(selector.text, 'Hello World');
      assert.strictEqual(selector.exact, true);
    });

    it('should create testId selector', () => {
      const selector = by.testId('submit-btn');
      assert.strictEqual(selector.testId, 'submit-btn');
    });

    it('should create label selector', () => {
      const selector = by.label('Email');
      assert.strictEqual(selector.label, 'Email');
    });

    it('should create placeholder selector', () => {
      const selector = by.placeholder('Enter email');
      assert.strictEqual(selector.placeholder, 'Enter email');
    });

    it('should create css selector', () => {
      const selector = by.css('.submit-btn');
      assert.strictEqual(selector.css, '.submit-btn');
    });
  });

  describe('type guards', () => {
    it('should identify role selector', () => {
      assert.ok(isRoleSelector(by.role('button')));
      assert.ok(!isRoleSelector(by.text('test')));
    });

    it('should identify text selector', () => {
      assert.ok(isTextSelector(by.text('test')));
      assert.ok(!isTextSelector(by.role('button')));
    });

    it('should identify testId selector', () => {
      assert.ok(isTestIdSelector(by.testId('test')));
      assert.ok(!isTestIdSelector(by.text('test')));
    });

    it('should identify label selector', () => {
      assert.ok(isLabelSelector(by.label('test')));
      assert.ok(!isLabelSelector(by.testId('test')));
    });

    it('should identify placeholder selector', () => {
      assert.ok(isPlaceholderSelector(by.placeholder('test')));
      assert.ok(!isPlaceholderSelector(by.label('test')));
    });

    it('should identify css selector', () => {
      assert.ok(isCssSelector(by.css('.test')));
      assert.ok(!isCssSelector(by.placeholder('test')));
    });
  });

  describe('toPlaywrightOptions', () => {
    it('should convert role selector', () => {
      const options = toPlaywrightOptions(by.role('button', { name: 'Submit' }));
      assert.strictEqual(options.type, 'role');
      assert.strictEqual(options.value, 'button');
      assert.deepStrictEqual(options.options, { name: 'Submit' });
    });

    it('should convert text selector', () => {
      const options = toPlaywrightOptions(by.text('Hello', true));
      assert.strictEqual(options.type, 'text');
      assert.strictEqual(options.value, 'Hello');
      assert.deepStrictEqual(options.options, { exact: true });
    });

    it('should convert testId selector', () => {
      const options = toPlaywrightOptions(by.testId('btn'));
      assert.strictEqual(options.type, 'testId');
      assert.strictEqual(options.value, 'btn');
    });

    it('should convert label selector', () => {
      const options = toPlaywrightOptions(by.label('Email'));
      assert.strictEqual(options.type, 'label');
      assert.strictEqual(options.value, 'Email');
    });

    it('should convert placeholder selector', () => {
      const options = toPlaywrightOptions(by.placeholder('Enter text'));
      assert.strictEqual(options.type, 'placeholder');
      assert.strictEqual(options.value, 'Enter text');
    });

    it('should convert css selector', () => {
      const options = toPlaywrightOptions(by.css('.btn'));
      assert.strictEqual(options.type, 'css');
      assert.strictEqual(options.value, '.btn');
    });
  });
});
