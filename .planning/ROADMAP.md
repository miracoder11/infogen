# Roadmap: Perceptible Agent Delivery (infoGen)

## Overview

This roadmap transforms agent execution into observable, demonstrable outputs. Starting with methodology definition to establish the "demo statement" framework, we build trace infrastructure, visualization interfaces, video capture capabilities, Claude Code integration, and finally runtime visualization. Each phase delivers a complete, verifiable capability that enables human验收 (acceptance) through observation rather than reading.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Methodology Definition** - Define demo statement format, deliverable type mappings, and verification artifact standards
- [ ] **Phase 2: Trace Infrastructure** - Build OpenTelemetry-compatible trace capture with hierarchical spans
- [ ] **Phase 3: Observability Interface** - Create timeline visualization and trace inspection UI
- [ ] **Phase 4: Video Capture** - Implement Playwright-based browser automation and video recording
- [ ] **Phase 5: Claude Code Integration** - Connect perceptible delivery to Claude Code via skills and MCP
- [ ] **Phase 6: Runtime Visualization** - Generate interactive data flow diagrams and execution trajectory views

## Phase Details

### Phase 1: Methodology Definition
**Goal**: Developers understand the demo statement format and deliverable type mappings, enabling consistent declaration of observable outputs
**Depends on**: Nothing (first phase)
**Requirements**: METH-01, METH-02, METH-03
**Success Criteria** (what must be TRUE):
  1. Developer can write a demo statement following the defined format with validation criteria
  2. Developer can map any deliverable type (code, methodology, test, change) to its recommended presentation form
  3. Developer knows what verification artifacts (screenshots, logs, test results) to expect for each deliverable type
**Plans**: 3 plans in 2 waves

Plans:
- [x] 01-01-PLAN.md - Demo Statement format specification (METH-01)
- [x] 01-02-PLAN.md - Deliverable type mapping rules (METH-02)
- [x] 01-03-PLAN.md - Verification artifact standards (METH-03)

### Phase 2: Trace Infrastructure
**Goal**: Agent execution traces can be captured with hierarchical spans for observability
**Depends on**: Phase 1
**Requirements**: OBS-01
**Success Criteria** (what must be TRUE):
  1. Agent execution produces OpenTelemetry-compatible traces
  2. Traces include nested spans for LLM calls, tool calls, and agent actions
  3. Each span has millisecond-precision timestamps
  4. Traces can be exported to standard OTLP format for downstream tools
**Plans**: 4 plans in 3 waves

Plans:
- [ ] 02-01-PLAN.md - Project setup and OpenTelemetry SDK installation (OBS-01)
- [x] 02-02-PLAN.md - Core trace instrumentation and span helpers (OBS-01)
- [x] 02-03-PLAN.md - OTLP exporter and trace storage (OBS-01)
- [x] 02-04-PLAN.md - Test infrastructure and demo example (OBS-01)

### Phase 3: Observability Interface
**Goal**: Users can visualize, inspect, and filter execution traces through an interactive interface
**Depends on**: Phase 2
**Requirements**: OBS-02, OBS-03, OBS-04
**Success Criteria** (what must be TRUE):
  1. User can view traces on a timeline showing execution order and span duration
  2. User can inspect prompt/response content for any span with markdown rendering and syntax highlighting
  3. User can filter traces by project, time range, and status
  4. User can zoom and navigate the timeline view for detailed inspection
**Plans**: TBD
**UI hint**: yes

### Phase 4: Video Capture
**Goal**: Users can record agent browser interactions as reproducible video demos
**Depends on**: Phase 2
**Requirements**: VID-01, VID-02, VID-03
**Success Criteria** (what must be TRUE):
  1. User can record browser interactions using Playwright automation with semantic selectors
  2. Recordings produce MP4 video files at configurable resolution with reasonable file size
  3. Recorded videos include timestamp annotations and basic transitions
  4. Recording sessions are isolated (clean browser context per recording)
**Plans**: TBD

### Phase 5: Claude Code Integration
**Goal**: Users can invoke perceptible delivery workflows directly from Claude Code
**Depends on**: Phase 3, Phase 4
**Requirements**: INT-01, INT-02, INT-03
**Success Criteria** (what must be TRUE):
  1. User can trigger demo recording via Claude Code skill with defined trigger conditions
  2. User can declare demo statements through Claude Code commands and have them stored
  3. Verification artifacts (screenshots, logs, test results) are automatically collected during agent execution
  4. User can view collected artifacts after session completion
**Plans**: TBD

### Phase 6: Runtime Visualization
**Goal**: Users can see data flow and execution trajectories as interactive diagrams
**Depends on**: Phase 3
**Requirements**: RUN-01, RUN-02
**Success Criteria** (what must be TRUE):
  1. User can view data flow/control flow diagrams with interactive nodes and edges
  2. User can see step highlighting and current execution position in real-time
  3. Diagram supports zoom, pan, and node selection for exploration
  4. Execution trajectory shows branch paths taken during agent execution
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Methodology Definition | 3/3 | Complete | 2026-03-25 |
| 2. Trace Infrastructure | 0/4 | Not started | - |
| 3. Observability Interface | 0/TBD | Not started | - |
| 4. Video Capture | 0/TBD | Not started | - |
| 5. Claude Code Integration | 0/TBD | Not started | - |
| 6. Runtime Visualization | 0/TBD | Not started | - |
