# Phase 1: Methodology Definition - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

定义「可感知交付」方法论的核心概念和规范：
1. Demo Statement 声明格式
2. 四种交付物类型与展示形式映射规则
3. 验证产物标准

此阶段产出方法论文档，不涉及代码实现。

</domain>

<decisions>
## Implementation Decisions

### Demo Statement 格式
- 核心结构：`当完成时，你会看到[可观察结果]` + 验证标准列表
- 类型关联：在 Statement 中声明类型标签（如 `type: code/framework`）
- 验证标准表达：行为式断言（"可以点击登录按钮"、"跳转到 dashboard"）
- 存储位置：Markdown 文件（如 `DELIVERY.md`）— 可读 + 版本控制

### 交付物类型映射
- 类型体系：固定4种类型 + 自定义扩展槽
- 展示形式：主展示形式 + 可选辅助形式（如：视频(主)+流程图(辅)）
- 类型判断：Agent 声明 + 人工确认
- 展示形式优先级：视频演示 > 运行时可视化 > 验证产物 > 文档

### 验证产物标准
- 截图格式：PNG + 1440px 宽度 + 语义化命名（如 `login-success-001.png`）
- 日志格式：结构化 JSON + 人类可读摘要
- 测试结果格式：JUnit XML + HTML 报告
- 可追溯性：每个产物关联 Demo Statement ID + 时间戳

### 方法论文档形式
- 文档位置：`docs/METHODOLOGY.md`
- 文档语言：中英双语（中文主文档 + 英文摘要）
- 示例要求：每种类型提供 2-3 个完整示例
- 版本管理：与 milestone 版本绑定

### Claude's Discretion
实现细节（如具体模板语法、JSON schema 定义）由 Claude 在规划阶段确定。

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
无 — 这是方法论定义阶段，不涉及代码

### Established Patterns
无 — 新项目，此阶段定义基准模式

### Integration Points
后续 phase 将依赖此方法论：
- Phase 5 (Claude Code Integration) 将实现 Demo Statement 命令
- Phase 4 (Video Capture) 将遵循验证产物标准

</code_context>

<specifics>
## Specific Ideas

- 参考 BSWEN 的 Demo Statement 模式
- 参考 Cursor Cloud Agents 的视频演示机制
- 参考 PROJECT.md 中已有的类型映射表

</specifics>

<deferred>
## Deferred Ideas

None — 讨论保持在 phase 范围内

</deferred>