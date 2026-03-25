/**
 * Trace tools for MCP server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import path from 'path';

const INFOGEN_DIR = path.join(process.cwd(), '.infogen');

export const traceTools: Tool[] = [
  {
    name: 'trace_list',
    description: 'List available execution traces',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of traces to return',
        },
      },
    },
  },
  {
    name: 'trace_get',
    description: 'Get a specific trace by ID',
    inputSchema: {
      type: 'object',
      properties: {
        trace_id: {
          type: 'string',
          description: 'The trace ID to retrieve',
        },
      },
      required: ['trace_id'],
    },
  },
  {
    name: 'trace_search',
    description: 'Search traces by filter criteria',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by status (ok, error)',
        },
        start_time: {
          type: 'string',
          description: 'ISO timestamp for start of range',
        },
        end_time: {
          type: 'string',
          description: 'ISO timestamp for end of range',
        },
      },
    },
  },
];

export async function handleTraceTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'trace_list':
      return listTraces(args.limit || 10);

    case 'trace_get':
      return getTrace(args.trace_id);

    case 'trace_search':
      return searchTraces(args);

    default:
      throw new Error(`Unknown trace tool: ${name}`);
  }
}

async function listTraces(limit: number): Promise<any> {
  try {
    const tracesDir = path.join(INFOGEN_DIR, 'traces');
    const files = await fs.readdir(tracesDir);
    const jsonFiles = files.filter(f => f.endsWith('.json')).slice(0, limit);

    const traces = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(tracesDir, file), 'utf-8');
        return JSON.parse(content);
      })
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ traces, count: traces.length }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'Failed to list traces', traces: [] }),
        },
      ],
    };
  }
}

async function getTrace(traceId: string): Promise<any> {
  try {
    const traceFile = path.join(INFOGEN_DIR, 'traces', `${traceId}.json`);
    const content = await fs.readFile(traceFile, 'utf-8');
    const trace = JSON.parse(content);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(trace, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: `Trace not found: ${traceId}` }),
        },
      ],
    };
  }
}

async function searchTraces(filters: any): Promise<any> {
  // Simplified search - in production would use proper indexing
  try {
    const tracesDir = path.join(INFOGEN_DIR, 'traces');
    const files = await fs.readdir(tracesDir);

    let traces = await Promise.all(
      files.filter(f => f.endsWith('.json')).map(async (file) => {
        const content = await fs.readFile(path.join(tracesDir, file), 'utf-8');
        return JSON.parse(content);
      })
    );

    // Apply filters
    if (filters.status) {
      traces = traces.filter((t: any) => t.status === filters.status);
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ traces, count: traces.length }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'Search failed', traces: [] }),
        },
      ],
    };
  }
}
