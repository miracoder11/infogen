import type { VideoAnnotation } from './types.js';
import { formatTimestamp } from './annotations.js';
import ffmpegStatic from 'ffmpeg-static';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

/**
 * Video processing options
 */
export interface ProcessOptions {
  /** Output codec (default: libx264) */
  codec?: string;
  /** CRF quality (default: 23) */
  crf?: number;
  /** Encoding preset (default: medium) */
  preset?: string;
  /** Output format (default: mp4) */
  format?: string;
}

/**
 * Transition options
 */
export interface TransitionOptions {
  /** Fade in duration in seconds */
  fadeIn?: number;
  /** Fade out duration in seconds */
  fadeOut?: number;
}

/**
 * FFmpeg not available error
 */
export class FFmpegNotFoundError extends Error {
  constructor() {
    super('FFmpeg not found. Please install ffmpeg-static or ensure ffmpeg is in PATH.');
    this.name = 'FFmpegNotFoundError';
  }
}

/**
 * Get FFmpeg path
 */
function getFFmpegPath(): string | null {
  // Use ffmpeg-static if available
  if (ffmpegStatic) {
    // ffmpeg-static exports the path as default
    return (ffmpegStatic as unknown as { default?: string }).default ?? (ffmpegStatic as unknown as string);
  }
  return null;
}

/**
 * Check if FFmpeg is available
 */
export async function isFFmpegAvailable(): Promise<boolean> {
  const ffmpegPath = getFFmpegPath();
  if (!ffmpegPath) {
    return false;
  }
  try {
    await execAsync(`"${ffmpegPath}" -version`);
    return true;
  } catch {
    return false;
  }
}

/**
 * Video post-processor using FFmpeg
 */
export class VideoPostProcessor {
  private ffmpegPath: string | null;

  constructor() {
    this.ffmpegPath = getFFmpegPath();
  }

  /**
   * Process video with options
   */
  async process(
    input: string,
    output: string,
    options: ProcessOptions = {}
  ): Promise<void> {
    if (!this.ffmpegPath) {
      throw new FFmpegNotFoundError();
    }

    if (!fs.existsSync(input)) {
      throw new Error(`Input file not found: ${input}`);
    }

    const codec = options.codec ?? 'libx264';
    const crf = options.crf ?? 23;
    const preset = options.preset ?? 'medium';

    const cmd = `"${this.ffmpegPath}" -y -i "${input}" -c:v ${codec} -crf ${crf} -preset ${preset} "${output}"`;

    try {
      await execAsync(cmd);
    } catch (error) {
      throw new Error(`FFmpeg processing failed: ${(error as Error).message}`);
    }
  }

  /**
   * Add fade transitions
   */
  async addTransitions(
    input: string,
    output: string,
    options: TransitionOptions = {}
  ): Promise<void> {
    if (!this.ffmpegPath) {
      throw new FFmpegNotFoundError();
    }

    if (!fs.existsSync(input)) {
      throw new Error(`Input file not found: ${input}`);
    }

    const fadeIn = options.fadeIn ?? 0;
    const fadeOut = options.fadeOut ?? 0;

    // Build filter complex for transitions
    const filters: string[] = [];

    if (fadeIn > 0) {
      filters.push(`fade=t=in:st=0:d=${fadeIn}`);
    }

    if (fadeOut > 0) {
      // Get video duration to calculate fade out start time
      const duration = await this.getVideoDuration(input);
      const fadeOutStart = Math.max(0, duration - fadeOut);
      filters.push(`fade=t=out:st=${fadeOutStart}:d=${fadeOut}`);
    }

    const filterStr = filters.length > 0 ? `-vf "${filters.join(',')}"` : '';
    const cmd = `"${this.ffmpegPath}" -y -i "${input}" ${filterStr} -c:v libx264 "${output}"`;

    try {
      await execAsync(cmd);
    } catch (error) {
      throw new Error(`FFmpeg transition failed: ${(error as Error).message}`);
    }
  }

  /**
   * Add text overlay annotations
   * Note: This creates a simple text overlay. For complex annotations,
   * consider using a dedicated video editing library.
   */
  async addAnnotations(
    input: string,
    output: string,
    annotations: VideoAnnotation[]
  ): Promise<void> {
    if (!this.ffmpegPath) {
      throw new FFmpegNotFoundError();
    }

    if (!fs.existsSync(input)) {
      throw new Error(`Input file not found: ${input}`);
    }

    if (annotations.length === 0) {
      // No annotations, just copy
      fs.copyFileSync(input, output);
      return;
    }

    // Build drawtext filters for each annotation
    const filters: string[] = [];

    for (const annotation of annotations) {
      const startSec = annotation.timestamp / 1000;
      const durationSec = (annotation.duration ?? 3000) / 1000;
      const endSec = startSec + durationSec;

      const x = annotation.position?.x ?? 10;
      const y = annotation.position?.y ?? 10;
      const text = annotation.content.replace(/'/g, "'\\''");

      // drawtext filter with enable timing
      filters.push(
        `drawtext=text='${text}':fontsize=24:fontcolor=white:x=${x}:y=${y}:enable='between(t,${startSec},${endSec})'`
      );
    }

    const filterStr = filters.join(',');
    const cmd = `"${this.ffmpegPath}" -y -i "${input}" -vf "${filterStr}" -c:v libx264 "${output}"`;

    try {
      await execAsync(cmd);
    } catch (error) {
      throw new Error(`FFmpeg annotation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Get video duration in seconds
   */
  async getVideoDuration(input: string): Promise<number> {
    if (!this.ffmpegPath) {
      throw new FFmpegNotFoundError();
    }

    const cmd = `"${this.ffmpegPath}" -i "${input}" -show_entries format=duration -v quiet -of csv="p=0"`;

    try {
      const { stdout } = await execAsync(cmd);
      return parseFloat(stdout.trim());
    } catch {
      // Fallback: use ffprobe
      const probeCmd = `"${this.ffmpegPath.replace('ffmpeg', 'ffprobe')}" -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${input}"`;
      try {
        const { stdout } = await execAsync(probeCmd);
        return parseFloat(stdout.trim());
      } catch {
        throw new Error('Could not determine video duration');
      }
    }
  }

  /**
   * Concatenate multiple videos
   */
  async concatenate(inputs: string[], output: string): Promise<void> {
    if (!this.ffmpegPath) {
      throw new FFmpegNotFoundError();
    }

    if (inputs.length === 0) {
      throw new Error('No input files provided');
    }

    if (inputs.length === 1) {
      fs.copyFileSync(inputs[0], output);
      return;
    }

    // Create concat file list
    const listFile = output + '.concat.txt';
    const listContent = inputs.map(f => `file '${f}'`).join('\n');
    fs.writeFileSync(listFile, listContent);

    try {
      const cmd = `"${this.ffmpegPath}" -y -f concat -safe 0 -i "${listFile}" -c copy "${output}"`;
      await execAsync(cmd);
    } finally {
      fs.unlinkSync(listFile);
    }
  }
}
