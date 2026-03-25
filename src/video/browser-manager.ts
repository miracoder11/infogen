import { chromium, Browser, BrowserContext, Page } from 'playwright';
import type { VideoConfig, BrowserSession, SessionInfo, SessionState } from './types.js';
import { generateVideoId, createVideoConfig } from './config.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Manages isolated browser sessions with video recording
 */
export class BrowserSessionManager {
  private sessions: Map<string, BrowserSession> = new Map();
  private sessionStates: Map<string, SessionState> = new Map();
  private defaultConfig: VideoConfig;

  constructor(config?: Partial<VideoConfig>) {
    this.defaultConfig = createVideoConfig(config);
    this.ensureOutputDir();
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDir(): void {
    if (!fs.existsSync(this.defaultConfig.outputDir)) {
      fs.mkdirSync(this.defaultConfig.outputDir, { recursive: true });
    }
  }

  /**
   * Create a new isolated browser session with video recording
   */
  async createSession(config?: Partial<VideoConfig>): Promise<BrowserSession> {
    const sessionConfig = { ...this.defaultConfig, ...config };
    const sessionId = generateVideoId();

    // Launch browser
    const browser = await chromium.launch({
      headless: true,
    });

    // Create context with video recording
    const videoPath = path.join(sessionConfig.outputDir, `session-${sessionId}`);
    const context = await browser.newContext({
      viewport: {
        width: sessionConfig.width,
        height: sessionConfig.height,
      },
      recordVideo: {
        dir: videoPath,
        size: {
          width: sessionConfig.width,
          height: sessionConfig.height,
        },
      },
    });

    // Create page
    const page = await context.newPage();

    const session: BrowserSession = {
      id: sessionId,
      browser,
      context,
      page,
      config: sessionConfig,
      startTime: Date.now(),
    };

    this.sessions.set(sessionId, session);
    this.sessionStates.set(sessionId, 'recording');

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): BrowserSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get session state
   */
  getSessionState(sessionId: string): SessionState {
    return this.sessionStates.get(sessionId) || 'idle';
  }

  /**
   * Get all active session info
   */
  getActiveSessions(): SessionInfo[] {
    const infos: SessionInfo[] = [];
    for (const [id, session] of this.sessions) {
      infos.push({
        id,
        state: this.sessionStates.get(id) || 'idle',
        startTime: session.startTime,
        config: session.config,
      });
    }
    return infos;
  }

  /**
   * Update session state
   */
  updateSessionState(sessionId: string, state: SessionState): void {
    this.sessionStates.set(sessionId, state);
  }

  /**
   * Close a specific session and return video path
   */
  async closeSession(sessionId: string): Promise<string | null> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    this.sessionStates.set(sessionId, 'processing');

    try {
      // Close page first
      await session.page.close();

      // Close context (this finalizes the video)
      await session.context.close();

      // Get the video path
      const video = session.page.video();
      const videoPath = video ? await video.path() : null;

      // Close browser
      await session.browser.close();

      this.sessionStates.set(sessionId, 'completed');
      this.sessions.delete(sessionId);

      return videoPath;
    } catch (error) {
      this.sessionStates.set(sessionId, 'error');
      throw error;
    }
  }

  /**
   * Cleanup all sessions
   */
  async cleanup(): Promise<void> {
    const closePromises: Promise<string | null>[] = [];

    for (const sessionId of this.sessions.keys()) {
      closePromises.push(this.closeSession(sessionId));
    }

    await Promise.all(closePromises);
  }

  /**
   * Get default configuration
   */
  getDefaultConfig(): VideoConfig {
    return { ...this.defaultConfig };
  }
}
