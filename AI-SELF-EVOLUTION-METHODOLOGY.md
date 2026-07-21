# AI 自进化项目方法论

> 从 [AI-WMS](https://github.com/coconutLatte/ai-wms) 项目中提炼的、可复用的 Claude Code 自主开发框架。
> 适用场景：任何可由 AI 增量构建的软件项目。

---

## 1. 核心理念

```
          ┌──────────┐
          │  路线图   │  ← 精益模式：最多10条待办
          └────┬─────┘
               │ 每轮自动选取最高优先级
               ▼
┌──────────────────────────────────┐
│        30分钟进化循环              │
│                                  │
│  📖 读状态 → 🎯 选任务 → 🤖 实现  │
│       │                    │     │
│       ▼                    ▼     │
│  ✅ 质量门 ←── 自动修复 ←── 失败  │
│       │                          │
│       ▼                          │
│  📝 Commit → 🚀 Push → 🔄 更新   │
└──────────────────────────────────┘
```

**关键原则**：
- **小步快跑**：每轮只做一件事，保证可编译可测试
- **质量门禁**：编译 + 测试 + lint 全过才提交
- **断点续传**：每轮从路线图读取状态，不依赖内存
- **自修正**：失败自动重试，连续失败跳过该任务

---

## 2. 技术架构

### 2.1 触发机制

使用系统 crontab 定时触发进化脚本：

```cron
*/30 * * * * bash /path/to/project/scripts/evolve.sh >> /path/to/logs/cron-evolve.log 2>&1
```

### 2.2 进化引擎 (`scripts/evolve.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail

# 1. 环境准备
export PATH="/home/user/.local/bin:/usr/local/go/bin:$PATH"
export ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-https://api.anthropic.com}"
export ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN}"
export ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-claude-opus-4-8}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# 2. 读取路线图状态
PENDING=$(grep -cE '\| pending \|' docs/roadmap.md)
COMPLETED=$(grep -cE '\| completed \|' docs/roadmap.md)

# 3. 模式选择
if [ "$PENDING" -lt 3 ]; then
    MODE="discover"     # 不足3条 → 补充到10条
elif [ "$PENDING" -ge 8 ] && [ $((ROUND % 5)) -eq 0 ]; then
    MODE="groom"        # ≥8条且每5轮 → 梳理修剪
else
    MODE="implement"    # 正常 → 选取最高优先级实现
fi

# 4. git 同步
git pull --rebase 2>/dev/null || true

# 5. 构建 Prompt → 调用 Claude Code
cat > /tmp/prompt.md << EOF
你是 [项目名] 的 AI 进化引擎。

## 任务：${TASK_ID} — ${TASK_DESC}

## 项目架构
[从 docs/architecture.md 读取]

## 步骤
1. 阅读相关代码理解当前状态
2. 实现任务 — 写代码和测试
3. 运行质量检查（编译 + 测试），修复错误
4. 更新路线图：标记任务完成
5. 更新 README 统计
6. git add -A && git commit && git push

## 约束
- 只实现当前任务，不超出范围
- 遵守项目编码规范
- 不要添加新任务到路线图（DISCOVER 模式负责补充）
EOF

cat /tmp/prompt.md | claude --print \
    --allowedTools "Read,Write,Edit,Bash,Glob" \
    2>&1 | tee -a "$LOG_FILE"

# 6. 推送到远程
git push 2>/dev/null || true
```

### 2.3 三种进化模式

| 模式 | 触发条件 | 行为 |
|------|---------|------|
| **implement** | 默认 | 选取最高优先级 pending 任务，实现、测试、提交 |
| **groom** | pending ≥ 8 且每 5 轮 | **修剪**路线图：砍掉低优先级任务，保持 ≤10 条 |
| **discover** | pending < 3 | 深度探索代码库，补充到 ~10 条最有价值的后续任务 |

### 2.4 路线图格式 (`docs/roadmap.md`)

```markdown
# Evolution Roadmap

> **Strict cap: 10 pending max.**

## Phase 0: Foundation

| ID | Priority | Task | Status | Completed | Notes |
|----|----------|------|--------|-----------|-------|
| P0-01 | P0 | 项目骨架搭建 | completed | 2026-01-01 | 初始种子 |

## Phase 1: Core Features

| ID | Priority | Task | Status | Completed | Notes |
|----|----------|------|--------|-----------|-------|
| P1-01 | P1 | 第一个核心功能 | pending | — | 实现提示 |
| P1-02 | P2 | 第二个功能 | pending | — | 实现提示 |
```

**规则**：
- 每个 Phase 区分优先级（P0 > P1 > P2 > P3）
- **implement 轮次严禁添加新任务**——只标记完成
- discover/groom 轮次才可增删任务
- 已完成任务永久保留作为历史记录

---

## 3. Prompt 工程

### 3.1 implement 模式 Prompt 模板

```
你是 [项目名] 的 AI 进化引擎。

## 任务：[ID] — [描述]

## 架构约束
- [语言/框架/分层规则]
- [编码规范]

## 步骤
1. 阅读已有代码理解现状
2. 实现任务 — 写代码 AND 测试
3. 运行质量检查，修复所有错误
4. 更新路线图标记完成
5. 更新 README 统计数字
6. git add -A && git commit -m "feat(scope): 描述" && git push

## 约束
- 只实现本任务
- 不修改领域模型（除非任务要求）
- 不修改进化脚本
- 不要添加新任务到路线图
- 保持改动最小化
```

### 3.2 discover 模式 Prompt 模板

```
## 任务发现（目标：补充到 ~10 条 pending）

1. 阅读路线图和架构文档
2. 扫描代码库找最有价值的缺口
3. 运行测试覆盖率检查
4. 新增任务到路线图，聚焦接下来最有价值的工作

优先级：
- P0: 阻塞下一里程碑的
- P1: 直接构建在已完成工作上的（next repo → next service → next API）
- P2: 前端页面、开发体验、测试

规则：
- 不要添加投机性的远期规划
- 不要创建超过 2 个 Phase 之外的新 Phase
- 保持 pending 总数 ≤ 10
```

### 3.3 groom 模式 Prompt 模板

```
## 路线图修剪（目标：砍到 ≤10 条 pending）

1. 阅读路线图统计 pending 数量
2. 审查代码库现状
3. 运行质量检查

## 修剪规则
- 只保留最核心的 ≤10 条任务，其余全部删除/取消
- 不添加投机性 Phase
- 不添加"5年远景"型任务
- 合并相似任务，拆分过大的任务
- 代码质量缺口最多加 1-2 条修复任务
```

---

## 4. 关键配置

### 4.1 CLAUDE.md（项目指令文件）

```markdown
# [项目名]

## 项目定位
[一句话描述]

## 技术栈
- 后端：Go 1.26, chi/v5, PostgreSQL
- 前端：React 18, Ant Design 5, Vite

## 架构
DDD 分层：domain → service → repository → api

## 编码规范
- 所有 ID 用 UUID
- 错误处理：fmt.Errorf("context: %w", err)
- context.Context 作为第一个参数
- 提交格式：feat(scope): description

## 进化协议
1. 读取路线图最高优先级 pending 任务
2. 理解上下文
3. 实现 + 测试
4. 质量门：go build ./... && go test ./...
5. 提交 + 推送
6. 更新路线图
```

### 4.2 `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(go:*)",
      "Bash(make:*)",
      "Bash(git:*)",
      "Bash(npm:*)",
      "Bash(docker:*)",
      "Bash(grep:*)",
      "Bash(find:*)",
      "Bash(mkdir:*)",
      "Bash(ls:*)",
      "Bash(cat:*)",
      "WebSearch",
      "WebFetch"
    ]
  }
}
```

---

## 5. GitHub 生态集成

### 5.1 仓库主页

`README.md` 包含：
- 项目徽章（语言/框架/许可证/进化频率）
- 架构图（ASCII art）
- 进化统计块（由进化脚本自动更新）
- 快速开始命令

```markdown
<!-- EVOLUTION-STATS-START -->
| Metric | Value |
|--------|-------|
| Total tasks | 50 |
| Completed | 30 |
| Pending | 10 |
| Evolution rounds | 40 |
<!-- EVOLUTION-STATS-END -->
```

### 5.2 GitHub Pages Demo

- 用 MSW (Mock Service Worker) 拦截 API 调用
- GitHub Actions 在每次 push 时自动构建前端
- 构建产物输出到 `docs/` 文件夹
- 设置 Pages 从 `master` 分支 `/docs` 部署

### 5.3 GitHub Actions

```yaml
name: Deploy Demo
on:
  push:
    branches: [master]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm ci && npm run build
      - run: |
          # 只覆盖 demo 文件，保留文档
          rm -f docs/index.html docs/404.html docs/mockServiceWorker.js
          rm -rf docs/assets/
          cp -r dist/* docs/
      - run: |
          git config user.name "Bot"
          git add docs/ && git commit -m "chore: update demo" && git push
```

---

## 6. 常见陷阱和解决方案

### 6.1 路线图膨胀（最严重）

**问题**：每轮 implement 都让 AI 顺手加"后续任务"，净增 2-3 条/轮，几天后 100+ pending。

**修复**：
- implement 轮次**严禁添加新任务**
- groom 模式改为"修剪"而非"扩展"
- discover 模式只补到 10 条，不多加

### 6.2 `set -o pipefail` + `grep | head`

**问题**：`grep 匹配数百行 | head -1` → head 读完退出 → grep 写管道破裂 → SIGPIPE → pipefail 杀脚本。

**修复**：用 `awk '/pattern/ {print; exit}'` 替代 `grep | head`。

### 6.3 Cron PATH 不完整

**问题**：cron PATH 只有 `/usr/bin:/bin`，找不到 claude/go/node。

**修复**：在 `evolve.sh` 头部显式设置：
```bash
export PATH="/home/user/.local/bin:/usr/local/go/bin:$PATH"
export ANTHROPIC_BASE_URL="..."
export ANTHROPIC_AUTH_TOKEN="..."
```

### 6.4 Groom 死循环

**问题**：`ROUND = COMPLETED_COUNT + 1`，groom 轮不完成任务 → COMPLETED_COUNT 不变 → ROUND 不变 → 每轮都是 groom。

**修复**：用独立计数器文件 `.evolution-round` 追踪轮次，groom 后强制下轮 implement。

### 6.5 GitHub Actions 覆盖文档

**问题**：`rm -rf docs/ && cp -r dist docs/` 删除了所有文档（roadmap、architecture）。

**修复**：只删除 demo 文件，保留所有 `.md` 和 `adr/`。

### 6.6 Mock 数据与 i18n 不一致

**问题**：UI 做完了中文国际化，但 mock 数据还是硬编码英文。

**修复**：Mock 数据语言跟随默认语言设置。

---

## 7. 启动新项目清单

- [ ] `mkdir -p project/{scripts,docs,.claude,.github/workflows}`
- [ ] 创建 `CLAUDE.md`（项目指令）
- [ ] 创建 `docs/roadmap.md`（5-10 条初始任务）
- [ ] 创建 `docs/architecture.md`（架构设计）
- [ ] 创建 `scripts/evolve.sh`（进化引擎）
- [ ] 设置 crontab：`*/30 * * * * bash /path/to/scripts/evolve.sh`
- [ ] 创建 README.md（徽章 + 统计块 + 快速开始）
- [ ] 创建 `.claude/settings.json`（权限配置）
- [ ] 初始化 Git：`git init && git add -A && git commit`
- [ ] 推送到 GitHub：`git remote add origin && git push`
- [ ] 启用 GitHub Pages（Settings → Pages → /docs）
- [ ] 第一轮手动触发验证：`bash scripts/evolve.sh`

---

## 8. 经验数据

| 指标 | AI-WMS 实际数据 |
|------|----------------|
| 初始种子 | 41 文件，一次对话完成 |
| 稳定频率 | 30 分钟/轮 |
| 每轮耗时 | 3-12 分钟（取决于任务复杂度） |
| 40 轮后完成 | 50+ 任务，164 后端文件，前端 Admin + PDA |
| 路线图膨胀 | 曾达 284 条，修复后稳定在 3-10 条 |
| 主要陷阱 | pipefail SIGPIPE、groom 死循环、路线图膨胀 |
| 模型 | DeepSeek V4 Pro（通过 one-api 代理） |

---

*本文档本身也是 AI 进化的产物——从 AI-WMS 项目的 50+ 轮进化中总结而来。*
