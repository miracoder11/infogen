/**
 * Generates Mermaid diagram syntax from trace data.
 * Supports flowchart, sequence, and state diagram formats.
 */

import { DiagramData, SpanNode } from './diagramTransform.js';
import { ExecutionTrajectory, TrajectoryStep } from './trajectoryTransform.js';
import { SerializedTrace } from './traceTransform.js';

export interface MermaidExport {
  flowchart: string;
  sequence: string;
  state: string;
}

/**
 * Escape special characters for Mermaid syntax.
 */
function escapeLabel(text: string): string {
  return text
    .replace(/"/g, "'")
    .replace(/[<>]/g, '')
    .replace(/\n/g, ' ')
    .replace(/\[/g, '(')
    .replace(/\]/g, ')')
    .substring(0, 50); // Limit length
}

/**
 * Get node shape based on type.
 */
function getNodeShape(type: SpanNode['type']): { start: string; end: string } {
  switch (type) {
    case 'agent':
      return { start: '[', end: ']' };
    case 'llm':
      return { start: '(', end: ')' };
    case 'tool':
      return { start: '[[', end: ']]' };
    default:
      return { start: '{', end: '}' };
  }
}

/**
 * Generate Mermaid flowchart syntax from diagram data.
 */
export function generateMermaidFlowchart(diagram: DiagramData): string {
  const lines: string[] = ['flowchart TD'];

  if (diagram.nodes.length === 0) {
    lines.push('    Empty["No data to display"]');
    return lines.join('\n');
  }

  // Add subgraphs for different types
  const agentNodes = diagram.nodes.filter((n) => n.type === 'agent');
  const llmNodes = diagram.nodes.filter((n) => n.type === 'llm');
  const toolNodes = diagram.nodes.filter((n) => n.type === 'tool');
  const customNodes = diagram.nodes.filter((n) => n.type === 'custom');

  // Define nodes
  for (const node of diagram.nodes) {
    const shape = getNodeShape(node.type);
    const label = escapeLabel(node.label);
    const statusClass = node.status === 'error' ? ':::error' : '';
    lines.push(`    ${node.id}${shape.start}"${label}"${shape.end}${statusClass}`);
  }

  // Add edges
  for (const edge of diagram.edges) {
    const label = edge.label ? `|"${escapeLabel(edge.label)}"|` : '';
    lines.push(`    ${edge.source} -->${label} ${edge.target}`);
  }

  // Add styling
  lines.push('');
  lines.push('    classDef agent fill:#eff6ff,stroke:#3b82f6');
  lines.push('    classDef llm fill:#f5f3ff,stroke:#8b5cf6');
  lines.push('    classDef tool fill:#ecfdf5,stroke:#10b981');
  lines.push('    classDef custom fill:#f9fafb,stroke:#6b7280');
  lines.push('    classDef error fill:#fef2f2,stroke:#ef4444');

  // Apply classes to nodes
  if (agentNodes.length > 0) {
    lines.push(`    class ${agentNodes.map((n) => n.id).join(',')} agent`);
  }
  if (llmNodes.length > 0) {
    lines.push(`    class ${llmNodes.map((n) => n.id).join(',')} llm`);
  }
  if (toolNodes.length > 0) {
    lines.push(`    class ${toolNodes.map((n) => n.id).join(',')} tool`);
  }
  if (customNodes.length > 0) {
    lines.push(`    class ${customNodes.map((n) => n.id).join(',')} custom`);
  }

  return lines.join('\n');
}

/**
 * Generate Mermaid sequence diagram from trajectory.
 */
export function generateMermaidSequence(trajectory: ExecutionTrajectory): string {
  const lines: string[] = ['sequenceDiagram'];

  if (trajectory.steps.length === 0) {
    lines.push('    Note over System: No execution data');
    return lines.join('\n');
  }

  // Collect unique participants from hierarchy
  const participants = new Map<string, string>();

  function collectParticipants(steps: TrajectoryStep[]) {
    for (const step of steps) {
      const participantName = step.name.split('.')[0];
      if (!participants.has(step.spanId)) {
        participants.set(step.spanId, participantName);
      }
      collectParticipants(step.children);
    }
  }

  collectParticipants(trajectory.steps);

  // Add participants
  const uniqueParticipants = new Set(participants.values());
  for (const participant of uniqueParticipants) {
    lines.push(`    participant ${participant}`);
  }

  // Add messages from hierarchy
  function addMessages(steps: TrajectoryStep[], parentParticipant?: string) {
    for (const step of steps) {
      const participant = step.name.split('.')[0];
      const label = escapeLabel(step.label);

      if (parentParticipant && parentParticipant !== participant) {
        lines.push(`    ${parentParticipant}->>${participant}: ${label}`);
      } else {
        lines.push(`    Note over ${participant}: ${label}`);
      }

      // Add status note for errors
      if (step.status === 'error') {
        lines.push(`    Note right of ${participant}: Error!`);
      }

      addMessages(step.children, participant);
    }
  }

  addMessages(trajectory.steps);

  return lines.join('\n');
}

/**
 * Generate Mermaid state diagram from trace.
 */
export function generateMermaidState(trace: SerializedTrace): string {
  const lines: string[] = ['stateDiagram-v2'];

  if (!trace.spans || trace.spans.length === 0) {
    lines.push('    [*] --> Empty');
    lines.push('    Empty: No data');
    return lines.join('\n');
  }

  // Build state hierarchy
  const spanMap = new Map<string, typeof trace.spans[0]>();
  const children = new Map<string, string[]>();
  const hasParent = new Set<string>();

  for (const span of trace.spans) {
    spanMap.set(span.spanId, span);
    if (!children.has(span.spanId)) {
      children.set(span.spanId, []);
    }
    if (span.parentSpanId) {
      hasParent.add(span.spanId);
      const parentChildren = children.get(span.parentSpanId);
      if (parentChildren) {
        parentChildren.push(span.spanId);
      }
    }
  }

  // Find roots
  const roots = trace.spans.filter((s) => !hasParent.has(s.spanId));

  // Add states
  lines.push('    [*] --> ' + (roots[0]?.spanId || 'Start'));

  for (const span of trace.spans) {
    const label = escapeLabel(span.name);
    const status = span.status.code === 2 ? ' (Error)' : '';
    lines.push(`    ${span.spanId} : ${label}${status}`);
  }

  // Add transitions
  for (const [parentId, childIds] of children) {
    for (const childId of childIds) {
      lines.push(`    ${parentId} --> ${childId}`);
    }
  }

  // Find leaf nodes (no children)
  for (const span of trace.spans) {
    const spanChildren = children.get(span.spanId) || [];
    if (spanChildren.length === 0) {
      lines.push(`    ${span.spanId} --> [*]`);
    }
  }

  return lines.join('\n');
}

/**
 * Validate Mermaid syntax (basic validation).
 */
export function validateMermaidSyntax(code: string): { valid: boolean; error?: string } {
  // Check for required diagram type
  const diagramTypes = ['flowchart', 'graph', 'sequenceDiagram', 'stateDiagram', 'classDiagram', 'erDiagram'];
  const hasDiagramType = diagramTypes.some((type) => code.trim().startsWith(type));

  if (!hasDiagramType) {
    return { valid: false, error: 'Missing diagram type declaration' };
  }

  // Check for balanced brackets
  const brackets = { '[': ']', '(': ')', '{': '}' };
  const stack: string[] = [];

  for (const char of code) {
    if (char in brackets) {
      stack.push(char);
    } else if (Object.values(brackets).includes(char)) {
      const last = stack.pop();
      if (!last || brackets[last as keyof typeof brackets] !== char) {
        return { valid: false, error: 'Unbalanced brackets' };
      }
    }
  }

  if (stack.length > 0) {
    return { valid: false, error: 'Unbalanced brackets' };
  }

  return { valid: true };
}

/**
 * Generate all Mermaid diagram types from trace data.
 */
export function generateAllMermaidDiagrams(
  diagram: DiagramData,
  trajectory: ExecutionTrajectory,
  trace: SerializedTrace
): MermaidExport {
  return {
    flowchart: generateMermaidFlowchart(diagram),
    sequence: generateMermaidSequence(trajectory),
    state: generateMermaidState(trace),
  };
}

/**
 * Generate Mermaid Live Editor URL.
 */
export function generateMermaidLiveUrl(code: string): string {
  const encoded = encodeURIComponent(code);
  return `https://mermaid.live/edit#${encoded}`;
}
