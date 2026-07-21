#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# AI Roguelike Evolution Engine
# Triggered by crontab every 30 minutes:
#   */30 * * * * bash /path/to/project/scripts/evolve.sh >> /path/to/logs/cron-evolve.log 2>&1
# ============================================================

# --- Environment ---
export PATH="$HOME/.local/bin:$HOME/.nvm/versions/node/v22/bin:/usr/local/bin:$PATH"
export ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-https://api.anthropic.com}"
export ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN:-}"
export ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-claude-sonnet-4-8}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

LOG_DIR="$REPO_ROOT/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/evolve-$(date +%Y%m%d-%H%M%S).log"
ROUND_FILE="$REPO_ROOT/.evolution-round"

# --- Dependency check ---
command -v node >/dev/null 2>&1 || { echo "FATAL: node not found"; exit 1; }
command -v npm >/dev/null 2>&1  || { echo "FATAL: npm not found"; exit 1; }
command -v claude >/dev/null 2>&1 || { echo "FATAL: claude CLI not found"; exit 1; }

# --- Git sync ---
git pull --rebase origin master 2>/dev/null || true

# --- Read roadmap status ---
PENDING=$(awk '/\| pending \|/ {count++} END {print count+0}' docs/roadmap.md)
COMPLETED=$(awk '/\| completed \|/ {count++} END {print count+0}' docs/roadmap.md)
ROUND=$(cat "$ROUND_FILE" 2>/dev/null || echo 1)
LAST_MODE=$(cat "$ROUND_FILE.mode" 2>/dev/null || echo "implement")

echo "[$(date)] Round $ROUND | Pending: $PENDING | Completed: $COMPLETED"

# --- Mode selection ---
if [ "$PENDING" -lt 3 ]; then
    MODE="discover"
elif [ "$PENDING" -ge 8 ] && [ "$LAST_MODE" != "groom" ] && [ $((ROUND % 5)) -eq 0 ]; then
    MODE="groom"
else
    MODE="implement"
fi

echo "[$(date)] Mode: $MODE"
echo "$MODE" > "$ROUND_FILE.mode"

# --- Select task (implement mode only) ---
TASK_ID=""
TASK_DESC=""
if [ "$MODE" = "implement" ]; then
    TASK_LINE=$(awk -F'|' '/\| pending \|/ {print $0; exit}' docs/roadmap.md)
    if [ -z "$TASK_LINE" ]; then
        echo "WARN: No pending tasks but mode is implement. Falling back to discover."
        MODE="discover"
    else
        TASK_ID=$(echo "$TASK_LINE" | awk -F'|' '{gsub(/^[ \t]+|[ \t]+$/, "", $1); print $1}')
        TASK_DESC=$(echo "$TASK_LINE" | awk -F'|' '{gsub(/^[ \t]+|[ \t]+$/, "", $3); print $3}')
        echo "[$(date)] Task: $TASK_ID - $TASK_DESC"
    fi
fi

# --- Build the prompt ---
PROMPT_FILE="/tmp/evolve-prompt-$$.md"

if [ "$MODE" = "implement" ]; then
    cat > "$PROMPT_FILE" << PROMPTEOF
You are the AI Evolution Engine for the AI Roguelike game.

## Task: ${TASK_ID} - ${TASK_DESC}

## Project Context
- Tech stack: TypeScript 5, Vite 6, Canvas + DOM
- Architecture: Entity-based (not ECS), see docs/architecture.md
- Coding conventions: see CLAUDE.md

## Steps
1. Read docs/bugs.md — if there are open **critical** or **major** bugs, fix them FIRST (before the roadmap task). Bug fixes take priority over new features.
2. Read docs/roadmap.md and docs/architecture.md to understand current state
3. Read relevant source files in src/ to understand the codebase
4. Implement the task (or fix the priority bug) — write code AND tests
5. If you fixed a bug: move it to "Resolved Bugs" in docs/bugs.md with Status: fixed and today's date
6. Run quality checks: \`npm run build && npm run lint && npm run test\`
7. If quality gate fails, fix errors and retry (max 3 attempts)
8. Update docs/roadmap.md: mark ${TASK_ID} as completed with today's date
9. Update README.md evolution stats block (between <!-- EVOLUTION-STATS-START --> and <!-- EVOLUTION-STATS-END -->)
10. git add -A && git commit -m "feat: ${TASK_DESC}" && git push

## Constraints
- Implement ONLY this task, do not scope-creep
- Do NOT add new tasks to the roadmap
- Do NOT modify scripts/evolve.sh, .github/, or CLAUDE.md
- Keep changes minimal and focused
- Follow existing patterns in the codebase
PROMPTEOF

elif [ "$MODE" = "discover" ]; then
    cat > "$PROMPT_FILE" << PROMPTEOF
You are the AI Evolution Engine for the AI Roguelike game. Mode: DISCOVER

## Goal: Fill the roadmap to ~10 pending tasks

## Steps
1. Read docs/roadmap.md and docs/architecture.md
2. Scan the entire codebase (src/) to identify gaps and opportunities
3. Read CLAUDE.md for coding conventions and architecture
4. Add new tasks to docs/roadmap.md until there are ~10 pending tasks total

## Discovery priorities
- P0: Tasks that fix broken functionality or block core gameplay
- P1: Tasks that directly build on completed features (natural next steps)
- P2: Polish, UI improvements, developer experience, tests

## Rules
- Do NOT add speculative or far-future tasks
- Do NOT create more than 2 phases beyond the current highest phase
- Keep pending total at exactly 10 or fewer
- Each task should be completable in one 30-minute evolution round
- Write clear, specific task descriptions

## Quality gate
- Ensure \`npm run build\` passes after any docs changes
- Commit with: git add -A && git commit -m "chore: discover roadmap tasks" && git push
PROMPTEOF

elif [ "$MODE" = "groom" ]; then
    cat > "$PROMPT_FILE" << PROMPTEOF
You are the AI Evolution Engine for the AI Roguelike game. Mode: GROOM

## Goal: Trim the roadmap to <= 10 pending tasks

## Steps
1. Read docs/roadmap.md and count pending tasks
2. Review the codebase to understand current state
3. Remove or merge low-priority tasks to get pending count <= 10

## Grooming rules
- Keep only the most impactful tasks
- Merge similar tasks; split overly large tasks
- Remove speculative or far-future items
- If a task has been pending for 5+ rounds without progress, consider removing it
- Keep at most 1-2 code-quality/refactoring tasks
- Do NOT add new tasks (this is trim-only)

## After grooming
- Commit with: git add -A && git commit -m "chore: groom roadmap to <=10 pending" && git push
PROMPTEOF
fi

# --- Invoke Claude Code ---
echo "[$(date)] Invoking Claude Code..."
cat "$PROMPT_FILE" | claude --print \
    --allowedTools "Read,Write,Edit,Bash,Glob" \
    2>&1 | tee -a "$LOG_FILE"

EXIT_CODE=$?

# --- Post-evolution ---
if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] Evolution round completed successfully"
else
    echo "[$(date)] Evolution round failed with exit code $EXIT_CODE"
fi

# --- Increment round counter ---
echo $((ROUND + 1)) > "$ROUND_FILE"

# --- Final push (safety net) ---
git push origin master 2>/dev/null || true

# --- Cleanup ---
rm -f "$PROMPT_FILE"

echo "[$(date)] Round $ROUND complete. Mode: $MODE. Exit: $EXIT_CODE"
