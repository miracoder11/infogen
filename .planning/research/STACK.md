# Stack Research

**Domain:** Perceptible Agent Delivery (Agent Observability, Demo Automation, Verification)
**Researched:** 2026-03-25
**Confidence:** HIGH for core technologies, MEDIUM for emerging tools (AgentPrism)

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | 6.0.2 | Primary language | Required by MCP SDK; strong typing for complex agent traces; excellent IDE support |
| React | 19.2.4 | UI framework | Most mature ecosystem for visualization; AgentPrism uses React; large component library ecosystem |
| Vite | 8.0.2 | Build tool | Fast HMR for development; simpler than Next.js for tool-focused apps; native ESM support |
| Zod | 4.3.6 | Schema validation | Required peer dependency for MCP SDK v1; runtime type safety for agent data structures |

### Browser Automation & Video Recording

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Playwright | 1.58.2 | Browser automation | Built-in video recording; superior cross-browser support; active maintenance; better video capture than Puppeteer |
| Puppeteer | 24.40.0 | Alternative browser automation | Use if Chrome-only is acceptable; lighter weight than Playwright |
| puppeteer-screen-recorder | 3.0.6 | Video capture for Puppeteer | Required if using Puppeteer; Playwright has built-in video so this is only for Puppeteer |
| fluent-ffmpeg | 0.0.4 | Video processing | Node.js wrapper for FFmpeg; needed for post-processing demo videos (trim, merge, overlay) |
| ffmpeg-static | 5.3.0 | FFmpeg binary | Pre-built FFmpeg binary; simplifies deployment; avoids system dependency issues |

### Agent Observability & Tracing

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Langfuse | 3.38.6 | LLM observability platform | Open source, self-hostable; battle-tested; comprehensive SDK; YC-backed active development; ClickHouse for scalability |
| @evilmartians/agent-prism-data | 0.0.9 | Trace visualization | Purpose-built for AI agent traces; converts OpenTelemetry/Langfuse to UI-ready format; React components available |
| @evilmartians/agent-prism-types | 0.0.9 | Type definitions | Companion types for AgentPrism; semantic convention constants |
| OpenTelemetry API | 1.9.0 | Tracing standard | Industry standard; Langfuse and AgentPrism both support; vendor-neutral instrumentation |
| OpenTelemetry SDK | 2.6.0 | Trace collection | Node.js SDK for OpenTelemetry; enables custom instrumentation |

### MCP (Model Context Protocol)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @modelcontextprotocol/sdk | 1.28.0 | MCP SDK (v1 stable) | Official Anthropic SDK; v1 is production-ready; v2 in development for Q1 2026 |
| @modelcontextprotocol/server | latest | Build MCP servers | Server library for exposing tools/resources/prompts |
| @modelcontextprotocol/client | latest | Build MCP clients | Client library for connecting to MCP servers |

### Claude Code Integration

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @anthropic-ai/claude-code | 2.1.83 | Claude Code CLI | Official package; active development (updated 2026-03-24) |
| @anthropic-ai/sdk | 0.80.0 | Anthropic API SDK | For programmatic Claude integration; typed API client |

### UI Components & Visualization

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @xyflow/react | 12.10.1 | Flow/diagram visualization | Best-in-class for trace/graph visualization; performant for large datasets |
| Tailwind CSS | 4.2.2 | Styling | Rapid UI development; excellent for tool interfaces; v4 is significantly faster |
| Framer Motion | 12.38.0 | Animations | Smooth transitions for demo playback; timeline scrubbing animations |
| Shiki | 4.0.2 | Code highlighting | Accurate syntax highlighting for trace display; supports all languages |
| @radix-ui/react-dialog | 1.1.15 | Accessible UI primitives | Headless components; excellent a11y; customizable styling |
| cmdk | 1.1.1 | Command palette | For quick actions in tool interface; accessible keyboard navigation |
| Zustand | 5.0.12 | State management | Simple, performant; no boilerplate; good for trace data management |

### Data & Infrastructure

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @clickhouse/client | 1.18.2 | High-performance storage | Langfuse uses ClickHouse; query traces efficiently; columnar storage for analytics |
| @tanstack/react-query | 5.95.2 | Data fetching | Caching, background updates; essential for real-time trace data |

## Installation

```bash
# Core Framework
npm install typescript vite zod

# Browser Automation & Video
npm install playwright fluent-ffmpeg ffmpeg-static

# Agent Observability
npm install langfuse @opentelemetry/api @opentelemetry/sdk-trace-node

# MCP SDK
npm install @modelcontextprotocol/sdk

# Claude Integration
npm install @anthropic-ai/sdk

# UI Components
npm install react react-dom @xyflow/react tailwindcss framer-motion shiki zustand
npm install @radix-ui/react-dialog cmdk @tanstack/react-query

# Data Layer (if self-hosting observability)
npm install @clickhouse/client

# Dev Dependencies
npm install -D @types/react @types/node @vitejs/plugin-react
```

## Alternatives Considered

| Category | Recommended | Alternative | When to Use Alternative |
|----------|-------------|-------------|------------------------|
| Browser Automation | Playwright | Puppeteer | Chrome-only workflows; existing Puppeteer codebase; lighter bundle size needed |
| Observability | Langfuse | LangSmith | Already in LangChain ecosystem; enterprise support needed; don't need self-hosting |
| Trace Visualization | AgentPrism | Custom D3.js | Need highly custom visualization; AgentPrism doesn't fit data model |
| Build Tool | Vite | Next.js | Need SSR for marketing pages; want unified web app + tool |
| Video Processing | fluent-ffmpeg | @ffmpeg/ffmpeg | Need browser-side processing; no server component |
| State Management | Zustand | Redux Toolkit | Team already knows Redux; need time-travel debugging |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `playwright-video` (npm package) | Last updated 2020; unmaintained; Playwright has built-in video since v1.0 | Playwright's native `context.on('page')` video recording |
| RecordRTC for browser automation | Client-side only; can't record headless browser | Playwright/Puppeteer native recording |
| Custom trace storage without columnar DB | Agent traces grow rapidly; row-based DBs become slow | ClickHouse (what Langfuse uses) |
| v2 MCP SDK (pre-release) | Currently pre-alpha; not production-ready | MCP SDK v1.x (stable, maintained) |
| OpenAI Traces (proprietary) | Vendor lock-in; can't self-host | OpenTelemetry + Langfuse (open, self-hostable) |

## Stack Patterns by Variant

**If building demo video generation tool:**
- Use Playwright with `browserContext.on('page')` for video capture
- Add `fluent-ffmpeg` for post-processing (trim, captions, overlays)
- Store rendered videos in object storage (S3/R2)
- Why: Playwright's built-in video is simplest path; FFmpeg enables professional output

**If building agent trace visualization:**
- Use Langfuse for trace collection and storage
- Use AgentPrism components for React visualization
- Add @xyflow/react for custom graph views
- Why: Langfuse is battle-tested; AgentPrism handles trace semantics; React Flow for custom needs

**If building Claude Code integration (MCP server):**
- Use `@modelcontextprotocol/sdk` v1.x with Zod schemas
- Follow `stdio` transport for local tools
- Use `streamable-http` transport for networked tools
- Why: stdio is simplest for local tools; HTTP enables remote access

**If building verification artifact generator:**
- Use Playwright for screenshots
- Use `fs-extra` for file operations
- Generate JSON + Markdown outputs
- Why: Screenshots are visual proof; structured data enables tooling

## Version Compatibility Notes

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| MCP SDK v1.x | Zod v4+ | Required peer dependency; schema validation |
| Langfuse | OpenTelemetry 1.x+ | Native integration; automatic span creation |
| Playwright | Node.js 18+ | Requires modern Node for async features |
| React 19 | All recommended UI libs | React 19 RC compatible with ecosystem |
| Vite 8 | TypeScript 6 | Full TS 6 support |

## Sources

- **MCP TypeScript SDK** — https://github.com/modelcontextprotocol/typescript-sdk — Official documentation, v1 stable, v2 pre-alpha
- **Langfuse** — https://github.com/langfuse/langfuse — Open source LLM observability, self-hostable, ClickHouse-backed
- **AgentPrism** — https://npm.im/@evilmartians/agent-prism-data — AI agent trace visualization library, converts OTEL/Langfuse traces
- **Playwright** — https://playwright.dev — Built-in video recording, cross-browser automation
- **npm registry** — Version lookups performed 2026-03-25
- **Model Context Protocol** — https://modelcontextprotocol.io — Protocol specification and SDK docs

---
*Stack research for: Perceptible Agent Delivery*
*Researched: 2026-03-25*