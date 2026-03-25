# 可感知交付方法论 (Perceptible Agent Delivery Methodology)

**Version:** v1.0.0
**Status:** Draft
**Last Updated:** 2026-03-25

---

## English Summary

This methodology transforms how humans verify Agent deliverables—from "reading acceptance" to "watching acceptance." It defines a **Demo Statement** format for declaring observable outputs, maps four deliverable types to presentation forms, and establishes verification artifact standards for traceability and automation.

*English: Summary only — see Chinese sections for full specification.*

---

## 1. Demo Statement 格式

### 1.1 核心结构 (Core Structure)

Demo Statement 是 Agent 向人类声明「我将交付什么可观察结果」的核心机制。

**核心模式：**
```
当完成时，你会看到[可观察结果]
```

**三个核心组件：**

1. **statement_id** — 唯一标识符，用于追溯验证产物
2. **type** — 交付物类型标签（如 `code/framework`）
3. **verification criteria** — 验证标准列表，行为式断言

**示例：**
```markdown
当完成时，你会看到一个可点击的登录按钮，
点击后成功跳转到用户 Dashboard 页面。
```

### 1.2 YAML Frontmatter Schema

每个 Demo Statement 必须包含 YAML frontmatter：

```yaml
---
statement_id: ds-20260325-001
type: code/framework
created: 2026-03-25
milestone: v1.0
status: pending
---
```

**必需字段：**

| 字段 | 格式 | 说明 |
|------|------|------|
| `statement_id` | `ds-{YYYYMMDD}-{sequence}` | 唯一标识符，用于追溯验证产物 |
| `type` | 四种核心类型或 `custom/{name}` | 交付物类型 |
| `created` | `YYYY-MM-DD` | 创建日期 |
| `milestone` | 版本号 | 所属里程碑 |
| `status` | `pending` \| `in_progress` \| `verified` | 状态 |

**statement_id 格式规则：**
- 前缀：`ds-`（Demo Statement）
- 日期：8位数字，YYYYMMDD 格式
- 序号：3位数字，当日递增（001, 002, ...）
- 示例：`ds-20260325-001`

### 1.3 验证标准写法 (Verification Criteria Writing)

验证标准必须是**行为式断言**——描述用户可见的行为，而非实现细节。

**✅ 好的验证标准：**
- 「可以点击登录按钮」
- 「登录成功后跳转到 Dashboard」
- 「错误提示显示『用户名或密码错误』」
- 「测试覆盖率 ≥ 80%」

**❌ 不好的验证标准：**
- 「使用 React 实现登录组件」（实现细节）
- 「代码通过 ESLint 检查」（用户不可见）
- 「API 返回 200 状态码」（技术细节，需转化为用户可见行为）

**写法规则：**
1. 使用「可以...」或「能够...」开头
2. 描述用户可观察的行为或状态变化
3. 避免技术实现细节
4. 可测性：有明确的验证方法

### 1.4 示例 (Examples)

#### 示例 1：code/framework 类型

```yaml
---
statement_id: ds-20260325-001
type: code/framework
created: 2026-03-25
milestone: v1.0
status: pending
presentation:
  primary: 视频演示
  secondary: 运行时可视化
---

## Demo Statement

当完成时，你会看到：

1. 一个包含用户名、密码输入框和登录按钮的登录页面
2. 输入有效凭据后，成功跳转到用户 Dashboard
3. 输入无效凭据后，显示「用户名或密码错误」提示
4. 登录按钮在提交时显示 loading 状态

## Verification Criteria

- [ ] 页面加载完成，表单元素可见
- [ ] 可以输入用户名和密码
- [ ] 点击登录按钮可触发提交
- [ ] 有效凭据跳转至 Dashboard
- [ ] 无效凭据显示错误提示
- [ ] 按钮提交时显示 loading 动画
```

#### 示例 2：test/quality 类型

```yaml
---
statement_id: ds-20260325-002
type: test/quality
created: 2026-03-25
milestone: v1.0
status: pending
presentation:
  primary: 覆盖率可视化
  secondary: 验证产物
---

## Demo Statement

当完成时，你会看到：

1. 一套完整的 E2E 测试套件，覆盖用户登录流程
2. 测试覆盖率报告显示覆盖率 ≥ 85%
3. 所有测试用例通过运行

## Verification Criteria

- [ ] 测试套件包含至少 10 个测试用例
- [ ] 测试覆盖率 ≥ 85%
- [ ] 所有测试用例运行通过
- [ ] 覆盖正常流程和异常流程
- [ ] 生成 HTML 格式的覆盖率报告
```

#### 示例 3：methodology/skill 类型

```yaml
---
statement_id: ds-20260325-003
type: methodology/skill
created: 2026-03-25
milestone: v1.0
status: pending
presentation:
  primary: 演示使用
  secondary: 可执行文档
---

## Demo Statement

当完成时，你会看到：

1. 一个可用的 Claude Code Skill，能够自动生成项目文档
2. 使用该 Skill 完成一次文档生成的演示
3. 可执行文档说明如何配置和使用

## Verification Criteria

- [ ] Skill 文件存在于 `.claude/skills/` 目录
- [ ] Skill 可通过 Claude Code 触发执行
- [ ] 执行后生成预期的文档输出
- [ ] 文档包含使用说明和配置示例
- [ ] 提供至少一个完整的演示案例
```

---

## 2. 交付物类型映射

### 2.1 四种核心类型 (Four Core Types)

#### Type 1: code/framework

**描述：** 代码、框架、API 端点、UI 组件等可直接运行的软件产物。

**典型场景：**
- 新功能实现（登录系统、数据可视化）
- API 端点开发
- UI 组件开发
- 框架/库开发

**展示形式：**
- **主展示形式：** 视频演示 (Video Demo)
- **辅展示形式：** 运行时可视化 (Runtime Visualization)

**特点：** 用户可交互、视觉可验证、行为可观察。

---

#### Type 2: methodology/skill

**描述：** Claude Code Skill、工作流定义、开发方法论等过程性产物。

**典型场景：**
- Claude Code Skill 定义
- 自动化工作流
- 开发规范/最佳实践
- 项目脚手架模板

**展示形式：**
- **主展示形式：** 演示使用 (Usage Demo)
- **辅展示形式：** 可执行文档 (Executable Documentation)

**特点：** 过程导向、指令驱动、需要演示操作流程。

---

#### Type 3: test/quality

**描述：** 测试套件、E2E 测试、覆盖率报告等质量保障产物。

**典型场景：**
- 单元测试套件
- E2E 测试
- 性能测试
- 覆盖率分析

**展示形式：**
- **主展示形式：** 覆盖率可视化 (Coverage Visualization)
- **辅展示形式：** 验证产物 (Verification Artifacts)

**特点：** 指标驱动、通过/失败判定、可量化。

---

#### Type 4: change/refactor

**描述：** 迁移脚本、配置变更、代码重构等变更类产物。

**典型场景：**
- 代码重构
- 依赖升级
- 配置迁移
- 架构调整

**展示形式：**
- **主展示形式：** 对比图 (Before/After Diagram)
- **辅展示形式：** 影响范围 (Impact Scope)

**特点：** 结构性变更、差异对比、影响范围可追溯。

---

### 2.2 展示形式优先级 (Presentation Priority)

**优先级顺序：**
```
视频演示 > 运行时可视化 > 验证产物 > 文档
```

**为什么这个顺序：**

1. **视频演示** — 最高可观察性，用户无需任何技术知识即可理解
2. **运行时可视化** — 动态展示数据流动和执行过程
3. **验证产物** — 静态但具体，可追溯
4. **文档** — 最抽象，需要阅读理解

**如何选择：**
- 优先使用更高优先级的形式
- 多种形式可组合使用（主展示形式 + 辅展示形式）
- 根据交付物类型自动推荐，但可人工调整

### 2.3 类型映射表 (Type Mapping Table)

| 类型 | 主展示形式 | 辅展示形式 | 典型场景 |
|------|-----------|-----------|---------|
| `code/framework` | 视频演示 | 运行时可视化 | 登录功能、数据可视化、API 开发 |
| `methodology/skill` | 演示使用 | 可执行文档 | Skill 定义、工作流、脚手架 |
| `test/quality` | 覆盖率可视化 | 验证产物 | 测试套件、E2E 测试、覆盖率报告 |
| `change/refactor` | 对比图 | 影响范围 | 代码重构、依赖升级、架构调整 |

### 2.4 自定义类型扩展 (Custom Type Extension)

当四种核心类型无法准确描述交付物时，可使用自定义类型。

**格式：**
```
custom/{name}
```

**必需字段：**
```yaml
type: custom/data-pipeline
custom_definition:
  rationale: "数据管道具有独特的展示需求，需要展示数据流动和转换过程"
  presentation:
    primary: 数据流图
    secondary: 执行日志
```

**自定义类型定义模板：**
```yaml
type: custom/{name}
custom_definition:
  rationale: "为什么需要这个自定义类型"
  presentation:
    primary: 主展示形式
    secondary: 辅展示形式（可选）
```

**注意：** 自定义类型应在团队内保持一致性，建议定期评审是否应提升为核心类型。

### 2.5 类型判断原则 (Type Judgment Principles)

**判断流程：**
1. Agent 根据交付物性质声明类型
2. 人类确认或调整

**判断问题清单：**

| 问题 | 推荐类型 |
|------|----------|
| 这是用户可交互的代码吗？ | `code/framework` |
| 这是过程/工作流定义吗？ | `methodology/skill` |
| 这是验证/质量保障产物吗？ | `test/quality` |
| 这是修改现有结构的变更吗？ | `change/refactor` |

**复杂情况：**
- 一个交付物可能包含多个类型 → 拆分为多个 Demo Statement
- 类型边界模糊 → 选择用户最关心的展示形式对应的类型

---

## 3. 验证产物标准

### 3.1 概述 (Overview)

验证产物是证明交付物完成的具体证据。每个产物必须能够追溯到其对应的 Demo Statement。

**产物类型：**
- 截图 (Screenshots)
- 日志 (Logs)
- 测试结果 (Test Results)
- 视频 (Videos)
- 图表 (Diagrams)

**可追溯性要求：**
每个验证产物必须包含：
- `statement_id` — 关联的 Demo Statement ID
- `timestamp` — 生成时间（ISO 8601 格式）

### 3.2 截图规范 (Screenshot Standards)

**格式要求：**
- **格式：** PNG（无损压缩，Web 兼容）
- **宽度：** 1440px（标准桌面视口）
- **高度：** 可变（捕获完整内容或视口）

**命名约定：**
```
{statement_id}-{action}-{sequence}-{timestamp}.png
```

**命名示例：**
```
ds-20260325-001-login-form-001-20260325T143000Z.png
ds-20260325-001-dashboard-view-002-20260325T143015Z.png
```

**命名组件：**
| 组件 | 格式 | 说明 |
|------|------|------|
| `statement_id` | `ds-YYYYMMDD-NNN` | 关联 Demo Statement（必需） |
| `action` | 小写，连字符分隔 | 语义化描述（如 `login-form`） |
| `sequence` | 3 位数字，零填充 | 序号（001, 002, ...） |
| `timestamp` | ISO 8601，无冒号 | 时间戳（如 `20260325T143000Z`） |

**最佳实践：**
- 使用一致的视口宽度
- 捕获可见的状态变化
- 避免捕获敏感数据（密码、密钥等）

### 3.3 日志格式 (Log Format)

**格式：** JSON Lines（每行一个 JSON 对象）

**必需字段：**
```json
{
  "timestamp": "2026-03-25T14:30:00.123Z",
  "level": "INFO",
  "statement_id": "ds-20260325-001",
  "event": "verification_started"
}
```

**日志级别：**
| 级别 | 说明 |
|------|------|
| `DEBUG` | 详细调试信息 |
| `INFO` | 一般进度信息 |
| `WARN` | 警告条件 |
| `ERROR` | 错误条件 |
| `PASS` | 验证通过 |
| `FAIL` | 验证失败 |

**完整日志示例：**
```json
{"timestamp": "2026-03-25T14:30:00.123Z", "level": "INFO", "statement_id": "ds-20260325-001", "event": "verification_started", "message": "Starting verification for login feature"}
{"timestamp": "2026-03-25T14:30:02.456Z", "level": "PASS", "statement_id": "ds-20260325-001", "event": "criteria_checked", "message": "Login form visible", "criteria": "页面加载完成，表单元素可见"}
{"timestamp": "2026-03-25T14:30:05.789Z", "level": "PASS", "statement_id": "ds-20260325-001", "event": "criteria_checked", "message": "Login button clickable", "criteria": "点击登录按钮可触发提交"}
{"timestamp": "2026-03-25T14:30:08.012Z", "level": "INFO", "statement_id": "ds-20260325-001", "event": "verification_completed", "message": "All criteria passed"}
```

### 3.4 测试结果格式 (Test Results Format)

**格式：** JUnit XML（行业标准，兼容 CI/CD 工具）

**JUnit XML 示例：**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="ds-20260325-001" tests="6" failures="0" errors="0" time="15.5" timestamp="2026-03-25T14:30:00">
  <testcase name="页面加载完成，表单元素可见" classname="verification" time="2.1"/>
  <testcase name="可以输入用户名和密码" classname="verification" time="1.8"/>
  <testcase name="点击登录按钮可触发提交" classname="verification" time="2.5"/>
  <testcase name="有效凭据跳转至 Dashboard" classname="verification" time="3.2"/>
  <testcase name="无效凭据显示错误提示" classname="verification" time="2.9"/>
  <testcase name="按钮提交时显示 loading 动画" classname="verification" time="3.0"/>
</testsuite>
```

**HTML 报告：**
- 从 JUnit XML 生成
- 人类可读的摘要视图
- 包含通过/失败计数、执行时间、详情

### 3.5 可追溯性要求 (Traceability Requirements)

**可追溯链：**
```
Demo Statement → Verification Criteria → Artifacts → Results
```

**每个产物必须包含：**
| 字段 | 格式 | 来源 |
|------|------|------|
| `statement_id` | `ds-YYYYMMDD-NNN` | Demo Statement |
| `timestamp` | ISO 8601 | 生成时间 |

**产物清单 (Artifact Manifest)：**

每个交付物应有产物清单文件：
```yaml
# ds-20260325-001-manifest.yaml
statement_id: ds-20260325-001
artifacts:
  screenshots:
    - ds-20260325-001-login-form-001-20260325T143000Z.png
    - ds-20260325-001-dashboard-view-002-20260325T143015Z.png
  logs:
    - ds-20260325-001.log.jsonl
  test_results:
    - ds-20260325-001-junit.xml
    - ds-20260325-001-report.html
```

### 3.6 完整示例 (Complete Example)

**Demo Statement：**
```yaml
---
statement_id: ds-20260325-001
type: code/framework
created: 2026-03-25
milestone: v1.0
status: verified
---
当完成时，你会看到：
1. 一个可点击的登录按钮
2. 登录成功后跳转到 Dashboard
```

**验证标准检查清单：**
- [x] 页面加载完成，表单元素可见
- [x] 可以输入用户名和密码
- [x] 点击登录按钮可触发提交
- [x] 有效凭据跳转至 Dashboard

**生成的产物：**
```
artifacts/
├── ds-20260325-001-login-form-001-20260325T143000Z.png
├── ds-20260325-001-dashboard-view-002-20260325T143015Z.png
├── ds-20260325-001.log.jsonl
├── ds-20260325-001-junit.xml
├── ds-20260325-001-report.html
└── ds-20260325-001-manifest.yaml
```

### 3.7 JSON Schema 参考

**验证产物 Schema：**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["statement_id", "timestamp", "type", "path"],
  "properties": {
    "statement_id": {"type": "string", "pattern": "^ds-\\d{8}-\\d{3}$"},
    "timestamp": {"type": "string", "format": "date-time"},
    "type": {"enum": ["screenshot", "log", "test_result", "video", "diagram"]},
    "path": {"type": "string"},
    "description": {"type": "string"}
  }
}
```

**日志条目 Schema：**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["timestamp", "level", "statement_id", "event"],
  "properties": {
    "timestamp": {"type": "string", "format": "date-time"},
    "level": {"enum": ["DEBUG", "INFO", "WARN", "ERROR", "PASS", "FAIL"]},
    "statement_id": {"type": "string", "pattern": "^ds-\\d{8}-\\d{3}$"},
    "event": {"type": "string"},
    "message": {"type": "string"},
    "criteria": {"type": "string"},
    "metadata": {"type": "object"}
  }
}
```

---

## 附录 A: 快速参考 (Quick Reference)

### Demo Statement 模板

```yaml
---
statement_id: ds-YYYYMMDD-NNN
type: code/framework | methodology/skill | test/quality | change/refactor | custom/{name}
created: YYYY-MM-DD
milestone: vX.Y
status: pending | in_progress | verified
presentation:
  primary: 主展示形式
  secondary: 辅展示形式
---

## Demo Statement

当完成时，你会看到：

1. [可观察结果 1]
2. [可观察结果 2]

## Verification Criteria

- [ ] [验证标准 1]
- [ ] [验证标准 2]
```

### 类型映射速查表

| 类型 | 主展示形式 | 辅展示形式 |
|------|-----------|-----------|
| `code/framework` | 视频演示 | 运行时可视化 |
| `methodology/skill` | 演示使用 | 可执行文档 |
| `test/quality` | 覆盖率可视化 | 验证产物 |
| `change/refactor` | 对比图 | 影响范围 |

### 产物命名速查

| 产物类型 | 命名格式 |
|----------|----------|
| 截图 | `{statement_id}-{action}-{seq}-{timestamp}.png` |
| 日志 | `{statement_id}.log.jsonl` |
| 测试结果 | `{statement_id}-junit.xml` |
| 产物清单 | `{statement_id}-manifest.yaml` |

---

## 附录 B: 常见问题 (FAQ)

### Q: 什么时候应该使用自定义类型？

当交付物具有独特的展示需求，且四种核心类型都无法准确描述时使用。例如：数据管道（需要展示数据流动）、性能优化（需要展示性能指标变化）。

### Q: 验证标准应该有多详细？

足够详细以至于可以通过自动化测试或人工测试验证。避免过于抽象的描述，使用「可以...」「能够...」的行为式断言。

### Q: 如果截图文件很大怎么办？

- 确保宽度为 1440px
- 使用 PNG 压缩工具优化
- 只捕获必要的内容区域
- 考虑使用视频展示动态内容

### Q: 验证标准可以自动化吗？

可以。验证标准应尽可能可自动化测试。对于无法自动化的标准（如视觉验证），需要人工测试并记录结果。

### Q: 一个交付物可以有多个 Demo Statement 吗？

可以。对于复杂交付物，可以拆分为多个 Demo Statement，每个关注一个独立的可观察结果。

---

## 附录 C: 版本历史 (Version History)

| 版本 | 日期 | 变更说明 |
|------|------|----------|
| v1.0.0 | 2026-03-25 | 初始版本 — Demo Statement 格式、类型映射、验证产物标准 |

---

*Last updated: 2026-03-25*
*Requirements traceability: [REQUIREMENTS.md](./REQUIREMENTS.md)*