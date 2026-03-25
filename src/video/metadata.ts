import type { VideoAnnotation } from './types.js';
import { generateVideoId } from './config.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Video metadata structure
 */
export interface VideoMetadata {
  /** Unique identifier */
  id: string;
  /** Video filename */
  filename: string;
  /** Duration in milliseconds */
  duration: number;
  /** Video resolution */
  resolution: {
    width: number;
    height: number;
  };
  /** ISO timestamp when recording started */
  recordedAt: string;
  /** Associated trace ID for observability */
  traceId?: string;
  /** Associated statement ID */
  statementId?: string;
  /** All annotations in the video */
  annotations: VideoAnnotation[];
  /** Additional metadata */
  extra?: Record<string, unknown>;
}

/**
 * Create video metadata
 */
export function createVideoMetadata(options: {
  filename: string;
  duration: number;
  resolution: { width: number; height: number };
  recordedAt?: string;
  traceId?: string;
  statementId?: string;
  annotations?: VideoAnnotation[];
  extra?: Record<string, unknown>;
}): VideoMetadata {
  return {
    id: generateVideoId(),
    filename: options.filename,
    duration: options.duration,
    resolution: options.resolution,
    recordedAt: options.recordedAt ?? new Date().toISOString(),
    traceId: options.traceId,
    statementId: options.statementId,
    annotations: options.annotations ?? [],
    extra: options.extra,
  };
}

/**
 * Save metadata to JSON sidecar file
 */
export function saveMetadata(
  metadata: VideoMetadata,
  videoPath: string
): string {
  const metadataPath = videoPath.replace(/\.[^.]+$/, '.metadata.json');
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  return metadataPath;
}

/**
 * Load metadata from sidecar file
 */
export function loadMetadata(videoPath: string): VideoMetadata | null {
  const metadataPath = videoPath.replace(/\.[^.]+$/, '.metadata.json');
  if (!fs.existsSync(metadataPath)) {
    return null;
  }
  const content = fs.readFileSync(metadataPath, 'utf-8');
  return JSON.parse(content) as VideoMetadata;
}

/**
 * Find metadata file for video
 */
export function findMetadataFile(videoPath: string): string | null {
  const metadataPath = videoPath.replace(/\.[^.]+$/, '.metadata.json');
  return fs.existsSync(metadataPath) ? metadataPath : null;
}

/**
 * Check if metadata exists for video
 */
export function hasMetadata(videoPath: string): boolean {
  return findMetadataFile(videoPath) !== null;
}

/**
 * Delete metadata file
 */
export function deleteMetadata(videoPath: string): boolean {
  const metadataPath = findMetadataFile(videoPath);
  if (metadataPath) {
    fs.unlinkSync(metadataPath);
    return true;
  }
  return false;
}
