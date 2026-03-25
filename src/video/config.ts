import type { VideoConfig } from './types.js';

/**
 * Default video recording configuration
 */
export const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  width: 1280,
  height: 720,
  fps: 30,
  outputDir: './videos',
  format: 'mp4',
  codec: 'libx264',
  quality: 'medium',
};

/**
 * Quality presets for video encoding
 */
export const QUALITY_PRESETS = {
  low: {
    crf: 28,
    preset: 'faster',
  },
  medium: {
    crf: 23,
    preset: 'medium',
  },
  high: {
    crf: 18,
    preset: 'slow',
  },
} as const;

/**
 * Video file naming pattern
 */
export const VIDEO_FILENAME_PATTERN = 'video-{id}-{timestamp}.mp4';

/**
 * Generate unique video ID
 */
export function generateVideoId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `${timestamp}-${random}`;
}

/**
 * Generate video filename
 */
export function generateVideoFilename(id: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return VIDEO_FILENAME_PATTERN
    .replace('{id}', id)
    .replace('{timestamp}', timestamp);
}

/**
 * Merge user config with defaults
 */
export function createVideoConfig(overrides?: Partial<VideoConfig>): VideoConfig {
  return {
    ...DEFAULT_VIDEO_CONFIG,
    ...overrides,
  };
}
