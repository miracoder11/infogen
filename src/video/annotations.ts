import type { VideoAnnotation, AnnotationType } from './types.js';

/**
 * Annotation timeline for managing video annotations
 */
export class AnnotationTimeline {
  private annotations: VideoAnnotation[] = [];

  /**
   * Add an annotation to the timeline
   */
  addAnnotation(annotation: VideoAnnotation): void {
    this.annotations.push(annotation);
    this.sortAnnotations();
  }

  /**
   * Add multiple annotations
   */
  addAnnotations(annotations: VideoAnnotation[]): void {
    this.annotations.push(...annotations);
    this.sortAnnotations();
  }

  /**
   * Get all annotations sorted by timestamp
   */
  getAnnotations(): VideoAnnotation[] {
    return [...this.annotations];
  }

  /**
   * Get annotations within a time range
   */
  getAnnotationsInRange(startMs: number, endMs: number): VideoAnnotation[] {
    return this.annotations.filter(
      a => a.timestamp >= startMs && a.timestamp <= endMs
    );
  }

  /**
   * Get annotations by type
   */
  getAnnotationsByType(type: AnnotationType): VideoAnnotation[] {
    return this.annotations.filter(a => a.type === type);
  }

  /**
   * Clear all annotations
   */
  clear(): void {
    this.annotations = [];
  }

  /**
   * Get annotation count
   */
  length(): number {
    return this.annotations.length;
  }

  /**
   * Serialize to JSON
   */
  toJSON(): string {
    return JSON.stringify(this.annotations, null, 2);
  }

  /**
   * Parse from JSON
   */
  static fromJSON(json: string): AnnotationTimeline {
    const timeline = new AnnotationTimeline();
    const annotations = JSON.parse(json) as VideoAnnotation[];
    timeline.addAnnotations(annotations);
    return timeline;
  }

  /**
   * Sort annotations by timestamp
   */
  private sortAnnotations(): void {
    this.annotations.sort((a, b) => a.timestamp - b.timestamp);
  }
}

/**
 * Create a timestamp annotation
 */
export function createTimestampAnnotation(
  timestamp: number,
  content: string,
  duration?: number
): VideoAnnotation {
  return {
    timestamp,
    type: 'timestamp',
    content,
    duration,
  };
}

/**
 * Create a text annotation
 */
export function createTextAnnotation(
  timestamp: number,
  content: string,
  position?: { x: number; y: number },
  duration?: number
): VideoAnnotation {
  return {
    timestamp,
    type: 'text',
    content,
    position,
    duration,
  };
}

/**
 * Create a highlight annotation
 */
export function createHighlightAnnotation(
  timestamp: number,
  content: string,
  position: { x: number; y: number },
  duration?: number
): VideoAnnotation {
  return {
    timestamp,
    type: 'highlight',
    content,
    position,
    duration,
  };
}

/**
 * Create an arrow annotation
 */
export function createArrowAnnotation(
  timestamp: number,
  content: string,
  position: { x: number; y: number },
  duration?: number
): VideoAnnotation {
  return {
    timestamp,
    type: 'arrow',
    content,
    position,
    duration,
  };
}

/**
 * Format timestamp as HH:MM:SS.mmm
 */
export function formatTimestamp(ms: number): string {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor(ms % 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds
    .toString()
    .padStart(3, '0')}`;
}

/**
 * Parse HH:MM:SS.mmm to milliseconds
 */
export function parseTimestamp(timestamp: string): number {
  const match = timestamp.match(/^(\d+):(\d+):(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Invalid timestamp format: ${timestamp}`);
  }

  const [, hours, minutes, seconds, milliseconds] = match;
  return (
    parseInt(hours, 10) * 3600000 +
    parseInt(minutes, 10) * 60000 +
    parseInt(seconds, 10) * 1000 +
    parseInt(milliseconds, 10)
  );
}
