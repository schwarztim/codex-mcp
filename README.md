# Codex MCP - Agent Orchestration for OpenAI Codex CLI

[![Version](https://img.shields.io/badge/version-1.2.0-blue.svg)](https://github.com/schwarztim/codex-mcp/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-23%2F23%20passing-success.svg)](package.json)
[![MCP](https://img.shields.io/badge/MCP-1.0.4-purple.svg)](https://github.com/modelcontextprotocol/servers)
[![GitHub](https://img.shields.io/github/stars/schwarztim/codex-mcp?style=social)](https://github.com/schwarztim/codex-mcp)

An MCP (Model Context Protocol) server that orchestrates multiple OpenAI Codex CLI instances as parallel agents with unattended execution and configurable reasoning effort.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Available Tools](#available-tools)
- [Usage Examples](#usage-examples)
- [Reasoning Effort Control](#reasoning-effort-control)
- [Security Warnings](#security-warnings)
- [Troubleshooting](#troubleshooting)
- [Development](#development)
- [License](#license)

## Features

- **🤖 Agent Orchestration**: Spawn multiple codex CLI instances concurrently
- **⚡ Unattended Execution**: Runs with `--dangerously-bypass-approvals-and-sandbox` for full automation
- **🧠 Reasoning Effort Control**: Configure thinking depth (low/medium/high/extra_high) per agent
- **📊 Output Capture**: Collect stdout/stderr from each agent with memory-safe limits
- **🔧 Process Management**: Monitor, wait for, and terminate agents
- **⚙️ Parallel Task Execution**: Delegate multiple tasks simultaneously
- **✅ Comprehensive Testing**: 23 tests ensuring reliability

## Prerequisites

- **Node.js** v18 or later
- **OpenAI Codex CLI** installed and authenticated
  ```bash
  # Install codex
  npm i -g @openai/codex

  # Authenticate
  codex login --api-key "your-openai-api-key"
  ```

## Installation

### Quick Install (Linux/macOS)

```bash
git clone https://github.com/yourusername/codex-mcp
cd codex-mcp
./scripts/install.sh
```

### Quick Install (Windows)

```powershell
git clone https://github.com/yourusername/codex-mcp
cd codex-mcp
.\scripts\install.ps1
```

### Manual Install

```bash
npm install
npm run build
```

## Configuration

Add to `~/.claude/user-mcps.json`:

```json
{
  "mcpServers": {
    "codex": {
      "command": "node",
      "args": ["/absolute/path/to/codex-mcp/dist/index.js"],
      "env": {
        "CODEX_BIN": "codex",
        "CODEX_DEFAULT_MODEL": "o3"
      }
    }
  }
}
```

### Environment Variables

- `CODEX_BIN`: Path to codex binary (default: `codex`)
- `CODEX_DEFAULT_MODEL`: Default model for agents (default: `o3`)
- `MAX_OUTPUT_SIZE`: Maximum output size per agent in bytes (default: `10485760` = 10MB)

## Available Tools

### 1. `check_codex_available`

Check if codex CLI is installed and working.

**Example:**
```
Check if codex is available
```

### 2. `spawn_agent`

Spawn a single codex agent to execute a task.

**Parameters:**
- `task` (required): The task/prompt for the agent
- `workdir` (optional): Working directory (defaults to current dir)
- `model` (optional): Model to use (defaults to `CODEX_DEFAULT_MODEL`)
- `reasoning_effort` (optional): How much the model should think before responding
  - `low`: Fast, economical (less thinking)
  - `medium`: Balanced (default, recommended for most tasks)
  - `high`: More complete reasoning (thorough thinking)
  - `extra_high`: Maximum thinking (for complex problems, uses most tokens)
- `additional_flags` (optional): Array of additional CLI flags
- `skip_git_check` (optional): Skip git repo check (default: true)

**Examples:**
```
Spawn a codex agent with task "Fix all TypeScript errors in src/" in /Users/tim/project
```

```
Spawn a codex agent with task "Refactor the authentication system for better security" with reasoning effort "high"
```

```
Spawn a codex agent with task "Design a distributed caching architecture" with reasoning effort "extra_high"
```

### 3. `list_agents`

List all active and completed agents.

**Parameters:**
- `filter` (optional): `all`, `running`, or `completed` (default: `all`)

**Example:**
```
List all running codex agents
```

### 4. `get_agent_output`

Get output from a specific agent.

**Parameters:**
- `agent_id` (required): The agent ID

**Example:**
```
Get output from agent abc-123-def
```

### 5. `stop_agent`

Terminate a running agent.

**Parameters:**
- `agent_id` (required): The agent ID to stop
- `signal` (optional): `SIGTERM` or `SIGKILL` (default: `SIGTERM`)

**Example:**
```
Stop agent abc-123-def
```

### 6. `wait_for_agent`

Wait for an agent to complete and return final output.

**Parameters:**
- `agent_id` (required): The agent ID
- `timeout` (optional): Timeout in milliseconds (default: 300000 = 5 minutes)

**Example:**
```
Wait for agent abc-123-def to complete
```

### 7. `spawn_parallel_agents`

Spawn multiple agents in parallel.

**Parameters:**
- `tasks` (required): Array of task configurations
  - `task` (required): The task/prompt
  - `workdir` (optional): Working directory
  - `model` (optional): Model to use
  - `reasoning_effort` (optional): Thinking level (low/medium/high/extra_high)

**Examples:**
```
Spawn parallel codex agents with tasks:
- "Run tests in backend/" in /Users/tim/project/backend
- "Run tests in frontend/" in /Users/tim/project/frontend
- "Generate API docs" in /Users/tim/project
```

```
Spawn parallel agents with different reasoning levels:
- "Quick syntax check" with reasoning_effort "low"
- "Refactor for performance" with reasoning_effort "high"
- "Design new architecture" with reasoning_effort "extra_high"
```

## Usage Examples

### Example 1: Single Agent Task

```
Spawn a codex agent to "Add unit tests for the authentication module" in /Users/tim/myapp
```

The MCP will:
1. Spawn a codex process with `--dangerously-bypass-approvals-and-sandbox`
2. Return an agent ID
3. Execute the task autonomously

### Example 2: Parallel Testing

```
Spawn parallel codex agents:
- "Run unit tests" in /Users/tim/project
- "Run integration tests" in /Users/tim/project
- "Run e2e tests" in /Users/tim/project
```

### Example 3: Monitor Agent Progress

```
1. Spawn agent to "Refactor database layer"
2. List running agents
3. Get output from agent <id>
4. Wait for agent <id> to complete
```

## Reasoning Effort Control

Control how much your agents think before responding with the `reasoning_effort` parameter:

| Level | Speed | Thinking | Token Usage | Best For |
|-------|-------|----------|-------------|----------|
| **`low`** | ⚡ Fastest | 🤔 Quick | 💰 Economical | Simple tasks, syntax fixes, obvious changes |
| **`medium`** | ⏱️ Balanced | 🧠 Standard | 💵 Normal | Most tasks (default, recommended) |
| **`high`** | 🐢 Slower | 🎓 Deep | 💸 Higher | Complex refactoring, security reviews |
| **`extra_high`** | 🐌 Slowest | 🧙 Maximum | 💳 Premium | Architecture design, ambiguous problems |

### When to Use Each Level

**Low (Fast & Economical):**
```
✅ Fix syntax errors
✅ Add simple functions
✅ Update configuration
❌ Don't use for architectural decisions
```

**Medium (Recommended Default):**
```
✅ Most development tasks
✅ Bug fixes with known causes
✅ Code reviews
✅ Refactoring with clear goals
```

**High (Thorough Thinking):**
```
✅ Security-sensitive code
✅ Performance optimizations
✅ Complex refactoring
✅ API design decisions
```

**Extra High (Maximum Thinking):**
```
✅ System architecture design
✅ Ambiguous requirements
✅ Critical infrastructure code
✅ When correctness > speed
⚠️ Uses most tokens - expensive!
```

### Example Usage

```bash
# Fast syntax fix
Spawn agent "fix typescript errors" with reasoning_effort "low"

# Standard feature work
Spawn agent "add user authentication" with reasoning_effort "medium"

# Security-critical refactoring
Spawn agent "refactor payment processing" with reasoning_effort "high"

# Architectural design
Spawn agent "design distributed caching system" with reasoning_effort "extra_high"
```

## How It Works

1. **Agent Spawning**: Each call to `spawn_agent` or `spawn_parallel_agents` spawns a new `codex exec` process
2. **Unattended Execution**: Uses `--dangerously-bypass-approvals-and-sandbox` flag for full automation
3. **Reasoning Configuration**: Passes `-c model_reasoning_effort="<level>"` to codex CLI
4. **Output Capture**: Captures stdout/stderr streams in real-time with memory limits
5. **Process Tracking**: Maintains registry of all agents with metadata
6. **Graceful Cleanup**: Terminates all agents on server shutdown

## Security Warnings

⚠️ **DANGER**: This MCP uses `--dangerously-bypass-approvals-and-sandbox` which:
- Executes ALL commands without approval
- Disables sandboxing protections
- Can modify/delete files without confirmation
- Should ONLY be used in isolated environments

**Safe Usage:**
- Run inside Docker containers
- Use in dedicated development VMs
- Always use version control
- Keep backups of important files

## Troubleshooting

### Codex not found

```bash
# Verify codex is installed
which codex

# Install if missing
npm i -g @openai/codex
```

### Authentication errors

```bash
# Re-authenticate codex
codex login --api-key "your-openai-api-key"

# Verify authentication
codex --version
```

### Agent stuck/hanging

If an agent appears to hang or doesn't produce output:

1. **Check if the task is too simple**: Codex works best with concrete coding tasks. Very simple questions like "what model are you" may not trigger a response.

2. **Verify the model is valid**: Ensure you're using a supported model:
   - `o3` (default)
   - `gpt-5.2` (latest general model)
   - `gpt-5.2-codex` (optimized for coding)
   - `gpt-5.1-codex`, `gpt-5.1-codex-mini`, `gpt-5.1-codex-max` (legacy)

3. **Check agent output**: Use `get_agent_output` to see if there are error messages in stderr:
   ```
   Get output from agent <agent-id>
   ```

4. **Force stop the agent**: If needed, terminate with SIGKILL:
   ```
   Stop agent <agent-id> with signal SIGKILL
   ```

5. **Check server logs**: Look at stderr output from the MCP server for connection/authentication issues

### Output truncated warnings

If you see `stdout_truncated: true` or `stderr_truncated: true` in agent output, the agent produced more than 10MB of output. You can:

- Increase `MAX_OUTPUT_SIZE` environment variable (in bytes)
- Modify your task to produce less output
- Process output in smaller chunks

### Memory issues with long-running agents

The MCP now limits output capture to 10MB per agent by default to prevent memory issues. If you need larger output:

```json
{
  "mcpServers": {
    "codex": {
      "env": {
        "MAX_OUTPUT_SIZE": "52428800"
      }
    }
  }
}
```

This sets the limit to 50MB (52428800 bytes).

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch mode (rebuild on changes)
npm run watch

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Manual start
npm run dev
```

## License

MIT

## Contributing

Contributions welcome! Please open an issue or PR on GitHub.

## Related Projects

- [OpenAI Codex CLI](https://github.com/openai/codex)
- [Model Context Protocol](https://github.com/modelcontextprotocol)
- [agency-ai-solutions/openai-codex-mcp](https://github.com/agency-ai-solutions/openai-codex-mcp)
- [tuannvm/codex-mcp-server](https://github.com/tuannvm/codex-mcp-server)

## Differences from Other Codex MCPs

Unlike existing Codex MCPs:
- **Agent-focused**: Designed for spawning multiple concurrent agents
- **Full automation**: Uses `--yolo` flag for unattended execution
- **Process management**: Full control over agent lifecycle
- **Parallel execution**: Native support for concurrent task execution
