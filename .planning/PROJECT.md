# Perceptible Agent Delivery (可感知交付)

## What This Is

一套让Agent交付物变得「可见、可感、可验收」的方法论与工具体系。解决Agent时代人类验收的核心痛点：Agent完成的任务无法直观展示，人类只能阅读代码或文档来理解交付内容。

本项目包含：
- **方法论框架**：定义不同类型交付物的可感知形式、验收标准、验证协议
- **工具集**：集成Claude Code，自动生成视频演示、运行时可视化、验证产物、可执行文档

## Core Value

**让人类从「阅读验收」转变为「观看验收」—— 一眼看懂Agent做了什么，一分钟内完成验收。**

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 定义「可感知交付」的类型学和映射规则
- [ ] 实现Demo Statement声明机制（"当我完成时你会看到..."）
- [ ] 实现验证产物自动生成（截图、日志、测试结果）
- [ ] 实现Claude Code集成（通过Skill或MCP）
- [ ] 支持至少两种展示形式（视频演示 + 运行时可视化）

### Out of Scope

- 多Agent平台集成（Cursor、AutoGen等）— v1聚焦Claude Code
- 生产级部署 — v1是概念验证
- 完全自动化 — v1需要部分人工配置

## Context

### 问题背景

在Agent驱动的软件开发时代，人类的工作重心转向：
1. **Harness Engineering** — 构建Agent运行环境
2. **验收** — 确认Agent交付物符合预期

验收的核心痛点：Agent交付物太抽象，无法直观感知。具体表现：
- 大型milestone的需求模糊，Agent自行扩展后更难验收
- Agent用文字解释交付内容，抽象且难以验证
- 测试case是否覆盖关键功能、是否能跑通，无法直观确认

### 前沿研究

业界已有相关探索：
- **Cursor Cloud Agents**：Agent自动录制视频demo展示工作成果
- **demo-machine**：YAML定义交互流程，自动生成demo视频
- **Langfuse/LangSmith**：Agent执行轨迹可视化
- **Demo Statements (BSWEN)**：定义可观察的验收条件

本项目整合这些思路，构建统一的可感知交付体系。

### 交付物类型与展示形式映射

| 交付物类型 | 展示形式 | 举例 |
|-----------|---------|------|
| 代码/框架 | 觐频演示、运行时可视化 | 数据流图、流水线执行过程 |
| 方法论/Skill | 演示使用、可执行文档 | 实际完成一个任务的录屏 |
| 测试/质量 | 覆盖率可视化、验证产物 | 测试覆盖热力图、运行结果 |
| 变更/重构 | 对比图、影响范围 | 前后对比、依赖变更图 |

## Constraints

- **技术环境**：优先集成Claude Code CLI
- **技术路径**：开放探索，以效果为导向（集成现有工具 vs 自建 vs 混合）
- **语言**：方法论文档中英双语，工具界面优先中文

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 同步推进方法论+工具 | 方法论定义概念，工具验证概念，相互促进 | — Pending |
| v1聚焦Claude Code | 先在一个环境验证概念，再扩展 | — Pending |
| 四种交付类型全覆盖 | 体现方法论通用性，但v1工具可能只实现核心类型 | — Pending |
| 四种展示形式全覆盖 | 探索不同形式的价值，后续迭代聚焦高价值形式 | — Pending |

---

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-25 after initialization*