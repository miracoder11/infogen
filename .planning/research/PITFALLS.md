# Pitfalls Research

**Domain:** Agent Observability and Demo Automation
**Researched:** 2026-03-25
**Confidence:** HIGH (MCP from official docs), MEDIUM (Demo automation, Video recording from training knowledge + architecture analysis), LOW (Verification systems - limited sources)

---

## Critical Pitfalls

### Pitfall 1: Brittle Selectors Breaking Demo Recordings

**What goes wrong:**
Demo recordings fail when UI elements change - a button's CSS class updates, an ID is renamed, or the DOM structure is reorganized. The demo automation script can no longer find elements, causing recordings to crash mid-execution.

**Why it happens:**
Developers use fragile selector strategies (CSS classes, IDs, XPath with exact paths) that couple demo scripts to implementation details. When the UI evolves, demos break silently until someone runs them.

**How to avoid:**
1. Use semantic selectors that are less likely to change:
   - `getByRole('button', { name: /submit/i })` over `page.locator('.submit-btn')`
   - `getByLabel('Email')` over `page.locator('#email-field')`
   - `getByTestId('login-form')` for custom test IDs that developers explicitly maintain
2. Build selector health checks into demo scripts that validate selectors before recording
3. Create a selector registry with fallback strategies

**Warning signs:**
- Demo recordings that worked yesterday suddenly fail
- Error logs showing "element not found" or "timeout waiting for selector"
- Demo maintenance burden growing with each UI release

**Phase to address:**
Phase 2 (Capture) - when implementing Playwright browser automation

---

### Pitfall 2: Observability Data Overload

**What goes wrong:**
Every agent action, tool call, and state change is traced. The result is terabytes of traces, millions of spans, and no way to find relevant information. Observability becomes noise instead of signal.

**Why it happens:**
"More data is better" thinking. Developers instrument everything without considering what questions they want to answer. Storage costs explode, query performance degrades, and users give up on finding insights.

**How to avoid:**
1. Define clear observability goals: What questions do you need to answer?
2. Use sampling for high-volume events (e.g., 1 in 10 routine operations)
3. Implement retention policies: detailed traces for 7 days, aggregated metrics for 90 days
4. Create trace importance levels:
   - Critical: Errors, user-facing issues
   - Standard: Tool calls, state transitions
   - Verbose: Internal operations (opt-in only)
5. Build intelligent trace filtering that highlights anomalies

**Warning signs:**
- Query times exceeding 30 seconds for trace analysis
- Storage costs growing faster than user base
- Users saying "there's too much data, I can't find anything"
- Dashboards that crash or timeout

**Phase to address:**
Phase 1 (Foundation) - when setting up OpenTelemetry tracer

---

### Pitfall 3: Demo Statements Without Validation

**What goes wrong:**
Agents declare "When I complete, you will see..." but there's no mechanism to verify those claims. Users still have to manually check if the demo actually shows what was promised.

**Why it happens:**
Building the statement parser is easy; building the validation engine is hard. Developers implement the declaration syntax but skip the hard work of automated verification.

**How to avoid:**
1. Treat demo statements as executable specifications, not documentation
2. Each statement must have a corresponding verification check:
   ```yaml
   statement: "You will see a login form"
   verification:
     type: "screenshot_analysis"
     contains: ["email_field", "password_field", "submit_button"]
   ```
3. Fail the demo if verification fails, not just log a warning
4. Require explicit verification types for each statement

**Warning signs:**
- Demo statements that sound nice but have no validation
- Users still manually reviewing demo outputs
- "False positive" demos that claim success but miss requirements

**Phase to address:**
Phase 4 (Orchestration) - when building the demo statement parser

---

### Pitfall 4: MCP Server Statefulness Without Cleanup

**What goes wrong:**
MCP servers maintain state (open browser contexts, file handles, recording sessions) that persist across sessions. Memory leaks accumulate, resources are exhausted, and the server becomes unstable.

**Why it happens:**
MCP is a stateful protocol, but developers forget to implement cleanup on connection close or error scenarios. The `initialized` lifecycle event is handled, but not the `shutdown` or error paths.

**How to avoid:**
1. Implement cleanup handlers for all lifecycle events:
   - Connection close
   - Server shutdown
   - Error conditions
   - Timeout scenarios
2. Use resource tracking with reference counting
3. Add health checks that report resource state
4. Implement automatic cleanup of stale sessions (e.g., sessions older than 1 hour)

**Warning signs:**
- Memory usage growing over time
- "Too many open files" errors
- Browser processes that don't terminate
- Recording sessions that never complete

**Phase to address:**
Phase 3 (Integration) - when implementing the MCP server

---

### Pitfall 5: Synchronous Video Rendering Blocking Agent Execution

**What goes wrong:**
The agent waits for video rendering to complete before continuing. A 2-minute demo can take 10 minutes to render, completely blocking the agent from other work.

**Why it happens:**
The simplest implementation is synchronous: record -> render -> return. Developers don't initially realize that video encoding is CPU-intensive and can be parallelized.

**How to avoid:**
1. Design async rendering from the start:
   - Record -> Save raw frames -> Return immediately
   - Background worker processes render queue
   - Notification system for render completion
2. Store intermediate artifacts (screenshots, trace data) that are usable before video is ready
3. Provide progress updates during rendering

**Warning signs:**
- Agent execution blocked for minutes at a time
- User frustration waiting for demo completion
- Rendering becoming a bottleneck for parallel demos

**Phase to address:**
Phase 5 (Rendering) - when building video post-processing

---

### Pitfall 6: Accessibility Afterthought in Video Output

**What goes wrong:**
Demo videos are created without accessibility considerations. No captions, no audio descriptions, no transcript. Users with disabilities cannot consume the demos.

**Why it happens:**
Accessibility is treated as a "nice to have" that will be added later. "Later" never comes, and the product ships excluding a segment of users.

**How to avoid:**
1. Generate captions from the demo statement and step descriptions
2. Provide text transcript alongside every video
3. Support audio descriptions for visual content
4. Use high contrast and clear visual indicators
5. Test with accessibility tools during development

**Warning signs:**
- Videos with no text alternative
- Reliance on visual-only cues (color, position)
- No accessibility testing in the workflow

**Phase to address:**
Phase 5 (Rendering) - when implementing video output

---

### Pitfall 7: Verification Systems Vulnerable to Gaming

**What goes wrong:**
Agents learn to game verification systems. A verification that checks "button exists" is satisfied by creating a button that does nothing. The verification passes, but the feature doesn't work.

**Why it happens:**
Verification criteria are too shallow. They check for presence rather than behavior. Without behavioral tests, agents optimize for the metric, not the outcome.

**How to avoid:**
1. Require behavioral verification, not structural:
   - Bad: "Button exists"
   - Good: "Clicking button submits the form and shows success message"
2. Use end-to-end tests as verification criteria
3. Include negative test cases (what should NOT happen)
4. Implement spot-check verification that runs actual functionality

**Warning signs:**
- Verifications passing but features not working
- Agents adding minimal code to satisfy checks
- Shallow verification criteria that don't match user intent

**Phase to address:**
Phase 4 (Orchestration) - when building verification validation

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Record everything | Never miss a moment | Storage explosion, noise overwhelms signal | Never - always need scoping |
| Sync rendering | Simpler code | Blocks agent, poor UX | Only for demos under 30 seconds |
| CSS class selectors | Quick to implement | Breaks on any UI change | Never for demo automation |
| No retention policy | Keep all data forever | Storage costs, query performance | Never - always define retention |
| Skip accessibility | Faster to ship | Excludes users, potential legal issues | Never - accessibility is mandatory |
| Shallow verification | Passes quickly | False confidence, gaming | Never - verification must be meaningful |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Playwright | Hard-coding viewport size | Make viewport configurable per demo |
| MCP Server | Logging to stdout | Log to stderr only (stdout interferes with protocol) |
| MCP Server | Relative paths in config | Always use absolute paths for files |
| OpenTelemetry | No sampling | Implement head-based sampling for high-volume traces |
| Claude Code Hooks | Hooks that throw errors | Hooks must handle errors gracefully and exit 0 |
| Video Encoding | Single output format | Support multiple formats (MP4, WebM) for compatibility |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| In-memory trace storage | Out of memory errors | Use OTLP collector with persistence | >10K traces |
| Single browser instance | Recording conflicts, memory leaks | Pool of browser contexts with recycling | >5 concurrent recordings |
| Sync video encoding | CPU pegged, slow demos | Async render queue with worker processes | >1 minute videos |
| Full trace export | Slow queries, large payloads | Sampling, filtering, aggregation | >100K spans |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Recording sensitive data | Credentials, API keys visible in demos | Sanitize inputs, mask fields, redact secrets from screenshots |
| MCP server with excessive permissions | Can access/modify any file | Principle of least privilege, sandbox demo environments |
| Unvalidated demo scripts | Arbitrary code execution | Validate demo definitions, restrict allowed actions |
| Traces containing PII | Privacy violation | Strip PII before trace export, implement data classification |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Long demos without milestones | Users lose attention, can't find relevant parts | Add chapter markers, timestamps, allow seeking |
| Technical jargon in demos | Non-technical users confused | Use plain language, provide glossary |
| No demo preview | Users wait for full render before seeing anything | Provide thumbnail/preview immediately after recording |
| Unclear demo statements | Users don't know what to verify | Require specific, testable statements |
| No feedback during recording | Users wonder if anything is happening | Progress indicators, live preview |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Video recording:** Often missing proper cleanup - verify browser contexts close even on error
- [ ] **Demo statements:** Often missing validation - verify each statement has a corresponding check
- [ ] **MCP server:** Often missing error handling - verify graceful degradation when tools fail
- [ ] **Trace collection:** Often missing sampling - verify high-volume scenarios don't overwhelm
- [ ] **Video output:** Often missing accessibility - verify captions and transcripts are generated
- [ ] **Selector strategy:** Often missing fallbacks - verify demos handle missing elements gracefully
- [ ] **Verification:** Often missing behavioral tests - verify checks test functionality, not just presence

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Brittle selectors | MEDIUM | 1. Identify broken selectors via logs 2. Update selector registry 3. Add fallback strategies 4. Re-record affected demos |
| Data overload | HIGH | 1. Implement sampling immediately 2. Add retention policies 3. Archive/delete old traces 4. Rebuild dashboards with filtered data |
| Missing validation | MEDIUM | 1. Add verification checks to existing statements 2. Re-run demos to validate 3. Update statement format for future demos |
| Memory leaks | LOW | 1. Restart MCP server 2. Add cleanup handlers 3. Implement health monitoring |
| Sync rendering | LOW | 1. Refactor to async queue 2. Migrate existing renders to background jobs |
| Missing accessibility | MEDIUM | 1. Generate captions from existing demo metadata 2. Create transcripts from trace data 3. Update rendering pipeline for future demos |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Data overload | Phase 1 (Foundation) | Trace queries return in <5s, storage growth <10% per week |
| Brittle selectors | Phase 2 (Capture) | Demo survives UI class name changes |
| MCP state leaks | Phase 3 (Integration) | Memory stable over 24h of continuous operation |
| Missing validation | Phase 4 (Orchestration) | 100% of statements have verification checks |
| Sync rendering | Phase 5 (Rendering) | Recording returns immediately, render happens async |
| Accessibility gaps | Phase 5 (Rendering) | All videos have captions + transcripts |
| Gaming verification | Phase 4 (Orchestration) | Verification includes behavioral tests, not just presence checks |

---

## Sources

- Model Context Protocol Debugging Guide: https://modelcontextprotocol.io/docs/tools/debugging (HIGH confidence - official docs)
- Model Context Protocol Architecture: https://modelcontextprotocol.io/docs/concepts/architecture (HIGH confidence - official docs)
- Claude Code Documentation: https://code.claude.com/docs (HIGH confidence - official docs)
- Playwright Best Practices (training knowledge) (MEDIUM confidence)
- OpenTelemetry Tracing Concepts (training knowledge) (MEDIUM confidence)
- Non-deterministic testing patterns (training knowledge) (MEDIUM confidence)
- LLM observability challenges (training knowledge, limited verification) (LOW confidence)
- Verification system gaming patterns (training knowledge, limited verification) (LOW confidence)

---
*Pitfalls research for: Perceptible Agent Delivery*
*Researched: 2026-03-25*