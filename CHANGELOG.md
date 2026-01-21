# Changelog

All notable changes to the Codex MCP server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-21

### Added
- **Reasoning Effort Control**: New `reasoning_effort` parameter for controlling how much the model thinks
  - `low`: Fast, economical (less thinking, faster responses)
  - `medium`: Balanced (default, recommended for most tasks)
  - `high`: More complete reasoning (thorough thinking)
  - `extra_high`: Maximum thinking (for complex problems, uses most tokens)
  - Available in both `spawn_agent` and `spawn_parallel_agents` tools
  - Maps user-friendly `extra_high` to API's `xhigh` automatically
- **Comprehensive test coverage** for reasoning effort feature:
  - Command building with reasoning effort
  - Mapping of extra_high to xhigh
  - Validation of all effort levels

### Changed
- **Tool schemas** updated to include reasoning_effort parameter with enum validation
- **Documentation** enhanced with:
  - Detailed reasoning effort parameter documentation
  - Examples showing different thinking levels
  - Use case guidance (when to use low vs high vs extra_high)

## [1.1.0] - 2026-01-21

### Fixed
- **Memory leak prevention**: Added output size limits to prevent unbounded memory growth for long-running agents
  - Default limit: 10MB per agent (configurable via `MAX_OUTPUT_SIZE` environment variable)
  - Output is gracefully truncated with clear notification when limit is reached
  - Added `stdout_truncated` and `stderr_truncated` flags to agent output responses
- **Build errors**: Fixed TypeScript compilation errors in test suite

### Added
- **Comprehensive test suite**: Added 18 unit tests covering:
  - Tool definitions and schemas
  - Environment configuration
  - Model validation
  - Agent lifecycle management
  - Command building
  - Error handling
  - Output capture with size limits
  - Process management
  - Parallel execution
  - Timeout handling
- **Testing infrastructure**:
  - Added vitest as test runner
  - Created vitest.config.ts with coverage configuration
  - Added `npm test` and `npm run test:watch` scripts
- **Better startup logging**:
  - Log max output size configuration
  - Clear "Server ready" message for debugging
  - Display configured model and binary path

### Changed
- **Agent output responses** now include truncation status:
  - `stdout_truncated`: boolean indicating if stdout was truncated
  - `stderr_truncated`: boolean indicating if stderr was truncated
- **Documentation improvements**:
  - Added `MAX_OUTPUT_SIZE` environment variable documentation
  - Enhanced troubleshooting section with:
    - Agent hanging/timeout debugging steps
    - Valid model list (o3, gpt-5.2, gpt-5.2-codex, etc.)
    - Output truncation handling
    - Memory management guidance
  - Updated Development section with test commands
  - Added authentication verification steps

### Performance
- **Reduced memory footprint**: Long-running agents now have bounded memory usage
- **Predictable resource consumption**: Output size limits prevent OOM errors

## [1.0.0] - 2026-01-19

### Added
- Initial release of Codex MCP agent orchestration system
- `spawn_agent`: Spawn single codex agents with --dangerously-bypass-approvals-and-sandbox
- `list_agents`: List all active and completed agents
- `get_agent_output`: Retrieve stdout/stderr from agents
- `stop_agent`: Terminate running agents
- `wait_for_agent`: Wait for agent completion with timeout
- `spawn_parallel_agents`: Spawn multiple agents concurrently
- `check_codex_available`: Verify codex CLI installation
- Real-time output capture from codex processes
- Process lifecycle management with graceful cleanup

### Security
- Uses `--dangerously-bypass-approvals-and-sandbox` for unattended execution
- **WARNING**: Should only be used in isolated environments (Docker, VMs)
- No credential storage in MCP (uses codex CLI auth)

### Performance
- Parallel agent execution support
- Non-blocking agent spawning
- Efficient process management with event-driven output capture

### Documentation
- Comprehensive README with usage examples
- Installation scripts for Linux/macOS and Windows
- Security warnings and best practices
- Configuration guide for environment variables
