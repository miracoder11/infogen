# Architecture Research

**Domain:** Agent Observability and Demo Automation
**Researched:** 2026-03-25
**Confidence:** HIGH (MCP/Skills from official docs), MEDIUM (OpenTelemetry/Browser Automation from training knowledge)

## Standard Architecture

### System Overview

The Perceptible Agent Delivery system integrates three major subsystems:

```
+------------------------------------------------------------------+
|                    Claude Code Integration Layer                   |
|  +----------------+  +----------------+  +------------------------+ |
|  |  Skill System  |  |  MCP Protocol |  |  CLI Hooks/Events     | |
|  +-------+--------+  +-------+--------+  +-----------+------------+ |
|          |                 |                         |              |
+----------+-----------------+-------------------------+--------------+
           |                 |                         |
           v                 v                         v
+------------------------------------------------------------------+
|                        Orchestration Layer                         |
|  +----------------+  +----------------+  +------------------------+ |
|  | Demo Statement |  | Execution      |  | Artifact               | |
|  | Engine         |  | Tracker        |  | Generator              | |
|  +-------+--------+  +-------+--------+  +-----------+------------+ |
|          |                 |                         |              |
+----------+-----------------+-------------------------+--------------+
           |                 |                         |
           v                 v                         v
+------------------------------------------------------------------+
|                        Capture & Render Layer                     |
|  +----------------+  +----------------+  +------------------------+ |
|  | OpenTelemetry  |  | Browser        |  | Video                  | |
|  | Tracer         |  | Automation     |  | Renderer               | |
|  | (Agent Traces) |  | (Playwright)   |  | (FFmpeg/Remotion)      | |
|  +----------------+  +----------------+  +------------------------+ |
+------------------------------------------------------------------+
                                    |
                                    v
+------------------------------------------------------------------+
|                        Output Layer                               |
|  +----------------+  +----------------+  +------------------------+ |
|  | Video Demos    |  | Runtime Vis   |  | Verification           | |
|  | (MP4/WebM)     |  | (Diagrams)    |  | Artifacts (JSON/MD)     | |
|  +----------------+  +----------------+  +------------------------+ |
+------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Skill System** | Defines perceptible delivery workflows as reusable Claude Code skills | SKILL.md with YAML frontmatter, markdown instructions |
| **MCP Protocol** | Provides tools for demo capture, artifact generation | MCP Server with Tools (demo-capture, artifact-generate) |
| **CLI Hooks** | Intercepts agent events for observability injection | Claude Code hooks (PreToolUse, PostToolUse, Notification) |
| **Demo Statement Engine** | Parses and validates "When I complete, you will see..." declarations | YAML/JSON schema, statement parser |
| **Execution Tracker** | Records agent actions, tool calls, file changes | OpenTelemetry spans, event store |
| **Artifact Generator** | Produces screenshots, logs, test results, visualizations | Template system, snapshot generators |
| **OpenTelemetry Tracer** | Captures distributed traces of agent execution | OTLP exporter, span processors |
| **Browser Automation** | Controls browser for demo recording | Playwright: Browser, BrowserContext, Page |
| **Video Renderer** | Assembles captured frames into final video | FFmpeg pipeline or Remotion (React-based) |

## Recommended Project Structure

```
src/
+-- integration/           # Claude Code integration
|   +-- skills/           # Skill definitions
|   |   +-- demo-record/
|   |       +-- SKILL.md  # Main skill definition
|   |       +-- templates/
|   |       +-- scripts/
|   +-- mcp/              # MCP server implementation
|       +-- server.ts     # MCP protocol handler
|       +-- tools/        # Tool definitions
|       +-- resources/    # Resource providers
+-- orchestration/        # Core orchestration
|   +-- statements/       # Demo statement parsing
|   +-- tracker/          # Execution tracking
|   +-- generator/        # Artifact generation
+-- capture/              # Capture subsystems
|   +-- tracing/          # OpenTelemetry integration
|   +-- browser/          # Playwright automation
|   +-- recording/        # Video capture pipeline
+-- render/               # Rendering pipelines
|   +-- video/            # Video assembly
|   +-- diagrams/         # Runtime visualization
|   +-- templates/        # Output templates
+-- output/               # Generated artifacts
|   +-- videos/
|   +-- screenshots/
|   +-- traces/
+-- cli/                  # CLI interface
    +-- commands/
    +-- hooks/
```

### Structure Rationale

- **integration/**: Isolates Claude Code-specific code (skills, MCP, hooks) for easy updates when Claude Code API changes
- **orchestration/**: Core business logic independent of integration mechanism
- **capture/**: Low-level capture primitives that can be tested independently
- **render/**: Output generation decoupled from capture for flexible rendering
- **output/**: Generated artifacts with clear separation from source code

## Architectural Patterns

### Pattern 1: Skill-Driven Orchestration

**What:** Define perceptible delivery workflows as Claude Code skills that orchestrate capture, tracking, and rendering.

**When to use:** Primary integration pattern with Claude Code. Skills provide natural entry points for demo recording.

**Trade-offs:**
- Pros: Native Claude Code integration, user-controllable, can bundle supporting files
- Cons: Requires Claude Code environment, skill syntax constraints

**Example:**
```yaml
# .claude/skills/demo-record/SKILL.md
---
name: demo-record
description: Record a video demonstration of the current task completion
disable-model-invocation: true
allowed-tools: Bash, Read, Write
---

When I complete this task, you will see a video demonstration.

## Recording Workflow

1. Start browser recording with Playwright
2. Execute the verification steps
3. Capture key screenshots at milestones
4. Stop recording and render video
5. Generate artifact summary

$ARGUMENTS
```

### Pattern 2: MCP Tool Exposure

**What:** Expose demo automation capabilities as MCP tools that Claude Code can invoke programmatically.

**When to use:** When Claude Code needs programmatic access to capture/render without skill overhead.

**Trade-offs:**
- Pros: Structured tool interface, capability negotiation, reusable across MCP clients
- Cons: More boilerplate than skills, requires MCP server setup

**Example:**
```typescript
// MCP Server tool definition
{
  name: "demo_capture_start",
  description: "Start recording a demo video",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string", description: "Demo title" },
      viewport: { type: "object", properties: { width: { type: "number" }, height: { type: "number" } } }
    },
    required: ["title"]
  }
}

// MCP Server implementation
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "demo_capture_start") {
    const { title, viewport } = request.params.arguments;
    // Start Playwright browser context with video recording
    const context = await browser.newContext({
      recordVideo: { dir: "./output/videos/", size: viewport }
    });
    return { content: [{ type: "text", text: `Recording started: ${title}` }] };
  }
});
```

### Pattern 3: Hook-Based Event Interception

**What:** Use Claude Code hooks to intercept tool events and inject observability.

**When to use:** For automatic capture without explicit skill invocation. Transparent observability.

**Trade-offs:**
- Pros: Automatic, no user action required, comprehensive coverage
- Cons: Can add latency, may capture noise, harder to control scope

**Example:**
```json
// .claude/hooks.json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Bash",
      "hooks": ["node scripts/trace-command.js"]
    }],
    "PostToolUse": [{
      "matcher": "Write",
      "hooks": ["node scripts/track-file-change.js"]
    }]
  }
}
```

### Pattern 4: OpenTelemetry Span Hierarchy

**What:** Model agent execution as hierarchical spans for distributed tracing.

**When to use:** For detailed execution tracking, debugging, and runtime visualization.

**Trade-offs:**
- Pros: Industry standard, rich tooling (Jaeger, Grafana), context propagation
- Cons: Learning curve, overhead if over-instrumented

**Example:**
```typescript
// Agent execution as span hierarchy
const tracer = opentelemetry.trace.getTracer('perceptible-agent');

async function executeMilestone(milestone: Milestone) {
  return tracer.startActiveSpan('milestone.execute', async (span) => {
    span.setAttribute('milestone.name', milestone.name);

    for (const task of milestone.tasks) {
      await tracer.startActiveSpan('task.execute', async (taskSpan) => {
        taskSpan.setAttribute('task.name', task.name);
        await executeTask(task);
        taskSpan.end();
      });
    }

    span.end();
  });
}
```

### Pattern 5: Playwright Browser Context Isolation

**What:** Use isolated browser contexts for each demo recording session.

**When to use:** For clean, reproducible demo recordings without cross-session contamination.

**Trade-offs:**
- Pros: Session isolation, independent cookies/storage, parallel recording
- Cons: Memory overhead per context, requires explicit state management

**Example:**
```typescript
// Isolated browser context for demo recording
const browser = await chromium.launch();

async function recordDemo(config: DemoConfig) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    recordVideo: {
      dir: './output/videos/',
      size: { width: 1280, height: 720 }
    }
  });

  const page = await context.newPage();

  // Execute demo steps
  for (const step of config.steps) {
    await executeStep(page, step);
  }

  // Close context to finalize video
  await context.close();
  const videoPath = await page.video().path();
  return videoPath;
}
```

## Data Flow

### Demo Recording Flow

```
[User invokes /demo-record]
         |
         v
[SKILL.md loaded] --> [Instructions parsed] --> [Arguments substituted]
         |
         v
[Start Capture] --> [Initialize Playwright context with video recording]
         |                    |
         |                    v
         |            [OpenTelemetry span started]
         |
         v
[Execute Steps] --> [For each step:]
         |              |
         |              +--> [Browser action] --> [Screenshot capture]
         |              |              |
         |              |              v
         |              |       [Span event recorded]
         |              |
         |              +--> [Tool call traced]
         |
         v
[Stop Capture] --> [Close browser context] --> [Video finalized]
         |
         v
[Render Output] --> [Add overlays/text] --> [Generate thumbnail]
         |
         v
[Generate Artifacts] --> [JSON summary] --> [Markdown report]
         |
         v
[Return to Claude Code] --> [Artifact paths available to LLM]
```

### Trace Collection Flow

```
[Agent Execution]
         |
         v
[Instrumentation Layer]
|        |        |
v        v        v
[Span]  [Span]  [Span]   (OpenTelemetry spans)
|        |        |
+--------+--------+
         |
         v
[SpanProcessor] --> [Batching] --> [OTLP Export]
         |
         v
[Collector] --> [Jaeger/Grafana] --> [Visualization]
         |
         +--> [Artifact Store] --> [Demo Statement Validation]
```

### Key Data Flows

1. **Demo Statement Flow:** User declares expected deliverable --> Parsed by Statement Engine --> Validated against artifacts --> Report generated

2. **Video Capture Flow:** Recording start --> Browser context created --> Steps executed --> Screenshots at milestones --> Context closed --> Video saved --> Post-processing

3. **Trace Flow:** Agent action --> Instrumented function --> Span created --> Attributes added --> Span ended --> Exported to collector

## Integration Points with Claude Code

### Primary Integration: Skills

**Recommended approach for v1.** Skills provide the most natural integration:

```yaml
# Skill location options:
~/.claude/skills/demo-record/SKILL.md     # Personal (all projects)
.claude/skills/demo-record/SKILL.md        # Project-specific
```

**Skill capabilities:**
- `disable-model-invocation: true` -- Only user triggers recording
- `allowed-tools: Bash, Read, Write, Grep` -- Grant specific permissions
- `context: fork` -- Run in isolated subagent
- Supporting files -- Templates, scripts, examples

### Secondary Integration: MCP Server

**For programmatic tool access.** MCP server exposes tools:

```
Tools:
- demo_record_start(title, config) --> session_id
- demo_record_step(session_id, action, screenshot) --> step_id
- demo_record_stop(session_id) --> video_path
- artifact_generate(type, data) --> artifact_path
- trace_export(format) --> trace_data

Resources:
- demo://templates/{name} -- Recording templates
- demo://sessions/{id} -- Session state
- demo://artifacts/{id} -- Generated artifacts
```

### Tertiary Integration: Hooks

**For automatic observability injection.** Hooks intercept events:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": ["node .claude/hooks/trace-start.js"]
    }],
    "PostToolUse": [{
      "matcher": "*",
      "hooks": ["node .claude/hooks/capture-result.js"]
    }]
  }
}
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Single user | Local file-based artifact storage, synchronous rendering |
| Small team | Shared network storage, simple queue for rendering jobs |
| Organization | Database-backed artifact store, async rendering workers |

### Scaling Priorities

1. **First bottleneck:** Video rendering time. Solution: Async rendering queue with job status tracking
2. **Second bottleneck:** Trace storage. Solution: Retention policies, compressed trace format, or external OTLP collector

## Anti-Patterns

### Anti-Pattern 1: Recording Everything

**What people do:** Start recording at session start, capture everything.

**Why it's wrong:** Massive storage, noisy videos, hard to find relevant content.

**Do this instead:** Skill-driven recording with explicit start/stop. Demo statements define what to capture.

### Anti-Pattern 2: Tight Coupling to Browser Type

**What people do:** Hard-code Playwright with Chromium assumptions.

**Why it's wrong:** Some demos need Firefox/WebKit for compatibility testing.

**Do this instead:** Abstract browser factory, configurable per demo:

```typescript
interface BrowserConfig {
  type: 'chromium' | 'firefox' | 'webkit';
  viewport: { width: number; height: number };
  recordVideo: boolean;
}
```

### Anti-Pattern 3: Sync Rendering in Agent Flow

**What people do:** Wait for video render before continuing agent execution.

**Why it's wrong:** Video rendering can take minutes, blocking the agent.

**Do this instead:** Async rendering with notification:

```typescript
// Start rendering, continue agent
const jobId = await renderQueue.enqueue(videoPath);
// Later, check status or receive notification
const status = await renderQueue.getStatus(jobId);
```

### Anti-Pattern 4: Missing Demo Statements

**What people do:** Record demos without declaring expected outcomes.

**Why it's wrong:** No validation criteria, can't verify demo meets requirements.

**Do this instead:** Require demo statement at recording start:

```yaml
# Demo statement example
when_complete:
  - "You will see a login form with email and password fields"
  - "The submit button will be enabled after both fields are filled"
  - "A success toast will appear after submission"
```

## Component Build Order

Based on dependencies, recommended build sequence:

1. **Phase 1: Foundation**
   - OpenTelemetry tracer setup
   - Basic trace collection
   - Simple artifact generation (screenshots, logs)

2. **Phase 2: Capture**
   - Playwright browser automation
   - Video recording pipeline
   - Screenshot capture at milestones

3. **Phase 3: Integration**
   - Claude Code skill definitions
   - MCP server with tools
   - Hook-based event interception

4. **Phase 4: Orchestration**
   - Demo statement parser
   - Execution tracker
   - Artifact validation

5. **Phase 5: Rendering**
   - Video post-processing
   - Runtime visualization diagrams
   - Report generation

## Sources

- Model Context Protocol Architecture: https://modelcontextprotocol.io/docs/concepts/architecture (HIGH confidence - official docs)
- Claude Code Skills: https://code.claude.com/docs/en/skills (HIGH confidence - official docs)
- OpenTelemetry Tracing Concepts: https://opentelemetry.io/docs/concepts/signals/traces/ (MEDIUM confidence - training knowledge)
- Playwright Video Recording: https://playwright.dev/docs/videos (MEDIUM confidence - training knowledge)
- Playwright Library Architecture: https://playwright.dev/docs/library (MEDIUM confidence - training knowledge)
- Langfuse Agent Tracing: https://langfuse.com/docs/tracing (MEDIUM confidence - training knowledge)
- Cursor Cloud Agents video demo concept (referenced in PROJECT.md)

---
*Architecture research for: Perceptible Agent Delivery*
*Researched: 2026-03-25*