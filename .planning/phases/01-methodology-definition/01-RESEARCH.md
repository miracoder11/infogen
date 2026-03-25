# Phase 1: Methodology Definition - Research

**Researched:** 2026-03-25
**Domain:** Methodology Design for Perceptible Agent Delivery
**Confidence:** HIGH

## Summary

Phase 1 defines the conceptual foundation for "Perceptible Agent Delivery" - establishing the demo statement format, deliverable type mappings, and verification artifact standards. This is a documentation-only phase with no code implementation. The methodology draws from BDD (Behavior-Driven Development) principles, particularly the Given-When-Then pattern, adapted for agent-delivered outcomes. Key inspirations include BSWEN's Demo Statement pattern and Cursor Cloud Agents' video demo approach.

**Primary recommendation:** Create a single `docs/METHODOLOGY.md` document with structured sections for Demo Statement syntax (YAML-based), four deliverable type definitions with presentation mappings, and verification artifact specifications. Include 2-3 concrete examples per type in Chinese with English summaries.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Demo Statement 格式
- 核心结构：`当完成时，你会看到[可观察结果]` + 验证标准列表
- 类型关联：在 Statement 中声明类型标签（如 `type: code/framework`）
- 验证标准表达：行为式断言（"可以点击登录按钮"、"跳转到 dashboard"）
- 存储位置：Markdown 文件（如 `DELIVERY.md`）— 可读 + 版本控制

#### 交付物类型映射
- 类型体系：固定4种类型 + 自定义扩展槽
- 展示形式：主展示形式 + 可选辅助形式（如：视频(主)+流程图(辅)）
- 类型判断：Agent 声明 + 人工确认
- 展示形式优先级：视频演示 > 运行时可视化 > 验证产物 > 文档

#### 验证产物标准
- 截图格式：PNG + 1440px 宽度 + 语义化命名（如 `login-success-001.png`）
- 日志格式：结构化 JSON + 人类可读摘要
- 测试结果格式：JUnit XML + HTML 报告
- 可追溯性：每个产物关联 Demo Statement ID + 时间戳

#### 方法论文档形式
- 文档位置：`docs/METHODOLOGY.md`
- 文档语言：中英双语（中文主文档 + 英文摘要）
- 示例要求：每种类型提供 2-3 个完整示例
- 版本管理：与 milestone 版本绑定

### Claude's Discretion

实现细节（如具体模板语法、JSON schema 定义）由 Claude 在规划阶段确定。

### Deferred Ideas (OUT OF SCOPE)

None - 讨论保持在 phase 范围内

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| METH-01 | 定义「Demo Statement」声明格式 - 格式: "当我完成时，你会看到[可观察的结果]" + 验证标准列表 + 与交付物类型关联 | BDD/Gherkin patterns adapted for agent context; YAML frontmatter format for structured metadata |
| METH-02 | 定义四种交付物类型与展示形式映射规则 - 代码/框架、方法论/Skill、测试/质量、变更/重构 | Software deliverable classification taxonomy; presentation format hierarchy |
| METH-03 | 定义验证产物标准 - 截图格式与命名规范、日志格式、测试结果格式、可追溯性要求 | JUnit XML specification; JSON Lines logging standard; semantic file naming conventions |

</phase_requirements>

## Standard Stack

### Core Documentation Standards

| Standard | Version/Source | Purpose | Why Standard |
|----------|----------------|---------|--------------|
| YAML 1.2 | yaml.org spec | Demo Statement metadata | Human-readable, machine-parseable, widely supported |
| Markdown | CommonMark spec | Primary document format | Version control friendly, universally readable |
| JUnit XML | Ant JUnit format | Test result interchange | CI/CD compatibility, tool ecosystem support |
| JSON Lines | jsonlines.org | Structured logging | Stream-friendly, one-record-per-line, append-safe |

### Supporting Standards

| Standard | Use Case | Notes |
|----------|----------|-------|
| ISO 8601 | Timestamps in artifacts | `2026-03-25T14:30:00.000Z` format |
| Semantic Versioning | Methodology version binding | Matches milestone versions |
| UUID v4 | Statement IDs and artifact correlation | Unique, collision-free identifiers |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| YAML metadata | TOML | TOML is stricter but less familiar to most developers |
| Markdown | AsciiDoc | AsciiDoc more powerful but steeper learning curve |
| JUnit XML | Test Anything Protocol (TAP) | TAP simpler but less tool support |
| JSON Lines | NDJSON | Same format, different name - JSON Lines is the canonical term |

## Architecture Patterns

### Recommended Document Structure

```
docs/
├── METHODOLOGY.md          # Primary methodology document (bilingual)
└── examples/               # Standalone example files (optional)
    ├── demo-statement-code.yaml
    ├── demo-statement-test.yaml
    └── ...
```

### Pattern 1: Demo Statement Format

**What:** A structured declaration format that combines human-readable description with machine-parseable metadata.

**When to use:** Every agent deliverable should have an associated Demo Statement.

**Example:**
```yaml
# DELIVERY.md entry
---
statement_id: "ds-20260325-001"
type: "code/framework"
created: "2026-03-25T14:30:00.000Z"
milestone: "v1.0.0"
---

## Demo Statement

当完成时，你会看到：

1. 一个可运行的登录页面，包含邮箱和密码输入框
2. 点击登录按钮后，成功跳转到 dashboard
3. 登录失败时显示错误提示

## 验证标准

- [ ] 页面加载完成，表单元素可见
- [ ] 输入有效凭据后登录按钮可点击
- [ ] 登录成功后 URL 变更为 `/dashboard`
- [ ] 登录失败时显示红色错误提示

## 展示形式

- 主：视频演示（录屏展示登录流程）
- 辅：运行时可视化（数据流图）
```

**Source:** Adapted from BSWEN Demo Statement pattern and BDD Gherkin syntax

### Pattern 2: Deliverable Type Mapping

**What:** Classification system for agent deliverables with recommended presentation forms.

**When to use:** Agent declares deliverable type; methodology provides presentation guidance.

**Four Core Types:**

| Type | Primary Presentation | Secondary Presentation | Example Deliverable |
|------|---------------------|------------------------|---------------------|
| `code/framework` | 视频演示 | 运行时可视化 | React component, API endpoint |
| `methodology/skill` | 演示使用 | 可执行文档 | Claude Code skill, workflow definition |
| `test/quality` | 覆盖率可视化 | 验证产物 | Test suite, E2E test results |
| `change/refactor` | 对比图 | 影响范围 | Migration script, config change |

**Extension Slot:**
```yaml
# Custom type example
type: "custom/data-pipeline"
presentation:
  primary: "运行时可视化"
  secondary: "验证产物"
  rationale: "Data pipelines benefit most from flow visualization"
```

### Pattern 3: Verification Artifact Standards

**What:** Standardized formats for artifacts that prove deliverable completion.

**When to use:** Generated automatically during agent execution; referenced in Demo Statement verification.

**Screenshot Naming Convention:**
```
{statement_id}-{action}-{sequence}-{timestamp}.png

Examples:
ds-20260325-001-login-form-001-20260325T143000Z.png
ds-20260325-001-dashboard-view-002-20260325T143015Z.png
```

**Structured Log Format (JSON Lines):**
```json
{"timestamp":"2026-03-25T14:30:00.000Z","level":"INFO","statement_id":"ds-20260325-001","event":"step_start","message":"Navigating to login page","metadata":{"url":"https://example.com/login"}}
{"timestamp":"2026-03-25T14:30:05.123Z","level":"INFO","statement_id":"ds-20260325-001","event":"screenshot","message":"Login form visible","metadata":{"file":"ds-20260325-001-login-form-001-20260325T143000Z.png"}}
{"timestamp":"2026-03-25T14:30:10.456Z","level":"PASS","statement_id":"ds-20260325-001","event":"verification","message":"Login button clickable","metadata":{"selector":"button[type=submit]"}}
```

**JUnit XML Format:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="ds-20260325-001" tests="4" failures="0" errors="0" time="15.5" timestamp="2026-03-25T14:30:00">
  <testcase name="页面加载完成，表单元素可见" classname="verification" time="2.1"/>
  <testcase name="输入有效凭据后登录按钮可点击" classname="verification" time="3.2"/>
  <testcase name="登录成功后 URL 变更为 /dashboard" classname="verification" time="5.1"/>
  <testcase name="登录失败时显示红色错误提示" classname="verification" time="5.1"/>
</testsuite>
```

### Anti-Patterns to Avoid

- **Vague Demo Statements:** "You will see something working" - too ambiguous to verify. Instead: "You will see a login form with email and password fields, and clicking submit navigates to `/dashboard`."

- **Type-Statement Mismatch:** Declaring `type: test/quality` but showing code changes. The type must match the actual deliverable.

- **Unverifiable Criteria:** "The UI looks good" - subjective. Instead: "The UI matches the Figma design at 1440px viewport width."

- **Missing Traceability:** Screenshots without statement_id reference. Every artifact must link back to its originating Demo Statement.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Demo Statement parsing | Custom parser | YAML parser (js-yaml, PyYAML) | Mature, spec-compliant, error handling |
| Test result format | Custom XML | JUnit XML schema | CI/CD tool compatibility |
| Log aggregation | Custom log format | JSON Lines + standard logging library | Stream-friendly, tool support (jq, Elasticsearch) |
| Statement ID generation | Custom ID scheme | UUID v4 | Collision-free, no coordination needed |

**Key insight:** Standard formats enable ecosystem integration. JUnit XML works with Jenkins, GitHub Actions, GitLab CI. JSON Lines works with jq, Elasticsearch, Logstash. YAML frontmatter works with static site generators.

## Common Pitfalls

### Pitfall 1: Overly Abstract Verification Criteria

**What goes wrong:** Verification criteria are too high-level to actually test. "The feature works correctly" cannot be automatically verified.

**Why it happens:** Developers think at feature level, not behavior level. Writing concrete criteria requires thinking through exact user interactions.

**How to avoid:**
1. Use behavioral assertions: "Clicking X produces Y"
2. Reference specific UI elements: "The button with text 'Submit'"
3. Include expected state changes: "URL changes from /login to /dashboard"
4. Define measurable thresholds: "Page loads in under 3 seconds"

**Warning signs:** Criteria that would require human judgment to verify; phrases like "appropriately", "correctly", "properly"

### Pitfall 2: Type System Rigidity

**What goes wrong:** Four fixed types don't cover all deliverables. Agents force-fit into wrong types, losing clarity.

**Why it happens:** Starting with a closed type system seems simpler. But agent deliverables are diverse.

**How to avoid:**
1. Include extension slot in methodology: `type: custom/{name}`
2. Require rationale for custom types
3. Document common custom types in methodology appendix
4. Periodically review custom types for promotion to core

**Warning signs:** Agents using `code/framework` for documentation; type doesn't match presentation form

### Pitfall 3: Artifact Naming Without Traceability

**What goes wrong:** Screenshots and logs are generated with generic names like `screenshot1.png`. Later, it's impossible to know which Demo Statement they belong to.

**Why it happens:** Simplicity bias - `screenshot1.png` is easier to type than `ds-20260325-001-login-form-001.png`.

**How to avoid:**
1. Enforce naming convention from methodology definition
2. Include statement_id in every artifact filename
3. Include timestamp for ordering
4. Use semantic action description for readability

**Warning signs:** Artifact directories with `img001.png`, `img002.png`; inability to trace artifacts back to statements

### Pitfall 4: Bilingual Documentation Drift

**What goes wrong:** Chinese primary document and English summary diverge over time. Users reading different languages get different information.

**Why it happens:** Maintaining two language versions is extra work. Updates often applied to only one version.

**How to avoid:**
1. Single source of truth in Chinese
2. English as abbreviated summary (not full translation)
3. Clear annotation: "English: Summary only - see Chinese for full details"
4. Version both sections together

**Warning signs:** English section has details not in Chinese; versions out of sync

## Code Examples

### Demo Statement Template (YAML)

```yaml
# Template for Demo Statement entries in DELIVERY.md
---
statement_id: "ds-{date}-{sequence}"  # e.g., ds-20260325-001
type: "{category}/{subcategory}"       # One of four core types or custom/*
created: "{ISO8601 timestamp}"
milestone: "{version}"
status: "pending|in_progress|verified|failed"
---

## Demo Statement

当完成时，你会看到：
{list of observable outcomes, numbered}

## 验证标准

- [ ] {behavioral assertion 1}
- [ ] {behavioral assertion 2}
- [ ] {behavioral assertion 3}

## 展示形式

- 主：{primary presentation type}
- 辅：{secondary presentation type}

## 验证产物

- 截图：{screenshot paths with statement_id prefix}
- 日志：{log file path}
- 测试：{test result path}
```

### Verification Artifact JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Verification Artifact",
  "type": "object",
  "required": ["statement_id", "type", "timestamp", "path"],
  "properties": {
    "statement_id": {
      "type": "string",
      "pattern": "^ds-\\d{8}-\\d{3}$"
    },
    "type": {
      "type": "string",
      "enum": ["screenshot", "log", "test_result", "video", "diagram"]
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "path": {
      "type": "string"
    },
    "metadata": {
      "type": "object"
    }
  }
}
```

### Structured Log Entry Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Demo Execution Log Entry",
  "type": "object",
  "required": ["timestamp", "level", "statement_id", "event"],
  "properties": {
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "level": {
      "type": "string",
      "enum": ["DEBUG", "INFO", "WARN", "ERROR", "PASS", "FAIL"]
    },
    "statement_id": {
      "type": "string",
      "pattern": "^ds-\\d{8}-\\d{3}$"
    },
    "event": {
      "type": "string"
    },
    "message": {
      "type": "string"
    },
    "metadata": {
      "type": "object"
    }
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Free-text deliverable descriptions | Structured Demo Statements with verification criteria | Phase 1 (this phase) | Machine-parseable, automatically verifiable |
| Ad-hoc artifact naming | Semantic naming with traceability | Phase 1 (this phase) | Artifacts link back to statements |
| Single presentation form per type | Primary + secondary forms | Phase 1 (this phase) | Flexibility for different audiences |
| Unstructured test output | JUnit XML standard | Industry standard | CI/CD integration |

**Deprecated/outdated:**
- TAP (Test Anything Protocol): Simpler but less ecosystem support than JUnit XML
- Plain text logs: Harder to parse and query than JSON Lines

## Open Questions

1. **Custom type governance:**
   - What we know: Extension slot exists for `custom/*` types
   - What's unclear: Process for promoting custom types to core types
   - Recommendation: Document in methodology appendix; review custom types at each milestone

2. **Verification depth:**
   - What we know: Behavioral assertions are required
   - What's unclear: How deep should nested verifications go (e.g., "button is clickable" vs "button triggers API call that returns 200")
   - Recommendation: Start with user-visible behaviors; deeper verification is optional

3. **Screenshot storage:**
   - What we know: Screenshots stored as PNG files with semantic naming
   - What's unclear: Should screenshots be stored in git (large files) or external storage
   - Recommendation: Git LFS or external storage for v2; git for small demos in v1

## Environment Availability

Step 2.6: SKIPPED (no external dependencies - this is a documentation-only phase)

## Validation Architecture

Step 4: SKIPPED (no test infrastructure needed - this is a documentation-only phase with no executable code)

Validation for this phase is human review: The methodology document must be reviewed by at least one developer who can successfully write a Demo Statement following the defined format without additional guidance.

## Sources

### Primary (HIGH confidence)
- PROJECT.md - Project definition, deliverable type mapping table, demo statement concept
- CONTEXT.md - User decisions locked for this phase
- BDD/Gherkin Reference - Training knowledge of Given-When-Then pattern (adapted for agent context)
- JUnit XML format - Industry standard for test result interchange
- JSON Lines (jsonlines.org) - Standard for structured streaming logs

### Secondary (MEDIUM confidence)
- YAML 1.2 Specification - Standard for human-readable configuration
- Semantic Versioning (semver.org) - Standard for version binding
- UUID v4 - Standard for unique identifiers

### Tertiary (LOW confidence)
- BSWEN Demo Statement pattern - Referenced in PROJECT.md but not directly accessible
- Cursor Cloud Agents video demo - Referenced as inspiration, not directly documented

## Metadata

**Confidence breakdown:**
- Standard formats (YAML, JSON Lines, JUnit XML): HIGH - Industry standards
- Demo Statement format: HIGH - Derived from BDD patterns with project-specific adaptation
- Deliverable type mapping: HIGH - Defined in PROJECT.md and CONTEXT.md
- Verification artifact standards: HIGH - Industry standards with project-specific naming convention
- Pitfalls: MEDIUM - Based on methodology design patterns and common documentation issues

**Research date:** 2026-03-25
**Valid until:** 30 days (methodology definitions are stable, but may evolve with project learnings)