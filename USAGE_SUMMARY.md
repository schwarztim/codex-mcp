# Codex MCP - Quick Usage Guide

## What It Does
Spawns OpenAI Codex CLI agents with `--yolo` flag for parallel, unattended code execution.

## Quick Commands

### Single Agent
```
Spawn a codex agent with task "fix TypeScript errors in src/" in /path/to/project
```

### Parallel Agents
```
Spawn parallel codex agents:
- "run unit tests" in /path/to/project
- "run integration tests" in /path/to/project
- "generate docs" in /path/to/project
```

### Monitor & Control
```
List running agents
Get output from agent <id>
Wait for agent <id> to complete
Stop agent <id>
```

## Key Points
- Uses **--dangerously-bypass-approvals-and-sandbox** (no confirmations)
- Each agent runs independently in background
- Default model: **o3** (can override)
- Safe only in isolated environments (Docker/VMs)
- Requires codex CLI authenticated (`codex login`)

## For AI Usage
Tell Claude: "Use the codex MCP to spawn agents for [tasks]. Monitor with list_agents and get results when done."
