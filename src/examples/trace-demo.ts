#!/usr/bin/env node
/**
 * InfoGen Trace Capture Demo
 *
 * Demonstrates complete trace capture with hierarchical spans for agent execution.
 * Shows Agent -> LLM and Agent -> Tool span hierarchies.
 *
 * Run: node --import tsx src/examples/trace-demo.ts
 */

import { withAgentSpan, withLLMSpan, withToolSpan, CUSTOM_ATTRIBUTES } from '../tracing/index.js';
import { createConsoleExporter } from '../exporters/index.js';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME, SEMRESATTRS_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';

// Demo configuration
const DEMO_STATEMENT_ID = 'ds-20260326-001';
const DEMO_TASK = 'Build a login form with email and password fields';

/**
 * Mock LLM call (simulates Anthropic API)
 */
async function mockLLMCall(prompt: string): Promise<string> {
  // Simulate API latency
  await new Promise((resolve) => setTimeout(resolve, 100));

  return `Plan for: ${prompt}
1. Create HTML form structure
2. Add CSS styling
3. Implement validation
4. Add submit handler`;
}

/**
 * Mock tool call (simulates file write)
 */
async function mockToolCall(toolName: string, args: Record<string, unknown>): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 50));

  if (toolName === 'write_file') {
    return `Wrote ${args.path} (${(args.content as string)?.length || 0} bytes)`;
  }
  return `Executed ${toolName}`;
}

/**
 * Main agent execution demo
 */
async function main() {
  console.log('=== InfoGen Trace Capture Demo ===\n');

  // Create console exporter for visibility
  const consoleExporter = createConsoleExporter({ indent: 2 });

  // Initialize tracing with console exporter
  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [SEMRESATTRS_SERVICE_NAME]: 'infogen-demo',
      [SEMRESATTRS_SERVICE_VERSION]: '1.0.0-demo',
    }),
    spanProcessor: new SimpleSpanProcessor(consoleExporter),
  });

  await sdk.start();
  console.log('[InfoGen Demo] SDK initialized');
  console.log('Starting agent execution...\n');

  // Agent action: Execute task with LLM and tool calls
  await withAgentSpan(DEMO_STATEMENT_ID, 'execute_task', async (agentSpan) => {
    agentSpan.addEvent('task_started', { task: DEMO_TASK });

    // Step 1: LLM call for planning
    const plan = await withLLMSpan('anthropic', 'claude-3-sonnet-20240229', async (llmSpan) => {
      llmSpan.addEvent('llm_call_started');

      const response = await mockLLMCall(DEMO_TASK);

      // Record token usage (simulated)
      llmSpan.setAttributes({
        [CUSTOM_ATTRIBUTES.LLM_INPUT_TOKENS]: 150,
        [CUSTOM_ATTRIBUTES.LLM_OUTPUT_TOKENS]: 80,
      });

      llmSpan.addEvent('llm_call_completed');
      return response;
    });

    console.log('\nLLM Plan:', plan);

    // Step 2: Tool call to write HTML file
    const htmlContent = `
<form>
  <input type="email" name="email" placeholder="Email" required />
  <input type="password" name="password" placeholder="Password" required />
  <button type="submit">Login</button>
</form>`;

    await withToolSpan('write_file', { path: './login-form.html', content: htmlContent }, async (toolSpan) => {
      const result = await mockToolCall('write_file', { path: './login-form.html', content: htmlContent });

      toolSpan.setAttribute(CUSTOM_ATTRIBUTES.TOOL_RESULT, 'success');
      toolSpan.addEvent('file_written', { path: './login-form.html', size: htmlContent.length });

      return result;
    });

    agentSpan.addEvent('task_completed');
    agentSpan.setAttribute(CUSTOM_ATTRIBUTES.AGENT_STATUS, 'success');
  });

  console.log('\nAgent execution complete.\n');

  // Shutdown and flush traces
  await sdk.shutdown();

  console.log('Traces exported to console.');
}

// Run demo
main().catch((error) => {
  console.error('Demo failed:', error);
  process.exit(1);
});
