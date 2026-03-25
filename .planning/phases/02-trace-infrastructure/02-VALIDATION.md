---
phase: 02
slug: trace-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | {name: 'OpenTelemetry', version: '1.0.0'} |
| **Trace Capture** | `src/traces/traceCapture.ts` |
| - Uses @opentelemetry/sdk-trace-node
            - Supports nested spans via startSpan/endSpan
            - Millisecond precision timestamps via Span API |
            - Produ traces via OTLP HTTP exporter (fallback) |
| **Span Hierarchy** | `src/traces/spanHierarchy.ts` |
            - Trace → Agent Action → Tool Call → LLM Call
            - Tool Call → nested Span (via startSpan)
            - LLM Call → nested Span (via startSpan)
        - Agent Action spans can be parallel
    **Exporters** | `src/traces/exporters/` |
            - OTLP HTTP exporter (primary)
            - Console exporter (fallback for debugging)
            - File exporter (for local development,        **Storage** | `src/traces/storage/` |
            - In-memory storage for traces during execution
            - JSON file export with trace ID in filename
            - Optional file persistence for demo recording
        **Integration Points** | `src/traces/integration.ts` |
            - Used by Phase 3 Observability Interface
            - Used by Phase 4 Video Capture (for action correlation)
            - Used by Phase 5 Claude Code Integration (for trace correlation)
            - Used by Phase 6 Runtime Visualization (for execution trajectory) |
| **Automated Verification** | `src/traces/automatedVerification.ts` |
            - Automated tests using standard testing frameworks
            - Trace capture integration tests
            - Span hierarchy tests
            - Export format tests
            - Timestamp precision tests |
        **Demo Statement** | `src/traces/demoStatement.ts` |
            - Demo statement with trace recording example

        **Behavior Verification** | After each phase, verify:
 behavior was built:
- [ ] Phase 2 creates traces with correct hierarchy
- [ ] Traces include nested spans for LLM, tool, and agent actions
- [ ] Each span has millisecond-precision timestamps
- [ ] Traces can be exported to standard OTLP format

## Manual Testing Checklist

- [ ] Verify trace capture works with `startSpan`/`endSpan`
- [ ] Verify span hierarchy with nested spans
- [ ] Verify OTLP export produces valid JSON
- [ ] Verify timestamp precision in span attributes
- [ ] Run automated tests for trace capture and span hierarchy, export

## Acceptance Criteria

- OpenTelemetry SDK imported correctly
- Trace, Span classes compile without errors
- startSpan/endSpan API works correctly
- OTLP export creates valid JSON output
- All timestamps have millisecond precision
- All tests pass