import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  DEFAULT_VIDEO_CONFIG,
  QUALITY_PRESETS,
  generateVideoId,
  generateVideoFilename,
  createVideoConfig,
} from '../config.js';

describe('Video Config', () => {
  describe('DEFAULT_VIDEO_CONFIG', () => {
    it('should have default values', () => {
      assert.strictEqual(DEFAULT_VIDEO_CONFIG.width, 1280);
      assert.strictEqual(DEFAULT_VIDEO_CONFIG.height, 720);
      assert.strictEqual(DEFAULT_VIDEO_CONFIG.fps, 30);
      assert.strictEqual(DEFAULT_VIDEO_CONFIG.format, 'mp4');
      assert.strictEqual(DEFAULT_VIDEO_CONFIG.codec, 'libx264');
      assert.strictEqual(DEFAULT_VIDEO_CONFIG.quality, 'medium');
    });

    it('should have output directory', () => {
      assert.ok(DEFAULT_VIDEO_CONFIG.outputDir);
    });
  });

  describe('QUALITY_PRESETS', () => {
    it('should have low, medium, and high presets', () => {
      assert.ok(QUALITY_PRESETS.low);
      assert.ok(QUALITY_PRESETS.medium);
      assert.ok(QUALITY_PRESETS.high);
    });

    it('should have crf and preset for each quality', () => {
      for (const preset of Object.values(QUALITY_PRESETS)) {
        assert.ok(typeof preset.crf === 'number');
        assert.ok(typeof preset.preset === 'string');
      }
    });
  });

  describe('generateVideoId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateVideoId();
      const id2 = generateVideoId();
      assert.notStrictEqual(id1, id2);
    });

    it('should generate alphanumeric IDs', () => {
      const id = generateVideoId();
      assert.ok(/^[a-z0-9-]+$/.test(id));
    });
  });

  describe('generateVideoFilename', () => {
    it('should generate filename with id and timestamp', () => {
      const id = 'test123';
      const filename = generateVideoFilename(id);
      assert.ok(filename.startsWith('video-test123-'));
      assert.ok(filename.endsWith('.mp4'));
    });
  });

  describe('createVideoConfig', () => {
    it('should return default config when no overrides', () => {
      const config = createVideoConfig();
      assert.deepStrictEqual(config, DEFAULT_VIDEO_CONFIG);
    });

    it('should merge overrides with defaults', () => {
      const config = createVideoConfig({ width: 1920, height: 1080 });
      assert.strictEqual(config.width, 1920);
      assert.strictEqual(config.height, 1080);
      assert.strictEqual(config.fps, DEFAULT_VIDEO_CONFIG.fps);
    });
  });
});
