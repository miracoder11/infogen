# Requirements

**Project:** Perceptible Agent Delivery (infoGen)
**Version:** v1
**Created:** 2026-03-25

## v1 Requirements

### METH — Methodology (方法论)

- [x] **METH-01**: 定义「Demo Statement」声明格式
  - 格式: "当我完成时，你会看到[可观察的结果]"
  - 包含验证标准列表
  - 与交付物类型关联

- [x] **METH-02**: 定义四种交付物类型与展示形式映射规则
  - 代码/框架 → 视频演示 + 运行时可视化
  - 方法论/Skill → 演示使用 + 可执行文档
  - 测试/质量 → 覆盖率可视化 + 验证产物
  - 变更/重构 → 对比图 + 影响范围

- [x] **METH-03**: 定义验证产物标准
  - 截图格式与命名规范
  - 日志格式
  - 测试结果格式
  - 可追溯性要求

### OBS — Observability (可观测性)

- [x] **OBS-01**: Trace捕获与层级Span支持
  - OpenTelemetry兼容
  - 支持嵌套Span（LLM调用、工具调用、Agent动作）
  - 时间戳精度毫秒级

- [x] **OBS-02**: 时间线视图
  - 可视化执行顺序和时序
  - Span持续时间显示
  - 支持缩放和筛选

- [x] **OBS-03**: 输入/输出检查
  - 查看每步的prompt/response
  - Markdown渲染
  - 代码语法高亮

- [x] **OBS-04**: Session过滤
  - 按项目、时间范围、状态筛选
  - 按交付物类型筛选

### VID — Video Demo (视频演示)

- [ ] **VID-01**: 基础视频生成
  - Trace → 演示视频转换
  - 支持基本转场
  - 添加时间标注

- [ ] **VID-02**: 浏览器自动化录制
  - Playwright集成
  - 支持常见UI操作录制
  - 语义选择器（避免脆弱的CSS选择器）

- [ ] **VID-03**: 视频输出格式
  - MP4格式支持
  - 可配置分辨率
  - 合理的文件大小

### INT — Integration (Claude Code集成)

- [ ] **INT-01**: Claude Code Skill入口
  - Skill定义文件
  - 触发条件
  - 权限配置

- [ ] **INT-02**: Demo Statement声明命令
  - 命令格式定义
  - 解析器
  - 存储

- [ ] **INT-03**: 验证产物自动收集
  - 拦截Agent输出
  - 自动截图
  - 日志收集

### RUN — Runtime Visualization (运行时可视化)

- [ ] **RUN-01**: 数据流/控制流图生成
  - 节点表示操作
  - 边表示数据流向
  - 可交互

- [ ] **RUN-02**: 执行轨迹可视化
  - 步骤高亮
  - 当前执行位置
  - 分支路径显示

---

## v2 Requirements (Deferred)

*To be added after v1 validation*

- Agent Execution Graph (DAG可视化)
- TTS配音（AI生成旁白）
- Before/After对比视图
- LLM-as-Judge评估
- 交互式回放（debugger风格）

---

## Out of Scope

| Exclusion | Reason |
|-----------|--------|
| 多Agent平台支持 (Cursor, AutoGen) | v1聚焦Claude Code验证概念 |
| 实时流式传输 | 基础设施成本高，v1不需要 |
| CI/CD集成 | 需要稳定API后再扩展 |
| 完整视频编辑功能 | v1仅生成，不提供编辑器 |
| 复杂权限控制 | 过度工程，简单角色足够 |

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| METH-01 | Phase 1 | Complete |
| METH-02 | Phase 1 | Complete |
| METH-03 | Phase 1 | Complete |
| OBS-01 | Phase 2 | Complete |
| OBS-02 | Phase 3 | Complete |
| OBS-03 | Phase 3 | Complete |
| OBS-04 | Phase 3 | Complete |
| VID-01 | Phase 4 | Pending |
| VID-02 | Phase 4 | Pending |
| VID-03 | Phase 4 | Pending |
| INT-01 | Phase 5 | Pending |
| INT-02 | Phase 5 | Pending |
| INT-03 | Phase 5 | Pending |
| RUN-01 | Phase 6 | Pending |
| RUN-02 | Phase 6 | Pending |

---

## Quality Gates

每个需求必须满足：
- **可测试**: 有明确的验证方法
- **用户导向**: 描述用户可见的行为
- **原子性**: 一个需求一个能力
- **独立性**: 最小化依赖

---

*Last updated: 2026-03-25*