// Video Capture Module
// Browser automation and video recording infrastructure

// Types
export type {
  VideoConfig,
  VideoResult,
  BrowserSession,
  SessionState,
  SessionInfo,
  AnnotationType,
  VideoAnnotation,
} from './types.js';

// Configuration
export {
  DEFAULT_VIDEO_CONFIG,
  QUALITY_PRESETS,
  VIDEO_FILENAME_PATTERN,
  generateVideoId,
  generateVideoFilename,
  createVideoConfig,
} from './config.js';

// Browser Session Management
export { BrowserSessionManager } from './browser-manager.js';

// Video Recording
export { VideoRecorder } from './recorder.js';
