#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# AI Roguelike - Daily Self-Assessment
# Run once per day to evaluate the live game and find bugs.
#
# Crontab:
#   0 9 * * * bash /path/to/project/scripts/assess.sh >> /path/to/logs/assess.log 2>&1
# ============================================================

export PATH="$HOME/.local/bin:$HOME/.nvm/versions/node/v24/bin:/usr/local/bin:$PATH"
export ANTHROPIC_BASE_URL="${ANTHROPIC_BASE_URL:-http://one-api.server22.jz}"
export ANTHROPIC_AUTH_TOKEN="${ANTHROPIC_AUTH_TOKEN:-sk-4v2AKtxcYlM3RNbemF3SMMoZTzxbBJt5fRqYpawSLKR4xGE1}"
export ANTHROPIC_MODEL="${ANTHROPIC_MODEL:-deepseek-v4-pro[1m]}"

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

LIVE_URL="${ASSESS_URL:-https://coconutlatte.github.io/ai-rougelike-web/}"
LOG_DIR="$REPO_ROOT/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/assess-$(date +%Y%m%d-%H%M%S).log"
PROMPT_FILE="/tmp/assess-prompt-$$.md"

echo "[$(date)] Starting daily assessment of $LIVE_URL"

# --- Git sync ---
git pull --rebase origin master 2>/dev/null || true

# --- Build the assessment prompt ---
cat > "$PROMPT_FILE" << ASSESSPROMPT
You are a professional game QA tester evaluating a browser-based roguelike game.

## Game URL
$LIVE_URL

## Your Task
Evaluate the game from a player/tester perspective and report bugs.

## Steps

### 1. Fetch the live game
Use WebFetch to load: $LIVE_URL
- Check if the page loads successfully
- Look at the HTML structure: is there a canvas element? HUD divs? Script includes?
- Check if there are any visible error indicators in the built JS

### 2. Read the source code
Read these key files to understand what the game SHOULD do:
- src/core/Game.ts — game loop, state management
- src/core/Dungeon.ts — dungeon generation
- src/systems/CombatSystem.ts — combat logic
- src/systems/FOVSystem.ts — visibility
- src/systems/RenderSystem.ts — rendering
- src/systems/TurnManager.ts — enemy AI
- src/entities/Player.ts — player stats
- src/ui/HUD.ts — UI display
- index.html — DOM structure

### 3. Static analysis — look for bugs
Check for these categories of issues:

**Crash risks**:
- Null/undefined access without guards
- Array bounds issues
- Type errors that slipped through
- Missing error handling in critical paths

**Gameplay bugs**:
- Combat: is damage always >= 1? Can dead enemies still act?
- Dungeon: can stairs be unreachable? Can rooms overlap?
- FOV: does visibility update correctly after moves?
- Items: can items be picked up correctly? Are potions consumed?
- Save/Load: does save properly serialize state?

**Balance issues**:
- Are enemy stats reasonable for floor 1?
- Is player starting HP/ATK/DEF appropriate?
- Is XP curve (level * 15) reasonable?

**UI/UX issues**:
- Is the HUD layout clear?
- Are messages informative enough?
- Is the controls hint visible?
- Does the game over screen work?

**Rendering issues**:
- Canvas sizing: is TILE_SIZE * VIEWPORT correct?
- Entity rendering: are colors distinguishable?
- FOV rendering: are visibility states rendered correctly?

### 4. Write findings to docs/bugs.md
Update docs/bugs.md following this protocol:

- Read the current docs/bugs.md first
- For each bug you find, add a new entry in the "Active Bugs" section
- Use the format: \`\`\`
### BUG-<NNN>: <short title>
- **Severity**: critical | major | minor | cosmetic
- **Status**: open
- **Found**: $(date +%Y-%m-%d)
- **Category**: gameplay | rendering | ui | balance | crash | performance
- **Reproduction**: <steps>
- **Expected**: <what should happen>
- **Actual**: <what actually happens>
- **Suggestion**: <how to fix>
\`\`\`
- Number bugs sequentially (check existing highest number)
- If a previously reported bug has been fixed (check the source code), move it to "Resolved Bugs" and set Status: fixed with today's date
- If no new bugs found, add a note: "Assessment YYYY-MM-DD: No new bugs found."
- Update the "Last assessment" timestamp at the bottom

### 5. Commit and push
\`\`\`bash
git add docs/bugs.md
git commit -m "chore: daily assessment $(date +%Y-%m-%d)" && git push
\`\`\`

## Guidelines
- Be thorough but practical — focus on bugs that affect player experience
- Distinguish between spec violations and design opinions
- For suggestions, propose concrete code changes
- If the live page fails to load, report as critical
- Limit to 5 most important findings per assessment
ASSESSPROMPT

# --- Invoke Claude Code ---
echo "[$(date)] Running assessment..."
cat "$PROMPT_FILE" | claude --print \
    --allowedTools "Read,Write,Edit,Bash,WebFetch,WebSearch,Glob" \
    2>&1 | tee -a "$LOG_FILE"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "[$(date)] Assessment completed successfully"
else
    echo "[$(date)] Assessment failed with exit code $EXIT_CODE"
fi

# --- Cleanup ---
rm -f "$PROMPT_FILE"

echo "[$(date)] Assessment complete. Exit: $EXIT_CODE"
