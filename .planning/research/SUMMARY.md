# Project Research Summary

**Project:** infoGen (Perceptible Agent Delivery)
**Domain:** Agent Observability and Demo Automation
**Researched:** 2026-03-25
**Confidence:** HIGH

## Executive Summary

infoGen is a "Perceptible Agent Delivery" system that transforms AI agent execution into observable, demonstrable outputs. The domain sits at the intersection of three emerging fields: LLM observability (tracing agent behavior), browser automation (capturing visual demos), and Claude Code integration (MCP protocol for tooling). Experts in this space use OpenTelemetry for distributed tracing, Playwright for browser automation with built-in video capture, and Langfuse for self-hosted observability storage.

The recommended approach follows a 5-phase build: Foundation (tracing infrastructure), Capture (browser automation and video recording), Integration (Claude Code skills and MCP tools), Orchestration (demo statement parsing and validation), and Rendering (video post-processing and artifact generation). The core innovation is the "demo statement" methodology where agents declare upfront what observable outputs they will produce, enabling automated verification. Video demo generation is a unique differentiator not offered by major observability platforms.

Key risks center on three areas: (1) brittle UI selectors that break demo recordings when interfaces change, mitigated by semantic selectors and fallback strategies; (2) synchronous video rendering blocking agent execution, solved by async rendering queues; and (3) shallow verification systems vulnerable to gaming, addressed by behavioral testing rather than presence checks. The MCP SDK v1 is stable and production-ready, though AgentPrism for trace visualization is an emerging tool with medium confidence.

## Key Findings

### Recommended Stack

TypeScript with React 19 and Vite form the core framework, chosen for MCP SDK compatibility and strong typing for complex agent traces. Playwright is the clear choice for browser automation due to built-in video recording capabilities, superior to Puppeteer which requires additional packages. Langfuse provides open-source, self-hostable LLM observability backed by ClickHouse for scalable trace storage. The Model Context Protocol SDK v1.28.0 is stable and production-ready for Claude Code integration.

**Core technologies:**
- TypeScript 6.0.2: Primary language - required by MCP SDK, strong typing for agent traces
- Playwright 1.58.2: Browser automation - built-in video recording, cross-browser support
- Langfuse 3.38.6: LLM observability - open source, self-hostable, ClickHouse-backed
- MCP SDK v1.28.0: Claude Code integration - official Anthropic SDK, production-ready
- OpenTelemetry API 1.9.0: Tracing standard - vendor-neutral, Langfuse compatible
- @xyflow/react 12.10.1: Graph visualization - best for trace/diagram rendering
- Zustand 5.0.12: State management - simple, no boilerplate, good for trace data

**Avoid:**
- MCP SDK v2 (pre-alpha, not production-ready)
- `playwright-video` npm package (unmaintained since 2020 - use Playwright native recording)
- Row-based databases for trace storage (must use columnar like ClickHouse)

### Expected Features

The competitive landscape (Langfuse, LangSmith, Phoenix, Opik) has established clear table stakes: trace capture with hierarchical spans, timeline visualization, input/output inspection, token/cost tracking, error display, and session filtering. All major platforms support OpenTelemetry instrumentation. LLM-as-Judge evaluation is now expected for quality scoring.

**Must have (table stakes):**
- Trace/Session Capture with OpenTelemetry instrumentation
- Hierarchical Spans showing nested execution (LLM calls, tool calls, agent actions)
- Timeline View for visual debugging
- Input/Output Inspection for prompt/completion visibility
- Token/Cost Tracking for budget awareness
- Session Filtering by project, time, status

**Should have (competitive differentiators):**
- Auto-Generated Video Demos - transforms execution traces into shareable videos (unique gap - no competitor offers this)
- Demo Declaration Method - agents declare expected outputs upfront for automated verification
- Agent Execution Graph - visual DAG showing workflow, decision branches (only RagaAI Catalyst has this)
- TTS Narration for demos - increases accessibility and engagement
- Before/After Comparison - visual diff for change verification

**Defer (v2+):**
- Real-Time Streaming - requires significant infrastructure investment
- CI/CD Integration - needs stable API and evaluation framework first
- Guardrails/Safety Rules - enterprise feature, not needed for validation
- Multi-Agent Platform Support - expand beyond Claude Code after core validation

### Architecture Approach

A 4-layer architecture separates concerns cleanly: Integration Layer (Claude Code skills, MCP protocol, CLI hooks), Orchestration Layer (demo statement engine, execution tracker, artifact generator), Capture and Render Layer (OpenTelemetry tracer, Playwright browser automation, video renderer), and Output Layer (video demos, runtime visualizations, verification artifacts). The recommended project structure isolates Claude Code-specific code in an `integration/` directory for easy updates when APIs change.

**Major components:**
1. Skill System - defines perceptible delivery workflows as reusable Claude Code skills with YAML frontmatter
2. MCP Server - exposes tools (demo_capture_start, demo_record_step, demo_record_stop, artifact_generate) for programmatic access
3. OpenTelemetry Tracer - captures distributed traces of agent execution with hierarchical spans
4. Playwright Browser Context - isolated contexts per demo recording with native video capture
5. Demo Statement Engine - parses and validates "When I complete, you will see..." declarations
6. Video Renderer - assembles captured frames into final video with FFmpeg or Remotion

**Key patterns:**
- Skill-Driven Orchestration: Skills provide natural entry points for demo recording
- OpenTelemetry Span Hierarchy: Model agent execution as nested spans for debugging
- Playwright Browser Context Isolation: Clean, reproducible recordings without cross-session contamination
- Async Rendering: Never block agent execution on video encoding

### Critical Pitfalls

1. **Brittle Selectors Breaking Demo Recordings** - Use semantic selectors (`getByRole`, `getByLabel`, `getByTestId`) instead of CSS classes/IDs. Build selector health checks and a registry with fallback strategies.

2. **Observability Data Overload** - Define clear goals before instrumenting. Use sampling for high-volume events, implement retention policies (detailed traces 7 days, aggregated 90 days), and create trace importance levels.

3. **Demo Statements Without Validation** - Treat statements as executable specifications, not documentation. Each statement must have a corresponding verification check. Fail the demo if verification fails.

4. **MCP Server Statefulness Without Cleanup** - Implement cleanup handlers for connection close, server shutdown, errors, and timeouts. Use resource tracking with reference counting. Auto-cleanup stale sessions.

5. **Synchronous Video Rendering Blocking Agent** - Design async rendering from start: record -> save raw frames -> return immediately -> background worker processes queue. Provide progress updates.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation
**Rationale:** Tracing infrastructure is the foundation everything else depends on. Must establish OpenTelemetry setup before capture mechanisms.
**Delivers:** Trace collection, hierarchical spans, basic artifact generation (screenshots, logs)
**Addresses:** Trace Capture, Hierarchical Spans, Timeline View, Input/Output Inspection, Session Filtering (from FEATURES.md table stakes)
**Avoids:** Observability data overload (from PITFALLS.md) - implement sampling and retention from day one
**Stack:** OpenTelemetry API/SDK, Langfuse (or simple file storage for v1), TypeScript types for trace data

### Phase 2: Capture
**Rationale:** With tracing in place, add browser automation for visual capture. Video recording is the core differentiator.
**Delivers:** Playwright browser automation, video recording pipeline, screenshot capture at milestones
**Addresses:** Basic Video Generation (key differentiator from FEATURES.md), Demo Declaration foundation
**Uses:** Playwright with native video recording, Zod for demo statement schema validation
**Avoids:** Brittle selectors (from PITFALLS.md) - use semantic selectors from the start
**Implements:** Playwright Browser Context Isolation pattern from ARCHITECTURE.md

### Phase 3: Integration
**Rationale:** Connect capture capabilities to Claude Code via skills and MCP tools. This makes the system usable.
**Delivers:** Claude Code skill definitions, MCP server with tools, hook-based event interception
**Addresses:** MCP Integration (from competitor analysis), Demo Declaration skill template
**Uses:** MCP SDK v1.28.0, Claude Code Skills system
**Avoids:** MCP server statefulness without cleanup (from PITFALLS.md) - implement lifecycle handlers
**Implements:** Skill-Driven Orchestration pattern from ARCHITECTURE.md

### Phase 4: Orchestration
**Rationale:** With integration complete, add the intelligence layer that parses demo statements and validates artifacts.
**Delivers:** Demo statement parser, execution tracker, artifact validation, verification engine
**Addresses:** Demo Declaration Method (unique feature), Before/After Comparison (P2 feature)
**Avoids:** Demo statements without validation (PITFALLS.md) - every statement must have verification check
**Avoids:** Verification systems vulnerable to gaming (PITFALLS.md) - require behavioral tests, not presence checks
**Implements:** Demo Statement Engine from ARCHITECTURE.md component responsibilities

### Phase 5: Rendering
**Rationale:** Final phase adds polish with video post-processing, visualizations, and accessibility.
**Delivers:** Video post-processing (overlays, captions), runtime visualization diagrams, report generation, TTS narration
**Addresses:** TTS Narration (P2 feature), Agent Execution Graph (P2 feature)
**Avoids:** Synchronous video rendering (PITFALLS.md) - async rendering queue with worker processes
**Avoids:** Accessibility afterthought (PITFALLS.md) - generate captions and transcripts from day one
**Uses:** fluent-ffmpeg, Framer Motion for timeline animations, @xyflow/react for execution graphs

### Phase Ordering Rationale

- **Dependencies drive order:** Trace infrastructure (Phase 1) must exist before capture (Phase 2), which must exist before integration (Phase 3). Orchestration (Phase 4) needs all three to validate outputs. Rendering (Phase 5) is last as it enhances already-functional demos.
- **Architecture grouping:** Phases align with the 4-layer architecture: Phases 1-2 are Capture and Render Layer, Phase 3 is Integration Layer, Phase 4 is Orchestration Layer, Phase 5 enhances Output Layer.
- **Pitfall avoidance:** Each phase addresses specific pitfalls at the point where they are easiest to prevent. Sampling in Phase 1 prevents data overload. Semantic selectors in Phase 2 prevent brittle demos. Lifecycle handlers in Phase 3 prevent memory leaks.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (Orchestration):** Verification systems and behavioral testing patterns need deeper exploration. The pitfall about "gaming verification" has LOW confidence source quality. May need `/gsd:research-phase` for validation approaches.
- **Phase 5 (Rendering):** TTS integration options and Remotion vs FFmpeg trade-offs need evaluation. Video accessibility standards (WCAG for video) may need specific research.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** OpenTelemetry and Langfuse are well-documented with established patterns.
- **Phase 2 (Capture):** Playwright has excellent official documentation and established best practices.
- **Phase 3 (Integration):** MCP SDK and Claude Code Skills have official documentation and clear patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | MCP SDK from official docs, Playwright and Langfuse from official sources, AgentPrism from npm registry |
| Features | HIGH | Competitor analysis from official GitHub READMEs (Langfuse, LangSmith, Phoenix, Opik, OpenLIT, RagaAI Catalyst, demosmith-mcp) |
| Architecture | HIGH | MCP/Skills from official docs, OpenTelemetry from official docs, Playwright from official docs |
| Pitfalls | MEDIUM | MCP pitfalls from official docs (HIGH), Demo automation and video recording from training knowledge (MEDIUM), Verification systems from limited sources (LOW) |

**Overall confidence:** HIGH

### Gaps to Address

1. **Verification system patterns:** LOW confidence on preventing gaming of verification systems. During planning, research behavioral testing approaches for demo validation. Consider end-to-end testing frameworks that verify functionality, not just presence.

2. **AgentPrism adoption:** MEDIUM confidence on AgentPrism as it's an emerging tool (v0.0.9). During Phase 1, evaluate whether AgentPrism is mature enough or if custom D3.js visualization is needed.

3. **Video accessibility standards:** No explicit research on WCAG requirements for video demos. During Phase 5, research caption formats (VTT, SRT), audio description standards, and accessibility testing tools.

4. **Scalability limits:** Research focused on single-user scenarios. No clear guidance on when to move from file-based storage to database-backed artifact store. Monitor storage growth in Phase 1-2 and plan migration trigger points.

## Sources

### Primary (HIGH confidence)
- Model Context Protocol SDK: https://github.com/modelcontextprotocol/typescript-sdk — MCP SDK v1 stable, v2 pre-alpha status
- Model Context Protocol Architecture: https://modelcontextprotocol.io/docs/concepts/architecture — Protocol patterns, server lifecycle
- Claude Code Skills: https://code.claude.com/docs/en/skills — Skill definition format, allowed-tools, context options
- Model Context Protocol Debugging: https://modelcontextprotocol.io/docs/tools/debugging — Common MCP pitfalls, statefulness issues
- Langfuse: https://github.com/langfuse/langfuse — Open source observability, ClickHouse backend, OpenTelemetry integration
- Playwright: https://playwright.dev — Built-in video recording, browser context isolation, selector best practices
- OpenTelemetry Tracing: https://opentelemetry.io/docs/concepts/signals/traces/ — Span hierarchy, sampling, OTLP export
- Competitor READMEs: Langfuse, LangSmith, Phoenix, Opik, OpenLIT, RagaAI Catalyst, demosmith-mcp — Feature matrices, table stakes analysis

### Secondary (MEDIUM confidence)
- AgentPrism: https://npm.im/@evilmartians/agent-prism-data — Trace visualization library for AI agents (emerging, v0.0.9)
- Playwright Video Recording: https://playwright.dev/docs/videos — Recording configuration, context isolation
- Langfuse Agent Tracing: https://langfuse.com/docs/tracing — Agent-specific tracing patterns
- OpenTelemetry Sampling: Training knowledge — Head-based sampling, trace importance levels

### Tertiary (LOW confidence)
- Verification system gaming patterns: Training knowledge, limited verification — Need to research behavioral testing for demo validation
- Video accessibility standards: Not explicitly researched — Need WCAG for video, caption format research during Phase 5
- Scalability thresholds: Inferred from architecture patterns — Need to establish storage growth triggers for database migration

---
*Research completed: 2026-03-25*
*Ready for roadmap: yes*