/**
 * MCP Server for InfoGen Perceptible Delivery
 * Exposes trace and video APIs to Claude Code
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { traceTools, handleTraceTool } from './tools/trace.js';
import { videoTools, handleVideoTool } from './tools/video.js';
import { artifactTools, handleArtifactTool } from './tools/artifact.js';

const server = new Server(
  {
    name: 'infogen-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List all available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [...traceTools, ...videoTools, ...artifactTools],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  // Route to appropriate handler
  if (name.startsWith('trace_')) {
    return handleTraceTool(name, args);
  } else if (name.startsWith('video_')) {
    return handleVideoTool(name, args);
  } else if (name.startsWith('artifact_')) {
    return handleArtifactTool(name, args);
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('InfoGen MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
