import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  AnnotationTimeline,
  createTimestampAnnotation,
  createTextAnnotation,
  createHighlightAnnotation,
  createArrowAnnotation,
  formatTimestamp,
  parseTimestamp,
} from '../annotations.js';

describe('AnnotationTimeline', () => {
  it('should add annotations', () => {
    const timeline = new AnnotationTimeline();
    timeline.addAnnotation(createTimestampAnnotation(1000, 'Step 1'));

    assert.strictEqual(timeline.length(), 1);
  });

  it('should add multiple annotations', () => {
    const timeline = new AnnotationTimeline();
    timeline.addAnnotations([
      createTimestampAnnotation(1000, 'Step 1'),
      createTimestampAnnotation(2000, 'Step 2'),
    ]);

    assert.strictEqual(timeline.length(), 2);
  });

  it('should sort annotations by timestamp', () => {
    const timeline = new AnnotationTimeline();
    timeline.addAnnotations([
      createTimestampAnnotation(3000, 'Step 3'),
      createTimestampAnnotation(1000, 'Step 1'),
      createTimestampAnnotation(2000, 'Step 2'),
    ]);

    const annotations = timeline.getAnnotations();
    assert.strictEqual(annotations[0].timestamp, 1000);
    assert.strictEqual(annotations[1].timestamp, 2000);
    assert.strictEqual(annotations[2].timestamp, 3000);
  });

  it('should get annotations in range', () => {
    const timeline = new AnnotationTimeline();
    timeline.addAnnotations([
      createTimestampAnnotation(1000, 'Step 1'),
      createTimestampAnnotation(2000, 'Step 2'),
      createTimestampAnnotation(3000, 'Step 3'),
      createTimestampAnnotation(4000, 'Step 4'),
    ]);

    const inRange = timeline.getAnnotationsInRange(1500, 3500);
    assert.strictEqual(inRange.length, 2);
  });

  it('should get annotations by type', () => {
    const timeline = new AnnotationTimeline();
    timeline.addAnnotations([
      createTimestampAnnotation(1000, 'Time'),
      createTextAnnotation(2000, 'Text'),
      createHighlightAnnotation(3000, 'Highlight', { x: 10, y: 10 }),
    ]);

    const timestamps = timeline.getAnnotationsByType('timestamp');
    const texts = timeline.getAnnotationsByType('text');
    const highlights = timeline.getAnnotationsByType('highlight');

    assert.strictEqual(timestamps.length, 1);
    assert.strictEqual(texts.length, 1);
    assert.strictEqual(highlights.length, 1);
  });

  it('should clear annotations', () => {
    const timeline = new AnnotationTimeline();
    timeline.addAnnotation(createTimestampAnnotation(1000, 'Step 1'));
    assert.strictEqual(timeline.length(), 1);

    timeline.clear();
    assert.strictEqual(timeline.length(), 0);
  });

  it('should serialize to JSON', () => {
    const timeline = new AnnotationTimeline();
    timeline.addAnnotation(createTimestampAnnotation(1000, 'Step 1'));

    const json = timeline.toJSON();
    const parsed = JSON.parse(json);

    assert.strictEqual(Array.isArray(parsed), true);
    assert.strictEqual(parsed.length, 1);
  });

  it('should parse from JSON', () => {
    const json = JSON.stringify([
      { timestamp: 1000, type: 'timestamp', content: 'Step 1' },
    ]);

    const timeline = AnnotationTimeline.fromJSON(json);
    assert.strictEqual(timeline.length(), 1);
  });
});

describe('Annotation helpers', () => {
  it('should create timestamp annotation', () => {
    const annotation = createTimestampAnnotation(1000, 'Step 1', 2000);

    assert.strictEqual(annotation.timestamp, 1000);
    assert.strictEqual(annotation.type, 'timestamp');
    assert.strictEqual(annotation.content, 'Step 1');
    assert.strictEqual(annotation.duration, 2000);
  });

  it('should create text annotation', () => {
    const annotation = createTextAnnotation(1000, 'Hello', { x: 10, y: 20 });

    assert.strictEqual(annotation.type, 'text');
    assert.deepStrictEqual(annotation.position, { x: 10, y: 20 });
  });

  it('should create highlight annotation', () => {
    const annotation = createHighlightAnnotation(1000, 'Important', { x: 50, y: 50 });

    assert.strictEqual(annotation.type, 'highlight');
    assert.deepStrictEqual(annotation.position, { x: 50, y: 50 });
  });

  it('should create arrow annotation', () => {
    const annotation = createArrowAnnotation(1000, 'Look here', { x: 100, y: 100 });

    assert.strictEqual(annotation.type, 'arrow');
    assert.deepStrictEqual(annotation.position, { x: 100, y: 100 });
  });
});

describe('Timestamp formatting', () => {
  it('should format timestamp as HH:MM:SS.mmm', () => {
    assert.strictEqual(formatTimestamp(0), '00:00:00.000');
    assert.strictEqual(formatTimestamp(1000), '00:00:01.000');
    assert.strictEqual(formatTimestamp(60000), '00:01:00.000');
    assert.strictEqual(formatTimestamp(3600000), '01:00:00.000');
    assert.strictEqual(formatTimestamp(3661500), '01:01:01.500');
  });

  it('should parse timestamp to milliseconds', () => {
    assert.strictEqual(parseTimestamp('00:00:00.000'), 0);
    assert.strictEqual(parseTimestamp('00:00:01.000'), 1000);
    assert.strictEqual(parseTimestamp('00:01:00.000'), 60000);
    assert.strictEqual(parseTimestamp('01:00:00.000'), 3600000);
    assert.strictEqual(parseTimestamp('01:01:01.500'), 3661500);
  });

  it('should throw on invalid format', () => {
    assert.throws(() => parseTimestamp('invalid'));
    assert.throws(() => parseTimestamp('00:00:00'));
  });
});
