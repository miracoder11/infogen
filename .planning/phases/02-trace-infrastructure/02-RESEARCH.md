# Phase 2: Trace Infrastructure - Research

**Researched:** 2026-03-26
**Domain:** OpenTelemetry for Agent Execution Observability
**Confidence:** HIGH

## Summary

This phase establishes OpenTelemetry-compatible trace capture infrastructure for agent execution observability. The research confirms that the OpenTelemetry SDK for Node.js provides all necessary capabilities: hierarchical spans, millisecond+ precision timestamps, and OTLP export format. The key insight is that GenAI semantic conventions (in development status) provide standardized attribute names for LLM and agent operations, which should be adopted for future compatibility with observability tools.

**Primary recommendation:** Use `@opentelemetry/sdk-node` v0.214.0 with OTLP HTTP/protobuf exporter, adopting GenAI semantic conventions for agent/LLM/tool span attributes. Integrate Phase 1's traceability attributes (statement_id, timestamp) as custom span attributes.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
None — all implementation choices are at Claude's discretion.

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

**Guidance from prior phases:**
- Phase 1 established log format: JSON Lines with custom levels (DEBUG, INFO, WARN, ERROR, PASS, FAIL)
- Phase 1 established traceability: Every artifact must link to statement_id + timestamp
- OpenTelemetry spans should include these traceability attributes

### Deferred Ideas (OUT OF SCOPE)
None — infrastructure phase, scope is clear from requirements.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| OBS-01 | Trace capture with hierarchical spans for agent execution observability | OpenTelemetry SDK + GenAI semantic conventions documented below |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @opentelemetry/sdk-node | 0.214.0 | Complete Node.js SDK with auto-instrumentation | Official OpenTelemetry SDK for Node.js, handles all instrumentation setup |
| @opentelemetry/api | 1.9.1 | Stable API for creating spans and traces | Stable API contract, allows switching implementations without code changes |
| @opentelemetry/exporter-trace-otlp-proto | 0.214.0 | OTLP HTTP/protobuf trace exporter | Standard protocol for trace export, most widely supported by backends |
| @opentelemetry/resources | 2.6.1 | Resource attribution for traces | Identifies service producing traces |
| @opentelemetry/semantic-conventions | 1.40.0 | Standard attribute names | Ensures compatibility with observability tools |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @opentelemetry/exporter-trace-otlp-http | 0.214.0 | OTLP HTTP/JSON exporter | When JSON format preferred over protobuf |
| @opentelemetry/exporter-trace-otlp-grpc | 0.214.0 | OTLP gRPC exporter | When gRPC performance needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @opentelemetry/sdk-node | Manual tracer provider setup | SDK handles initialization complexity; manual setup only for fine-grained control |
| OTLP protobuf | OTLP JSON | Protobuf more efficient; JSON useful for debugging |
| OTLP HTTP | OTLP gRPC | HTTP simpler to deploy; gRPC better performance for high volume |

**Installation:**
```bash
npm install @opentelemetry/sdk-node @opentelemetry/api @opentelemetry/exporter-trace-otlp-proto @opentelemetry/resources @opentelemetry/semantic-conventions
```

**Version verification:** Verified 2026-03-26 via npm registry:
- @opentelemetry/sdk-node: 0.214.0
- @opentelemetry/api: 1.9.1
- @opentelemetry/exporter-trace-otlp-proto: 0.214.0
- @opentelemetry/resources: 2.6.1
- @opentelemetry/semantic-conventions: 1.40.0

## Architecture Patterns

### Recommended Project Structure
```
src/
├── tracing/
│   ├── index.ts           # Public API for trace utilities
│   ├── instrumentation.ts # OpenTelemetry SDK initialization
│   ├── span-helpers.ts    # Helper functions for creating spans
│   └── attributes.ts      # Custom attribute definitions (statement_id, etc.)
├── exporters/
│   └── otlp-exporter.ts   # OTLP exporter configuration
└── types/
    └── trace-types.ts     # TypeScript interfaces for trace data
```

### Pattern 1: SDK Initialization
**What:** Initialize OpenTelemetry SDK at application startup
**When to use:** Once at application entry point (before any tracing)
**Example:**
```typescript
// src/tracing/instrumentation.ts
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const traceExporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'infogen-agent',
    [SemanticResourceAttributes.SERVICE_VERSION]: '1.0.0',
  }),
  traceExporter,
  // Use BatchSpanProcessor for production (default)
  // spanProcessor: new BatchSpanProcessor(traceExporter),
});

// Initialize at startup
sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => sdk.shutdown());
```

### Pattern 2: Hierarchical Spans for Agent Execution
**What:** Create nested spans for agent actions, LLM calls, and tool calls
**When to use:** Every agent operation that should be observable
**Example:**
```typescript
// src/tracing/span-helpers.ts
import { trace, Span, Context } from '@opentelemetry/api';
import { SEMATTRS_GEN_AI_OPERATION_NAME, SEMATTRS_GEN_AI_PROVIDER_NAME } from '@opentelemetry/semantic-conventions';

const tracer = trace.getTracer('infogen-agent', '1.0.0');

// Custom traceability attributes (from Phase 1)
const TRACE_ATTR = {
  STATEMENT_ID: 'infogen.statement_id',
  AGENT_ACTION: 'infogen.agent_action',
} as const;

// Agent action span (top-level)
export async function withAgentSpan<T>(
  statementId: string,
  actionName: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(`agent.${actionName}`, {
    attributes: {
      [TRACE_ATTR.STATEMENT_ID]: statementId,
      [TRACE_ATTR.AGENT_ACTION]: actionName,
    },
  }, async (span) => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      throw error;
    } finally {
      span.end();
    }
  });
}

// LLM call span (nested within agent action)
export async function withLLMSpan<T>(
  provider: string,
  model: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan('llm.inference', {
    attributes: {
      [SEMATTRS_GEN_AI_OPERATION_NAME]: 'chat',
      [SEMATTRS_GEN_AI_PROVIDER_NAME]: provider,
      'gen_ai.request.model': model,
    },
  }, async (span) => {
    try {
      const result = await fn(span);
      return result;
    } finally {
      span.end();
    }
  });
}

// Tool call span (nested within agent action)
export async function withToolSpan<T>(
  toolName: string,
  args: Record<string, unknown>,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(`tool.${toolName}`, {
    attributes: {
      'gen_ai.operation.name': 'execute_tool',
      'gen_ai.tool.name': toolName,
      'gen_ai.tool.call.arguments': JSON.stringify(args),
    },
  }, async (span) => {
    try {
      const result = await fn(span);
      return result;
    } finally {
      span.end();
    }
  });
}
```

### Pattern 3: Usage Example with Full Hierarchy
**What:** Complete example showing Trace -> Agent Action -> LLM/Tool spans
**When to use:** Reference implementation for agent execution
**Example:**
```typescript
// Example: Agent executing a task with LLM and tool calls
async function executeAgentTask(statementId: string, task: string) {
  return withAgentSpan(statementId, 'execute_task', async (agentSpan) => {
    agentSpan.addEvent('task_started', { task });

    // LLM call for planning
    const plan = await withLLMSpan('anthropic', 'claude-3-sonnet', async (llmSpan) => {
      const response = await llmClient.messages.create({
        model: 'claude-3-sonnet',
        messages: [{ role: 'user', content: task }],
      });
      llmSpan.setAttributes({
        'gen_ai.usage.input_tokens': response.usage.input_tokens,
        'gen_ai.usage.output_tokens': response.usage.output_tokens,
      });
      return response.content;
    });

    // Tool call for file operation
    const result = await withToolSpan('write_file', { path: '/tmp/output.txt' }, async (toolSpan) => {
      const content = await fs.writeFile('/tmp/output.txt', plan);
      toolSpan.setAttributes({
        'tool.result': 'success',
        'tool.bytes_written': Buffer.byteLength(plan),
      });
      return content;
    });

    agentSpan.addEvent('task_completed');
    return result;
  });
}
```

### Anti-Patterns to Avoid
- **Using SimpleSpanProcessor in production:** Causes performance issues; always use BatchSpanProcessor (SDK default)
- **Not ending spans:** Memory leaks and incomplete traces; always use try/finally with span.end()
- **Missing error recording:** Traces show success even on failure; always record exceptions
- **String concatenation for span names:** Poor cardinality for backends; use structured naming like `agent.{action}`, `tool.{name}`

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timestamp generation | Date.now() calls | OpenTelemetry Span timestamps | OpenTelemetry uses HrTime (nanosecond precision), handles clock drift |
| Trace ID generation | Custom UUID generation | OpenTelemetry TraceContext | Standard W3C format, propagates across services |
| Span hierarchy management | Manual parent tracking | tracer.startActiveSpan() | Context propagation built-in, handles async correctly |
| Export batching | Custom queue implementation | BatchSpanProcessor (SDK default) | Handles retries, batching, memory limits |
| Attribute naming | Custom attribute names | Semantic conventions | Tool compatibility (Jaeger, Grafana, Datadog) |

**Key insight:** OpenTelemetry handles distributed tracing edge cases (clock skew, context propagation, sampling) that are easy to get wrong in custom implementations.

## Common Pitfalls

### Pitfall 1: Not Initializing SDK Before Tracing
**What goes wrong:** Tracer returns no-op spans, all traces silently dropped
**Why it happens:** OpenTelemetry API works without SDK but produces no output
**How to avoid:** Initialize SDK at application entry point before any traced code runs
**Warning signs:** No traces appear in backend, no errors, tracer returns valid but no-op spans

### Pitfall 2: Missing Context Propagation in Async Code
**What goes wrong:** Child spans appear as root spans, hierarchy broken
**Why it happens:** Async operations lose context without proper propagation
**How to avoid:** Use `tracer.startActiveSpan()` which handles context automatically; avoid passing context manually
**Warning signs:** Flat trace view instead of hierarchy in observability tools

### Pitfall 3: High Cardinality Span Names
**What goes wrong:** Backend overwhelmed, trace aggregation fails
**Why it happens:** Including dynamic values (IDs, timestamps) in span names
**How to avoid:** Use structured names: `agent.execute_task` not `agent.task_12345`; put dynamic values in attributes
**Warning signs:** Observability tool performance degrades, "too many unique spans" errors

### Pitfall 4: Not Handling Exporter Failures
**What goes wrong:** Traces silently lost when backend unavailable
**Why it happens:** OTLP exporter failures don't throw by default
**How to avoid:** Configure exporter with timeout and retry settings; add logging for export errors
**Warning signs:** Missing traces during backend outages, no indication of failure

## Code Examples

### OTLP Exporter Configuration
```typescript
// src/exporters/otlp-exporter.ts
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';

export function createTraceExporter(): OTLPTraceExporter {
  return new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
    headers: {
      // Add authentication if required
      'Authorization': `Bearer ${process.env.OTEL_AUTH_TOKEN}`,
    },
    // Timeout in milliseconds
    timeoutMillis: 10000,
  });
}
```

### Custom Attributes for Traceability
```typescript
// src/tracing/attributes.ts
// Integrates Phase 1 traceability requirements with OpenTelemetry

export const CUSTOM_ATTRIBUTES = {
  // From Phase 1 METHODOLOGY.md
  STATEMENT_ID: 'infogen.statement_id',      // ds-{YYYYMMDD}-{sequence}
  DELIVERABLE_TYPE: 'infogen.deliverable_type', // code, methodology, test, change

  // Log level alignment with Phase 1
  LOG_LEVEL: 'infogen.log_level',            // DEBUG, INFO, WARN, ERROR, PASS, FAIL

  // Agent-specific
  AGENT_ACTION: 'infogen.agent_action',
  AGENT_STATUS: 'infogen.agent_status',      // running, success, failed
} as const;

// Helper to add traceability to any span
export function addTraceability(
  span: Span,
  statementId: string,
  metadata: {
    deliverableType?: string;
    logLevel?: string;
  }
): void {
  span.setAttributes({
    [CUSTOM_ATTRIBUTES.STATEMENT_ID]: statementId,
    ...(metadata.deliverableType && { [CUSTOM_ATTRIBUTES.DELIVERABLE_TYPE]: metadata.deliverableType }),
    ...(metadata.logLevel && { [CUSTOM_ATTRIBUTES.LOG_LEVEL]: metadata.logLevel }),
  });
}
```

### Type Definitions
```typescript
// src/types/trace-types.ts
export interface AgentTraceContext {
  statementId: string;
  traceId: string;
  spanId: string;
}

export interface SpanResult<T> {
  result: T;
  traceId: string;
  spanId: string;
}

export interface TraceExporterConfig {
  endpoint: string;
  protocol: 'http-protobuf' | 'http-json' | 'grpc';
  headers?: Record<string, string>;
  timeout?: number;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Jaeger client libraries | OpenTelemetry SDK | 2021-2023 (OTel GA) | Vendor-neutral, single SDK for all backends |
| Custom trace formats | OTLP (OpenTelemetry Protocol) | 2020-2022 | Standard format, works with all observability tools |
| Manual span context | startActiveSpan() with context | OTel v1.0 | Automatic context propagation, less error-prone |
| Ad-hoc attribute names | Semantic Conventions | Ongoing | Tool compatibility, standardized attribute names |

**Deprecated/outdated:**
- Jaeger client libraries: Replaced by OpenTelemetry SDK (Jaeger still supports OTLP)
- Custom trace exporters: Use standard OTLP exporters instead
- Manual context propagation: Use startActiveSpan() for automatic context handling

## Open Questions

1. **GenAI Semantic Conventions Stability**
   - What we know: GenAI semantic conventions are in "development" status as of 2026-03
   - What's unclear: When they will reach stable status
   - Recommendation: Use current conventions but be prepared for minor attribute name changes; prefix custom attributes with `infogen.` to avoid conflicts

2. **Exporter Protocol Choice**
   - What we know: HTTP/protobuf, HTTP/JSON, and gRPC all supported
   - What's unclear: Which performs best for agent execution traces
   - Recommendation: Start with HTTP/protobuf (good balance of efficiency and simplicity); switch to gRPC if high-volume traces cause performance issues

## Environment Availability

> External dependencies for trace infrastructure.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | OpenTelemetry SDK | To be verified | - | - |
| OTLP Collector | Trace export | Optional | - | Console exporter for development |
| TypeScript | Type safety | To be verified | - | JavaScript without types |

**Missing dependencies with no fallback:**
- None — traces can export to console for development without a collector

**Missing dependencies with fallback:**
- OTLP Collector: Use ConsoleSpanExporter for development; production requires collector or direct backend connection

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (recommended) or Vitest |
| Config file | jest.config.js or vitest.config.ts |
| Quick run command | `npm test -- --testPathPattern=tracing` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| OBS-01 | OpenTelemetry-compatible traces produced | unit | `npm test -- tracing.test.ts` | Wave 0 |
| OBS-01 | Nested spans for LLM/tool calls | unit | `npm test -- span-helpers.test.ts` | Wave 0 |
| OBS-01 | Millisecond-precision timestamps | unit | `npm test -- timestamp.test.ts` | Wave 0 |
| OBS-01 | OTLP export format | integration | `npm test -- exporter.test.ts` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --testPathPattern=tracing`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/tracing/__tests__/instrumentation.test.ts` — SDK initialization
- [ ] `src/tracing/__tests__/span-helpers.test.ts` — span creation and hierarchy
- [ ] `src/tracing/__tests__/attributes.test.ts` — custom attribute injection
- [ ] `src/exporters/__tests__/otlp-exporter.test.ts` — OTLP format verification
- [ ] Framework install: `npm install --save-dev jest @types/jest ts-jest`

## Sources

### Primary (HIGH confidence)
- OpenTelemetry Node.js SDK - https://opentelemetry.io/docs/languages/nodejs/
- OpenTelemetry OTLP Exporter - https://opentelemetry.io/docs/specs/otlp/
- GenAI Semantic Conventions - https://opentelemetry.io/docs/specs/semconv/gen-ai/
- npm registry - Package version verification

### Secondary (MEDIUM confidence)
- OpenTelemetry Manual Instrumentation - https://opentelemetry.io/docs/languages/nodejs/instrumentation/
- W3C TraceContext Specification - Context propagation standard

### Tertiary (LOW confidence)
- None — all core findings verified with official OpenTelemetry documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - OpenTelemetry is mature, well-documented, verified via npm and official docs
- Architecture: HIGH - Patterns follow official OpenTelemetry best practices
- Pitfalls: HIGH - Based on common issues documented in OpenTelemetry community

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (30 days - OpenTelemetry SDK versions stable, GenAI conventions may evolve)
