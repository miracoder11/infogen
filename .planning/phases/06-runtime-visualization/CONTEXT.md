# Phase 06: Runtime Visualization Context

## Overview

This phase generates interactive data flow diagrams and execution trajectory views from captured traces. Building on the observability interface (Phase 3), this adds diagrammatic visualization capabilities.

## Dependencies

- **Phase 3: Observability Interface** - React UI, trace API, timeline visualization
- **Phase 2: Trace Infrastructure** - OpenTelemetry spans, trace storage

## Goals

1. Generate data flow diagrams from trace span relationships
2. Show execution trajectory with branch paths
3. Export diagrams as interactive Mermaid format
4. Provide real-time step highlighting during playback

## Key Decisions

| Decision | Rationale |
|----------|-----------|
| Use Mermaid for diagrams | Industry standard, interactive, easy export |
| React component architecture | Consistent with Phase 3 UI |
| Transform spans to nodes/edges | Reuse existing trace data |

## Technical Context

### Existing Infrastructure
- `ui/src/utils/traceTransform.ts` - Span hierarchy transformation
- `ui/src/components/Timeline.tsx` - Timeline visualization
- `src/storage/trace-storage.ts` - Trace data access
- `src/api/server.ts` - REST API server

### New Components
- `DataFlowDiagram.tsx` - Interactive node-edge visualization
- `ExecutionTrajectory.tsx` - Step-by-step execution path
- `MermaidExport.ts` - Mermaid diagram generation
- `DiagramAPI.ts` - Server endpoints for diagram data

## Success Criteria

1. User can view data flow/control flow diagrams with interactive nodes and edges
2. User can see step highlighting and current execution position
3. Diagram supports zoom, pan, and node selection
4. Execution trajectory shows branch paths taken during execution
