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

// Semantic Selectors
export type {
  RoleSelector,
  TextSelector,
  TestIdSelector,
  LabelSelector,
  PlaceholderSelector,
  CssSelector,
  SemanticSelector,
} from './selectors.js';

export {
  isRoleSelector,
  isTextSelector,
  isTestIdSelector,
  isLabelSelector,
  isPlaceholderSelector,
  isCssSelector,
  by,
  toPlaywrightOptions,
} from './selectors.js';

// Automation Script
export type { ActionType, AutomationAction, ExecutionResult } from './automation.js';
export { AutomationScript, getLocator } from './automation.js';

// Script Executor
export { ScriptExecutor } from './executor.js';

// Annotations
export { AnnotationTimeline, createTimestampAnnotation, createTextAnnotation, createHighlightAnnotation, createArrowAnnotation, formatTimestamp, parseTimestamp } from './annotations.js';

// Metadata
export type { VideoMetadata } from './metadata.js';
export { createVideoMetadata, saveMetadata, loadMetadata, findMetadataFile, hasMetadata, deleteMetadata } from './metadata.js';

// Post-Processor
export type { ProcessOptions, TransitionOptions } from './post-processor.js';
export { VideoPostProcessor, FFmpegNotFoundError, isFFmpegAvailable } from './post-processor.js';

// Pipeline
export type { PipelineConfig, PipelineResult, ProgressCallback } from './pipeline.js';
export { VideoPipeline } from './pipeline.js';
