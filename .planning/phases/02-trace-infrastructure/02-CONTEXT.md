# Phase 2: Trace Infrastructure - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Build OpenTelemetry-compatible trace capture infrastructure with hierarchical spans for agent execution observability.

**Goal:** Agent execution traces can be captured with hierarchical spans for observability

**Success Criteria:**
1. Agent execution produces OpenTelemetry-compatible traces
2. Traces include nested spans for LLM calls, tool calls, and agent actions
3. Each span has millisecond-precision timestamps
4. Traces can be exported to standard OTLP format for downstream tools

**Requirements:** OBS-01

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

**Guidance from prior phases:**
- Phase 1 established log format: JSON Lines with custom levels (DEBUG, INFO, WARN, ERROR, PASS, FAIL)
- Phase 1 established traceability: Every artifact must link to statement_id + timestamp
- OpenTelemetry spans should include these traceability attributes

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `docs/METHODOLOGY.md` — defines verification artifact standards including JSON Lines log format

### Established Patterns
- New project — this phase establishes baseline infrastructure patterns

### Integration Points
- Phase 3 (Observability Interface) will consume traces for visualization
- Phase 4 (Video Capture) may use traces to orchestrate recording
- Phase 5 (Claude Code Integration) will trigger trace capture during agent execution
- Phase 6 (Runtime Visualization) will use trace data for diagrams

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

**Technical hints from requirements:**
- OpenTelemetry SDK for TypeScript/JavaScript
- Span hierarchy: Trace → Agent Action → Tool Call / LLM Call
- OTLP export format for downstream tool compatibility

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase, scope is clear from requirements.

</deferred>