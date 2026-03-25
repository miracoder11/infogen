/**
 * Artifact tools for MCP server
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { promises as fs } from 'fs';
import path from 'path';

const INFOGEN_DIR = path.join(process.cwd(), '.infogen');

export const artifactTools: Tool[] = [
  {
    name: 'artifact_list',
    description: 'List collected verification artifacts',
    inputSchema: {
      type: 'object',
      properties: {
        statement_id: {
          type: 'string',
          description: 'Filter by demo statement ID',
        },
        type: {
          type: 'string',
          description: 'Filter by artifact type (screenshot, log, test_result)',
        },
      },
    },
  },
  {
    name: 'artifact_get',
    description: 'Get artifact metadata by ID',
    inputSchema: {
      type: 'object',
      properties: {
        artifact_id: {
          type: 'string',
          description: 'The artifact ID',
        },
      },
      required: ['artifact_id'],
    },
  },
  {
    name: 'artifact_collect',
    description: 'Collect a new verification artifact',
    inputSchema: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Artifact type (screenshot, log, test_result)',
        },
        statement_id: {
          type: 'string',
          description: 'Demo statement to link to',
        },
        path: {
          type: 'string',
          description: 'Path to the artifact file',
        },
        description: {
          type: 'string',
          description: 'Description of the artifact',
        },
      },
      required: ['type', 'statement_id'],
    },
  },
];

export async function handleArtifactTool(name: string, args: any): Promise<any> {
  switch (name) {
    case 'artifact_list':
      return listArtifacts(args.statement_id, args.type);

    case 'artifact_get':
      return getArtifact(args.artifact_id);

    case 'artifact_collect':
      return collectArtifact(args);

    default:
      throw new Error(`Unknown artifact tool: ${name}`);
  }
}

async function listArtifacts(statementId?: string, type?: string): Promise<any> {
  try {
    const artifactsDir = path.join(INFOGEN_DIR, 'artifacts');
    const files = await fs.readdir(artifactsDir);

    let artifacts = files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));

    // Apply filters
    if (statementId) {
      artifacts = artifacts.filter(a => a.startsWith(statementId));
    }

    if (type) {
      artifacts = artifacts.filter(a => a.includes(`-${type}-`));
    }

    const artifactData = await Promise.all(
      artifacts.map(async (id) => {
        try {
          const content = await fs.readFile(
            path.join(artifactsDir, `${id}.json`),
            'utf-8'
          );
          return JSON.parse(content);
        } catch {
          return null;
        }
      })
    );

    const validArtifacts = artifactData.filter(a => a !== null);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            { artifacts: validArtifacts, count: validArtifacts.length },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'Failed to list artifacts', artifacts: [] }),
        },
      ],
    };
  }
}

async function getArtifact(artifactId: string): Promise<any> {
  try {
    const artifactFile = path.join(INFOGEN_DIR, 'artifacts', `${artifactId}.json`);
    const content = await fs.readFile(artifactFile, 'utf-8');
    const artifact = JSON.parse(content);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(artifact, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: `Artifact not found: ${artifactId}` }),
        },
      ],
    };
  }
}

async function collectArtifact(args: any): Promise<any> {
  try {
    const { type, statement_id, path: artifactPath, description } = args;

    // Generate artifact ID
    const timestamp = Date.now();
    const artifactId = `${statement_id}-${type}-${timestamp}`;

    // Create artifact metadata
    const artifact = {
      id: artifactId,
      type,
      statement_id,
      path: artifactPath,
      description: description || `${type} for ${statement_id}`,
      collected_at: new Date().toISOString(),
    };

    // Save metadata
    const metaFile = path.join(INFOGEN_DIR, 'artifacts', `${artifactId}.json`);
    await fs.writeFile(metaFile, JSON.stringify(artifact, null, 2));

    // Update statement if exists
    try {
      const statementFile = path.join(INFOGEN_DIR, 'statements', `${statement_id}.json`);
      const content = await fs.readFile(statementFile, 'utf-8');
      const statement = JSON.parse(content);

      if (!statement.artifacts) {
        statement.artifacts = [];
      }
      statement.artifacts.push(artifactId);

      await fs.writeFile(statementFile, JSON.stringify(statement, null, 2));
    } catch {
      // Statement doesn't exist, that's okay
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Artifact collected: ${artifactId}`,
            artifact,
          }, null, 2),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ error: 'Failed to collect artifact' }),
        },
      ],
    };
  }
}
