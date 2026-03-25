# Feature Research

**Domain:** Agent Observability and Demo Automation
**Researched:** 2026-03-25
**Confidence:** HIGH (based on official documentation and GitHub sources)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Trace/Session Capture** | Core functionality - without traces, nothing to observe | MEDIUM | Langfuse, LangSmith, Phoenix, Opik all have this. OpenTelemetry-based instrumentation is standard. |
| **Hierarchical Spans** | Users need to see nested execution (LLM calls, tool calls, agent actions) | MEDIUM | All major platforms support spans with parent-child relationships. |
| **Timeline View** | Visual representation of execution order and timing is essential for debugging | MEDIUM | Langfuse, Phoenix, Opik all provide timeline visualization. |
| **Input/Output Inspection** | Users need to see what went into each step and what came out | LOW | Basic but essential - all platforms show prompt/completion pairs. |
| **Token/Cost Tracking** | Budget awareness is critical for LLM applications | MEDIUM | All platforms track tokens; cost estimation varies in accuracy. |
| **Error/Exception Display** | Debugging requires visibility into failures | LOW | Stack traces, error messages, timestamps are standard. |
| **Session Filtering** | Finding specific traces among thousands requires search capabilities | MEDIUM | Filter by user, model, time range, status, etc. |
| **Prompt/Response Visualization** | Users need readable display of LLM interactions | LOW | Markdown rendering, syntax highlighting for code. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Agent Execution Graph** | Visual DAG showing agent workflow, tool calls, decision branches | HIGH | RagaAI Catalyst has "execution graph view". Differentiator for multi-agent systems. |
| **LLM-as-Judge Evaluation** | Automated quality scoring using LLMs (hallucination, relevance, toxicity) | HIGH | Opik, Phoenix, Langfuse all have this. Key for production quality gates. |
| **Prompt Versioning and Management** | Track prompt changes, A/B test, rollback | MEDIUM | Langfuse, Phoenix, Opik have prompt management. Reduces prompt-related bugs. |
| **Dataset and Experiment Tracking** | Create test sets, run evaluations, compare results across runs | HIGH | Opik, Langfuse, Phoenix support datasets. Critical for systematic improvement. |
| **Auto-Generated Video Demos** | Transform execution traces into shareable demo videos | HIGH | demosmith-mcp, demo-machine. Unique differentiator for this project's domain. |
| **Interactive Replay** | Step through execution like a debugger, with pausing and inspection | HIGH | Playwright trace format supports this. More engaging than static logs. |
| **TTS Narration** | AI-generated voiceover explaining what is happening | MEDIUM | demosmith-mcp supports this. Increases accessibility and engagement. |
| **Multi-Language Support** | Documentation/narration in multiple languages | MEDIUM | demosmith-mcp supports English and Chinese. Important for global teams. |
| **Real-Time Streaming** | Watch execution as it happens, not just post-hoc | HIGH | Production monitoring feature. Langfuse and Opik support high-volume streaming. |
| **Playground Integration** | Iterate on prompts directly from trace view | MEDIUM | Langfuse, Phoenix, Opik have playground. Shortens feedback loop. |
| **CI/CD Integration** | Run evaluations in pipelines, fail on quality thresholds | MEDIUM | Opik has PyTest integration. Critical for production readiness. |
| **Guardrails and Safety Rules** | Automated content filtering, PII detection, safety checks | HIGH | OpenLIT, Opik have guardrails. Essential for enterprise deployments. |
| **Demo Declaration Method** | Agent declares what observable output it will produce | MEDIUM | From PROJECT.md context. Unique to this project's methodology. |
| **Before/After Comparison** | Visual diff for changes (code, config, behavior) | MEDIUM | Valuable for change verification. Not commonly seen in observability tools. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Real-Time Everything** | Users want immediate feedback on all operations | Creates massive infrastructure complexity, high costs, often unnecessary for debugging | Sample-based streaming, configurable latency tiers |
| **Full Video Recording of All Sessions** | Complete audit trail seems valuable | Storage costs explode, privacy concerns, rarely watched in full | Event-based capture, highlight extraction, on-demand recording |
| **AI-Generated Summaries for Every Trace** | Quick understanding without reading details | Often inaccurate, adds latency and cost, creates trust issues | Structured summaries for key events, user-triggered summarization |
| **Automated Fix Suggestions** | AI debugging seems helpful | Can be wrong, creates false confidence, may mask root causes | Highlight anomalies, provide context, let humans diagnose |
| **Unlimited Retention** | Keep all data forever for compliance | Storage costs, privacy regulations, data becomes stale | Tiered retention, cold storage, configurable policies |
| **Complex Role-Based Access Control** | Enterprise needs granular permissions | Over-engineering for most use cases, slows development | Simple project-level access, admin/user roles |

## Feature Dependencies

```
Trace Capture
    └──requires──> Instrumentation/SDK
                       └──requires──> OpenTelemetry Setup

Video Demo Generation
    └──requires──> Trace Data
    └──requires──> Browser Automation (Playwright/Puppeteer)
                       └──requires──> Element Selection Strategy

LLM-as-Judge Evaluation
    └──requires──> Trace Data
    └──requires──> LLM API Access
                       └──requires──> Cost/Budget Management

Agent Execution Graph
    └──requires──> Hierarchical Spans
    └──requires──> Span Relationships Metadata
    └──enhances──> Multi-Agent Debugging

Dataset and Experiments
    └──requires──> Trace Storage
    └──requires──> Evaluation Metrics
                       └──requires──> LLM-as-Judge or Human Labels

Demo Declaration (Methodology)
    └──enhances──> Verification Automation
    └──requires──> Deliverable Type Classification

TTS Narration
    └──conflicts──> Real-Time Requirements (adds latency)
    └──requires──> Text Extraction from Trace
```

### Dependency Notes

- **Video Demo Generation requires Trace Data:** Without structured traces, there is no content to visualize. Must capture enough context (timestamps, element refs, actions) to reconstruct the narrative.
- **Agent Execution Graph requires Hierarchical Spans:** Flat traces cannot show agent decision trees. Must instrument at agent/tool/LLM granularity.
- **LLM-as-Judge Evaluation requires Cost Management:** Running evaluations on every trace is expensive. Need budget controls and sampling strategies.
- **Demo Declaration enhances Verification Automation:** Declaring expected outputs upfront enables automated verification without human review.
- **TTS Narration conflicts with Real-Time Requirements:** Generating narration adds 1-5 seconds latency. Acceptable for post-hoc demos, not for live streaming.

## MVP Definition

### Launch With (v1)

Minimum viable product - what is needed to validate the concept.

- [x] **Trace Capture with Hierarchical Spans** - Foundation for everything else. Use OpenTelemetry.
- [x] **Timeline View** - Visual debugging is the core value proposition.
- [x] **Input/Output Inspection** - Users need to see what happened.
- [x] **Session Filtering** - Basic search by project, time, status.
- [x] **Basic Video Generation** - Single differentiator: transform trace to video.
- [x] **Demo Declaration** - Unique methodology feature. "When complete, you will see..."

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Agent Execution Graph** - Once timeline is validated, add DAG visualization.
- [ ] **TTS Narration** - Enhances video demos after basic video works.
- [ ] **Before/After Comparison** - Valuable for change verification.
- [ ] **LLM-as-Judge Evaluation** - Production quality gates.
- [ ] **Interactive Replay** - Step-through debugging experience.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Real-Time Streaming** - Requires significant infrastructure investment.
- [ ] **CI/CD Integration** - Needs stable API and evaluation framework first.
- [ ] **Guardrails and Safety Rules** - Enterprise feature, not needed for initial validation.
- [ ] **Multi-Agent Platform Support** - Expand beyond Claude Code after core validation.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Trace Capture | HIGH | MEDIUM | P1 |
| Timeline View | HIGH | MEDIUM | P1 |
| Input/Output Inspection | HIGH | LOW | P1 |
| Session Filtering | HIGH | MEDIUM | P1 |
| Video Demo Generation | HIGH | HIGH | P1 |
| Demo Declaration | MEDIUM | LOW | P1 |
| Agent Execution Graph | HIGH | HIGH | P2 |
| TTS Narration | MEDIUM | MEDIUM | P2 |
| Before/After Comparison | MEDIUM | MEDIUM | P2 |
| LLM-as-Judge Evaluation | HIGH | HIGH | P2 |
| Interactive Replay | MEDIUM | HIGH | P2 |
| Prompt Versioning | MEDIUM | MEDIUM | P3 |
| Dataset and Experiments | MEDIUM | HIGH | P3 |
| Real-Time Streaming | MEDIUM | HIGH | P3 |
| CI/CD Integration | MEDIUM | MEDIUM | P3 |
| Guardrails and Safety | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | Langfuse | LangSmith | Arize Phoenix | Opik | OpenLIT | demosmith-mcp |
|---------|----------|-----------|---------------|------|---------|---------------|
| Trace Capture | Yes (OpenTelemetry) | Yes | Yes (OpenTelemetry) | Yes | Yes (OpenTelemetry) | No |
| Hierarchical Spans | Yes | Yes | Yes | Yes | Yes | No |
| Timeline View | Yes | Yes | Yes | Yes | Yes | No |
| Agent Execution Graph | No | Limited | No | Limited | No | No |
| LLM-as-Judge Evaluation | Yes | Yes | Yes | Yes | Yes (11 types) | No |
| Prompt Management | Yes | Yes | Yes | Yes | Yes | No |
| Dataset and Experiments | Yes | Yes | Yes | Yes | No | No |
| Playground | Yes | Yes | Yes | Yes | Yes | No |
| Video Demo Generation | No | No | No | No | No | **Yes** |
| TTS Narration | No | No | No | No | No | **Yes** |
| Interactive Replay | No | No | No | No | No | Yes (Playwright trace) |
| Multi-Language | No | No | No | No | No | Yes (EN/ZH) |
| MCP Integration | No | No | Yes | No | No | **Yes** |
| CI/CD Integration | Limited | Yes | Limited | Yes (PyTest) | No | No |
| Guardrails | No | No | No | Yes | Yes | No |
| Open Source | Yes (MIT) | No | Yes (MPL 2.0) | Yes (Apache 2.0) | Yes (Apache 2.0) | Yes |

### Key Insights from Competitor Analysis

1. **Video Demo Generation is the Gap:** No major observability platform offers video demo generation. demosmith-mcp is the only tool combining MCP with demo creation.

2. **MCP Integration is Emerging:** Arize Phoenix and demosmith-mcp have MCP support. This is the future of AI agent tooling.

3. **Agent Execution Graphs are Rare:** Only RagaAI Catalyst explicitly mentions "execution graph view." This is an underserved area.

4. **OpenTelemetry is Standard:** All major platforms use OpenTelemetry for instrumentation. This should be the foundation.

5. **Evaluation is Table Stakes:** LLM-as-Judge is now expected. Hallucination detection, relevance scoring, and moderation are standard.

## Sources

- **Langfuse:** Official GitHub README (https://github.com/langfuse/langfuse) - HIGH confidence
- **LangSmith:** LangSmith SDK README (https://github.com/langchain-ai/langsmith-sdk) - HIGH confidence
- **Arize Phoenix:** Official GitHub README (https://github.com/Arize-ai/phoenix) - HIGH confidence
- **Opik:** Official GitHub README (https://github.com/comet-ml/opik) - HIGH confidence
- **OpenLIT:** Official GitHub README (https://github.com/openlit/openlit) - HIGH confidence
- **RagaAI Catalyst:** Official GitHub README (https://github.com/raga-ai-hub/RagaAI-Catalyst) - HIGH confidence
- **demosmith-mcp:** Official GitHub README (https://github.com/G0d2i11a/demosmith-mcp) - HIGH confidence
- **demo-machine:** GitHub search result (https://github.com/45ck/demo-machine) - MEDIUM confidence (README not accessible)

---
*Feature research for: Agent Observability and Demo Automation*
*Researched: 2026-03-25*