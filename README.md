# InfoGen Trace Infrastructure

OpenTelemetry-compatible trace capture for agent execution observability.

## Overview

This module provides hierarchical span tracing for AI agent operations, enabling observability into LLM calls, tool executions, and agent actions. Traces are exported in OTLP format for compatibility with standard observability backends (Jaeger, Grafana, Datadog, etc.).

## Features

- **OpenTelemetry Compatible**: Uses standard OTLP export format
- **Hierarchical Spans**: Agent -> LLM/Tool span nesting
- **Phase 1 Integration**: Includes `statement_id` for traceability
- **Millisecond Precision**: Nanosecond-precision timestamps via HrTime
- **Flexible Exporters**: OTLP (production), Console (development)
- **In-Memory Storage**: Store and export traces to JSON files

## Installation

```bash
npm install @opentelemetry/sdk-node @opentelemetry/api @opentelemetry/exporter-trace-otlp-proto @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/sdk-trace-base
```

## Quick Start

```typescript
import { initializeTracing, withAgentSpan, withLLMSpan, withToolSpan } from './tracing/index.js';

// Initialize at application startup
await initializeTracing();

// Use in agent code
await withAgentSpan('ds-20260326-001', 'execute_task', async (span) => {
  span.addEvent('task_started');

  // LLM call (nested span)
  const plan = await withLLMSpan('anthropic', 'claude-3-sonnet', async (llmSpan) => {
    const response = await llmClient.messages.create({ model: 'claude-3-sonnet', messages });
    llmSpan.setAttributes({
      'infogen.llm.input_tokens': response.usage.input_tokens,
      'infogen.llm.output_tokens': response.usage.output_tokens,
    });
    return response;
  });

  // Tool call (nested span)
  await withToolSpan('write_file', { path: '/tmp/output.txt' }, async (toolSpan) => {
    await fs.writeFile('/tmp/output.txt', content);
    toolSpan.setAttribute('infogen.tool.result', 'success');
  });

  span.addEvent('task_completed');
});
```

## API Reference

### Initialization

```typescript
import { initializeTracing, shutdownTracing } from './tracing/index.js';

// Initialize with optional config
await initializeTracing({
  serviceName: 'my-agent',
  tracesEndpoint: 'http://localhost:4318/v1/traces',
});

// Graceful shutdown
await shutdownTracing();
```

### Span Helpers

```typescript
import { withAgentSpan, withLLMSpan, withToolSpan } from './tracing/index.js';

// Agent action span (top-level)
await withAgentSpan(statementId, actionName, async (span) => {
  // Agent logic here
});

// LLM call span (nested)
await withLLMSpan(provider, model, async (span) => {
  // LLM call here
});

// Tool call span (nested)
await withToolSpan(toolName, args, async (span) => {
  // Tool execution here
});
```

### Attributes

```typescript
import { CUSTOM_ATTRIBUTES, addTraceability } from './tracing/index.js';

// Add Phase 1 traceability
addTraceability(span, 'ds-20260326-001', {
  deliverableType: 'code/framework',
  logLevel: 'INFO',
});

// Available attributes
CUSTOM_ATTRIBUTES.STATEMENT_ID      // 'infogen.statement_id'
CUSTOM_ATTRIBUTES.DELIVERABLE_TYPE  // 'infogen.deliverable_type'
CUSTOM_ATTRIBUTES.LOG_LEVEL         // 'infogen.log_level'
CUSTOM_ATTRIBUTES.AGENT_ACTION      // 'infogen.agent_action'
CUSTOM_ATTRIBUTES.AGENT_STATUS      // 'infogen.agent_status'
CUSTOM_ATTRIBUTES.LLM_PROVIDER      // 'infogen.llm.provider'
CUSTOM_ATTRIBUTES.LLM_MODEL         // 'infogen.llm.model'
CUSTOM_ATTRIBUTES.TOOL_NAME         // 'infogen.tool.name'
CUSTOM_ATTRIBUTES.TOOL_RESULT       // 'infogen.tool.result'
```

### Exporters

```typescript
import { createTraceExporter, createConsoleExporter } from './exporters/index.js';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

// OTLP exporter (production)
const otlpExporter = createTraceExporter({
  url: 'http://localhost:4318/v1/traces',
  authToken: 'my-token',
});

// Console exporter (development)
const consoleExporter = createConsoleExporter({ indent: 2 });

// Add to SDK
sdk.addSpanProcessor(new SimpleSpanProcessor(consoleExporter));
```

### Storage

```typescript
import { TraceStorage, storeTrace, exportTracesToFile } from './storage/index.js';

// Create storage
const storage = new TraceStorage({ maxTraces: 1000 });

// Store a span
storage.store(span);

// Get trace by ID
const trace = storage.get(traceId);

// Get traces by statement_id
const traces = storage.getByStatementId('ds-20260326-001');

// Export to JSON file
await storage.exportToFile(traceId, 'my-trace.json');
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_SERVICE_NAME` | Service name | `infogen-agent` |
| `OTEL_SERVICE_VERSION` | Service version | `1.0.0` |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | OTLP endpoint | `http://localhost:4318/v1/traces` |
| `OTEL_AUTH_TOKEN` | Auth token (optional) | - |
| `OTEL_SAMPLING_RATE` | Sampling 0.0-1.0 | `1.0` |

## Demo

Run the demo to see traces in action:

```bash
npm run build
node --import tsx src/examples/trace-demo.ts
```

## Development

```bash
# Build
npm run build

# Test
npm test

# Test subset
npm test -- --test-name-pattern="tracing"
```

## Traceability

Integrates with Phase 1 methodology:
- `statement_id` format: `ds-{YYYYMMDD}-{sequence}`
- Log levels: DEBUG, INFO, WARN, ERROR, PASS, FAIL
- Deliverable types: code/framework, methodology/skill, test/quality, change/refactor

## License

MIT
