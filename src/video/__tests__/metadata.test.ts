import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  createVideoMetadata,
  saveMetadata,
  loadMetadata,
  findMetadataFile,
  hasMetadata,
  deleteMetadata,
} from '../metadata.js';
import * as fs from 'fs';
import * as path from 'path';

describe('Video Metadata', () => {
  const testDir = './test-metadata';

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should create video metadata', () => {
    const metadata = createVideoMetadata({
      filename: 'test.mp4',
      duration: 5000,
      resolution: { width: 1280, height: 720 },
    });

    assert.ok(metadata.id);
    assert.strictEqual(metadata.filename, 'test.mp4');
    assert.strictEqual(metadata.duration, 5000);
    assert.deepStrictEqual(metadata.resolution, { width: 1280, height: 720 });
    assert.ok(metadata.recordedAt);
    assert.strictEqual(metadata.annotations.length, 0);
  });

  it('should create metadata with all options', () => {
    const metadata = createVideoMetadata({
      filename: 'test.mp4',
      duration: 5000,
      resolution: { width: 1280, height: 720 },
      recordedAt: '2026-03-26T00:00:00.000Z',
      traceId: 'trace-123',
      statementId: 'stmt-456',
      annotations: [{ timestamp: 1000, type: 'text', content: 'Test' }],
      extra: { custom: 'value' },
    });

    assert.strictEqual(metadata.recordedAt, '2026-03-26T00:00:00.000Z');
    assert.strictEqual(metadata.traceId, 'trace-123');
    assert.strictEqual(metadata.statementId, 'stmt-456');
    assert.strictEqual(metadata.annotations.length, 1);
    assert.deepStrictEqual(metadata.extra, { custom: 'value' });
  });

  it('should save metadata to sidecar file', () => {
    const videoPath = path.join(testDir, 'test.mp4');
    fs.writeFileSync(videoPath, '');

    const metadata = createVideoMetadata({
      filename: 'test.mp4',
      duration: 5000,
      resolution: { width: 1280, height: 720 },
    });

    const metadataPath = saveMetadata(metadata, videoPath);

    assert.strictEqual(metadataPath, path.join(testDir, 'test.metadata.json'));
    assert.ok(fs.existsSync(metadataPath));
  });

  it('should load metadata from sidecar file', () => {
    const videoPath = path.join(testDir, 'test.mp4');
    fs.writeFileSync(videoPath, '');

    const metadata = createVideoMetadata({
      filename: 'test.mp4',
      duration: 5000,
      resolution: { width: 1280, height: 720 },
      traceId: 'trace-123',
    });

    saveMetadata(metadata, videoPath);

    const loaded = loadMetadata(videoPath);

    assert.ok(loaded);
    assert.strictEqual(loaded.traceId, 'trace-123');
    assert.strictEqual(loaded.duration, 5000);
  });

  it('should return null when metadata not found', () => {
    const videoPath = path.join(testDir, 'no-metadata.mp4');
    fs.writeFileSync(videoPath, '');

    const loaded = loadMetadata(videoPath);

    assert.strictEqual(loaded, null);
  });

  it('should find metadata file', () => {
    const videoPath = path.join(testDir, 'test.mp4');
    fs.writeFileSync(videoPath, '');

    const metadata = createVideoMetadata({
      filename: 'test.mp4',
      duration: 5000,
      resolution: { width: 1280, height: 720 },
    });

    saveMetadata(metadata, videoPath);

    const found = findMetadataFile(videoPath);
    assert.ok(found);
    assert.ok(found.endsWith('test.metadata.json'));
  });

  it('should check if metadata exists', () => {
    const videoPath = path.join(testDir, 'test.mp4');
    fs.writeFileSync(videoPath, '');

    assert.strictEqual(hasMetadata(videoPath), false);

    const metadata = createVideoMetadata({
      filename: 'test.mp4',
      duration: 5000,
      resolution: { width: 1280, height: 720 },
    });

    saveMetadata(metadata, videoPath);

    assert.strictEqual(hasMetadata(videoPath), true);
  });

  it('should delete metadata', () => {
    const videoPath = path.join(testDir, 'test.mp4');
    fs.writeFileSync(videoPath, '');

    const metadata = createVideoMetadata({
      filename: 'test.mp4',
      duration: 5000,
      resolution: { width: 1280, height: 720 },
    });

    saveMetadata(metadata, videoPath);
    assert.strictEqual(hasMetadata(videoPath), true);

    const deleted = deleteMetadata(videoPath);
    assert.strictEqual(deleted, true);
    assert.strictEqual(hasMetadata(videoPath), false);
  });

  it('should return false when deleting non-existent metadata', () => {
    const videoPath = path.join(testDir, 'no-meta.mp4');
    fs.writeFileSync(videoPath, '');

    const deleted = deleteMetadata(videoPath);
    assert.strictEqual(deleted, false);
  });
});
