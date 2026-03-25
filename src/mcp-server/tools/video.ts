/**
 * Video tools for MCP server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import path from 'path';

const INFOGEN_DIR = path.join(process.cwd(), '.infogen');

export const videoTools: Tool[] = [
  {
    name: 'video_list',
    description: 'List available demo videos',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of videos to return',
        },
      },
    },
  },
  {
    name: 'video_get',
    description: 'Get video metadata by name',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'The video name (without extension)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'video_start_recording',
    description: 'Start a video recording session',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the recording',
        },
        statement_id: {
          type: 'string',
          description: 'Optional demo statement ID to link',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'video_stop_recording',
    description: 'Stop the current video recording',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

export async function handleVideoTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'video_list':
      return listVideos(args.limit || 10);

    case 'video_get':
      return getVideo(args.name);

    case 'video_start_recording':
      return startRecording(args.name, args.statement_id);

    case 'video_stop_recording':
      return stopRecording();

    default:
      throw new Error(`Unknown video tool: ${name}`);
  }
}

async function listVideos(limit: number): Promise<any> {
  try {
    const videosDir = path.join(INFOGEN_DIR, 'videos');
    const files = await fs.readdir(videosDir);
    const jsonFiles = files.filter(f => f.endsWith('.json')).slice(0, limit);

    const videos = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(videosDir, file), 'utf-8');
        return JSON.parse(content);
      })
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ videos, count: videos.length }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'Failed to list videos', videos: [] }),
        },
      ],
    };
  }
}

async function getVideo(name: string): Promise<any> {
  try {
    const metaFile = path.join(INFOGEN_DIR, 'videos', `${name}.json`);
    const content = await fs.readFile(metaFile, 'utf-8');
    const video = JSON.parse(content);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(video, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: `Video not found: ${name}` }),
        },
      ],
    };
  }
}

async function startRecording(name: string, statementId?: string): Promise<any> {
  try {
    // Create recording session metadata
    const session = {
      name,
      statement_id: statementId,
      started_at: new Date().toISOString(),
      status: 'recording',
    };

    const sessionFile = path.join(INFOGEN_DIR, 'videos', '.session.json');
    await fs.writeFile(sessionFile, JSON.stringify(session, null, 2));

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Recording started: ${name}`,
            session,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'Failed to start recording' }),
        },
      ],
    };
  }
}

async function stopRecording(): Promise<any> {
  try {
    const sessionFile = path.join(INFOGEN_DIR, 'videos', '.session.json');
    const content = await fs.readFile(sessionFile, 'utf-8');
    const session = JSON.parse(content);

    // Calculate duration
    const startTime = new Date(session.started_at).getTime();
    const duration_ms = Date.now() - startTime;

    // Create final metadata
    const videoMeta = {
      ...session,
      status: 'completed',
      stopped_at: new Date().toISOString(),
      duration_ms,
      file: `${session.name}.mp4`,
    };

    // Save final metadata
    const metaFile = path.join(INFOGEN_DIR, 'videos', `${session.name}.json`);
    await fs.writeFile(metaFile, JSON.stringify(videoMeta, null, 2));

    // Clear session
    await fs.unlink(sessionFile);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Recording stopped: ${session.name}`,
            video: videoMeta,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'No active recording session' }),
        },
      ],
    };
  }
}
