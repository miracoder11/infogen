/**
 * Video Capture Types
 * Type definitions for video recording infrastructure
 */

/**
 * Video recording configuration
 */
export interface VideoConfig {
  /** Output width in pixels */
  width: number;
  /** Output height in pixels */
  height: number;
  /** Frames per second */
  fps: number;
  /** Output directory for video files */
  outputDir: string;
  /** Video format (default: mp4) */
  format: 'mp4' | 'webm';
  /** Video codec (default: libx264) */
  codec: string;
  /** Quality preset (default: medium) */
  quality: 'low' | 'medium' | 'high';
}

/**
 * Result of a video recording session
 */
export interface VideoResult {
  /** Unique identifier for this recording */
  id: string;
  /** Path to the recorded video file */
  filePath: string;
  /** Duration in milliseconds */
  duration: number;
  /** File size in bytes */
  size: number;
  /** Resolution of the video */
  resolution: {
    width: number;
    height: number;
  };
  /** Timestamp when recording started */
  startedAt: string;
  /** Timestamp when recording ended */
  endedAt: string;
}

/**
 * Browser session for recording
 */
export interface BrowserSession {
  /** Unique session identifier */
  id: string;
  /** Playwright browser instance */
  browser: import('playwright').Browser;
  /** Playwright browser context */
  context: import('playwright').BrowserContext;
  /** Playwright page */
  page: import('playwright').Page;
  /** Video recording configuration */
  config: VideoConfig;
  /** Recording start time */
  startTime: number;
}

/**
 * Session state
 */
export type SessionState = 'idle' | 'recording' | 'processing' | 'completed' | 'error';

/**
 * Session info for monitoring
 */
export interface SessionInfo {
  id: string;
  state: SessionState;
  startTime: number;
  config: VideoConfig;
}

/**
 * Video annotation types
 */
export type AnnotationType = 'timestamp' | 'text' | 'highlight' | 'arrow';

/**
 * Video annotation for overlay
 */
export interface VideoAnnotation {
  /** Timestamp in milliseconds from video start */
  timestamp: number;
  /** Type of annotation */
  type: AnnotationType;
  /** Annotation content/text */
  content: string;
  /** Duration to display annotation (ms) */
  duration?: number;
  /** Position on screen */
  position?: {
    x: number;
    y: number;
  };
}
