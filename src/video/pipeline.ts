import type { VideoConfig, VideoAnnotation, BrowserSession } from './types.js';
import { BrowserSessionManager } from './browser-manager.js';
import { VideoRecorder } from './recorder.js';
import { AutomationScript } from './automation.js';
import { ScriptExecutor } from './executor.js';
import { VideoPostProcessor } from './post-processor.js';
import { AnnotationTimeline, createTimestampAnnotation } from './annotations.js';
import { createVideoMetadata, saveMetadata, VideoMetadata } from './metadata.js';
import { createVideoConfig } from './config.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  /** Browser session config */
  videoConfig?: Partial<VideoConfig>;
  /** Automation script to execute */
  script: AutomationScript;
  /** Pre-defined annotations */
  annotations?: VideoAnnotation[];
  /** Add automatic timestamps */
  autoTimestamps?: boolean;
  /** Fade in duration (seconds) */
  fadeIn?: number;
  /** Fade out duration (seconds) */
  fadeOut?: number;
  /** Output filename (without extension) */
  outputFilename?: string;
  /** Associated trace ID */
  traceId?: string;
  /** Associated statement ID */
  statementId?: string;
}

/**
 * Pipeline result
 */
export interface PipelineResult {
  /** Success status */
  success: boolean;
  /** Path to final video file */
  videoPath: string | null;
  /** Path to metadata file */
  metadataPath: string | null;
  /** Video metadata */
  metadata: VideoMetadata | null;
  /** Total pipeline duration */
  duration: number;
  /** Error message if failed */
  error?: string;
}

/**
 * Progress callback type
 */
export type ProgressCallback = (stage: string, progress: number) => void;

/**
 * Video processing pipeline
 * Orchestrates: record -> annotate -> post-process -> metadata
 */
export class VideoPipeline {
  private manager: BrowserSessionManager;
  private recorder: VideoRecorder;
  private executor: ScriptExecutor;
  private postProcessor: VideoPostProcessor;
  private progressCallbacks: ProgressCallback[] = [];

  constructor(config?: Partial<VideoConfig>) {
    this.manager = new BrowserSessionManager(config);
    this.recorder = new VideoRecorder();
    this.executor = new ScriptExecutor();
    this.postProcessor = new VideoPostProcessor();
  }

  /**
   * Register progress callback
   */
  onProgress(callback: ProgressCallback): void {
    this.progressCallbacks.push(callback);
  }

  /**
   * Emit progress to all callbacks
   */
  private emitProgress(stage: string, progress: number): void {
    for (const cb of this.progressCallbacks) {
      cb(stage, progress);
    }
  }

  /**
   * Run the full video capture pipeline
   */
  async run(config: PipelineConfig): Promise<PipelineResult> {
    const startTime = Date.now();
    let session: BrowserSession | null = null;

    try {
      // Stage 1: Create browser session
      this.emitProgress('session', 0);
      session = await this.manager.createSession(config.videoConfig);
      this.emitProgress('session', 100);

      // Stage 2: Start recording
      this.emitProgress('recording', 0);
      await this.recorder.startRecording(session);

      // Add pre-defined annotations
      if (config.annotations) {
        for (const annotation of config.annotations) {
          this.recorder.addCustomAnnotation(annotation);
        }
      }

      // Stage 3: Execute automation script
      this.emitProgress('automation', 0);
      const result = await this.executor.execute(config.script, session);

      if (!result.success) {
        throw new Error(`Automation failed: ${result.error}`);
      }
      this.emitProgress('automation', 100);

      // Add final timestamp if enabled
      if (config.autoTimestamps) {
        const duration = this.recorder.getDuration();
        this.recorder.addCustomAnnotation(
          createTimestampAnnotation(duration, 'Completed')
        );
      }

      // Stage 4: Stop recording
      this.emitProgress('recording', 100);
      const videoResult = await this.recorder.stopRecording();

      // Stage 5: Post-processing (transitions)
      this.emitProgress('processing', 0);
      let finalVideoPath = videoResult.filePath;

      if (config.fadeIn || config.fadeOut) {
        const processedPath = finalVideoPath.replace('.mp4', '.processed.mp4');
        await this.postProcessor.addTransitions(finalVideoPath, processedPath, {
          fadeIn: config.fadeIn,
          fadeOut: config.fadeOut,
        });
        finalVideoPath = processedPath;
      }
      this.emitProgress('processing', 100);

      // Stage 6: Create and save metadata
      this.emitProgress('metadata', 0);
      const metadata = createVideoMetadata({
        filename: path.basename(finalVideoPath),
        duration: videoResult.duration,
        resolution: videoResult.resolution,
        recordedAt: videoResult.startedAt,
        traceId: config.traceId,
        statementId: config.statementId,
        annotations: this.recorder.getAnnotations(),
      });

      const metadataPath = saveMetadata(metadata, finalVideoPath);
      this.emitProgress('metadata', 100);

      // Close session
      await this.manager.closeSession(session.id);

      return {
        success: true,
        videoPath: finalVideoPath,
        metadataPath,
        metadata,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      // Cleanup on error
      if (session) {
        try {
          await this.manager.closeSession(session.id);
        } catch {
          // Ignore cleanup errors
        }
      }

      const message = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        videoPath: null,
        metadataPath: null,
        metadata: null,
        duration: Date.now() - startTime,
        error: message,
      };
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.manager.cleanup();
  }
}
