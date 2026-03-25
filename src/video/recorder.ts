import type { BrowserSession, VideoResult, VideoAnnotation } from './types.js';
import { generateVideoFilename } from './config.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Video recorder for capturing browser sessions
 */
export class VideoRecorder {
  private session: BrowserSession | null = null;
  private annotations: VideoAnnotation[] = [];
  private startTime: number = 0;
  private isRecording: boolean = false;

  /**
   * Start recording for a browser session
   */
  async startRecording(session: BrowserSession): Promise<void> {
    this.session = session;
    this.startTime = Date.now();
    this.annotations = [];
    this.isRecording = true;
  }

  /**
   * Add annotation at current timestamp
   */
  async addAnnotation(text: string, type: VideoAnnotation['type'] = 'text'): Promise<void> {
    if (!this.isRecording || !this.session) {
      throw new Error('Not recording');
    }

    const timestamp = Date.now() - this.startTime;
    this.annotations.push({
      timestamp,
      type,
      content: text,
    });
  }

  /**
   * Add annotation with custom options
   */
  addCustomAnnotation(annotation: VideoAnnotation): void {
    if (!this.isRecording) {
      throw new Error('Not recording');
    }
    this.annotations.push(annotation);
  }

  /**
   * Get current recording duration in milliseconds
   */
  getDuration(): number {
    if (!this.isRecording) {
      return 0;
    }
    return Date.now() - this.startTime;
  }

  /**
   * Get all annotations
   */
  getAnnotations(): VideoAnnotation[] {
    return [...this.annotations];
  }

  /**
   * Stop recording and return video result
   */
  async stopRecording(): Promise<VideoResult> {
    if (!this.session) {
      throw new Error('No active session');
    }

    this.isRecording = false;
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    // The video is finalized when the context is closed
    // Get the video file path from Playwright
    const video = this.session.page.video();
    let videoPath: string | null = null;

    if (video) {
      videoPath = await video.path();
    }

    if (!videoPath || !fs.existsSync(videoPath)) {
      throw new Error('Video file not found');
    }

    // Get file stats
    const stats = fs.statSync(videoPath);

    const result: VideoResult = {
      id: this.session.id,
      filePath: videoPath,
      duration,
      size: stats.size,
      resolution: {
        width: this.session.config.width,
        height: this.session.config.height,
      },
      startedAt: new Date(this.startTime).toISOString(),
      endedAt: new Date(endTime).toISOString(),
    };

    return result;
  }

  /**
   * Check if currently recording
   */
  isActive(): boolean {
    return this.isRecording;
  }

  /**
   * Clear annotations
   */
  clearAnnotations(): void {
    this.annotations = [];
  }
}
