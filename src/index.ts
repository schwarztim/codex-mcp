#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn, ChildProcess } from "child_process";
import { randomUUID } from "crypto";
import * as path from "path";
import * as os from "os";

// Configuration from environment
const CODEX_BIN = process.env.CODEX_BIN || "codex";
const DEFAULT_MODEL = process.env.CODEX_DEFAULT_MODEL || "o3";
const MAX_OUTPUT_SIZE = parseInt(process.env.MAX_OUTPUT_SIZE || "10485760"); // 10MB default

interface CodexAgent {
  id: string;
  task: string;
  workdir: string;
  model: string;
  process: ChildProcess;
  stdout: string;
  stderr: string;
  stdoutTruncated: boolean;
  stderrTruncated: boolean;
  exitCode: number | null;
  startedAt: Date;
  finishedAt: Date | null;
}

// Global agent registry
const agents = new Map<string, CodexAgent>();

// Graceful cleanup on exit
process.on("SIGINT", () => {
  for (const agent of agents.values()) {
    if (agent.process && !agent.process.killed) {
      agent.process.kill("SIGTERM");
    }
  }
  process.exit(0);
});

// MCP Server instance
const server = new Server(
  {
    name: "codex-mcp",
    version: "1.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define all available tools
const tools: Tool[] = [
  {
    name: "spawn_agent",
    description: "Spawn a new codex agent to execute a task autonomously with --yolo flag (dangerous, no approvals)",
    inputSchema: {
      type: "object",
      properties: {
        task: {
          type: "string",
          description: "The task/prompt for the codex agent to execute",
        },
        workdir: {
          type: "string",
          description: "Working directory for the agent (defaults to current directory)",
        },
        model: {
          type: "string",
          description: `Model to use (default: ${DEFAULT_MODEL})`,
        },
        reasoning_effort: {
          type: "string",
          enum: ["low", "medium", "high", "extra_high"],
          description: "How much the model should think before responding. low=fast/economical, medium=balanced (default), high=more complete reasoning, extra_high=maximum thinking",
        },
        additional_flags: {
          type: "array",
          items: { type: "string" },
          description: "Additional codex CLI flags to pass",
        },
        skip_git_check: {
          type: "boolean",
          description: "Skip git repository check (default: true)",
        },
      },
      required: ["task"],
    },
  },
  {
    name: "list_agents",
    description: "List all active and completed codex agents",
    inputSchema: {
      type: "object",
      properties: {
        filter: {
          type: "string",
          enum: ["all", "running", "completed"],
          description: "Filter agents by status (default: all)",
        },
      },
    },
  },
  {
    name: "get_agent_output",
    description: "Get the output (stdout/stderr) from a specific agent",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: {
          type: "string",
          description: "The agent ID to query",
        },
      },
      required: ["agent_id"],
    },
  },
  {
    name: "stop_agent",
    description: "Terminate a running codex agent",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: {
          type: "string",
          description: "The agent ID to stop",
        },
        signal: {
          type: "string",
          enum: ["SIGTERM", "SIGKILL"],
          description: "Signal to send (default: SIGTERM)",
        },
      },
      required: ["agent_id"],
    },
  },
  {
    name: "wait_for_agent",
    description: "Wait for an agent to complete and return its final output",
    inputSchema: {
      type: "object",
      properties: {
        agent_id: {
          type: "string",
          description: "The agent ID to wait for",
        },
        timeout: {
          type: "number",
          description: "Timeout in milliseconds (default: 300000 = 5 minutes)",
        },
      },
      required: ["agent_id"],
    },
  },
  {
    name: "spawn_parallel_agents",
    description: "Spawn multiple codex agents in parallel for concurrent task execution",
    inputSchema: {
      type: "object",
      properties: {
        tasks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              task: { type: "string" },
              workdir: { type: "string" },
              model: { type: "string" },
              reasoning_effort: {
                type: "string",
                enum: ["low", "medium", "high", "extra_high"],
                description: "How much the model should think",
              },
            },
            required: ["task"],
          },
          description: "Array of tasks to execute in parallel",
        },
      },
      required: ["tasks"],
    },
  },
  {
    name: "check_codex_available",
    description: "Check if codex CLI is installed and available",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "check_codex_available": {
        return await handleCheckCodex();
      }

      case "spawn_agent": {
        const {
          task,
          workdir = process.cwd(),
          model = DEFAULT_MODEL,
          reasoning_effort,
          additional_flags = [],
          skip_git_check = true,
        } = args as {
          task: string;
          workdir?: string;
          model?: string;
          reasoning_effort?: string;
          additional_flags?: string[];
          skip_git_check?: boolean;
        };

        const agentId = randomUUID();
        const resolvedWorkdir = path.resolve(workdir);

        // Build codex command
        const codexArgs = [
          "exec",
          "--dangerously-bypass-approvals-and-sandbox",
          "-m",
          model,
          "-C",
          resolvedWorkdir,
          "--json",
          "--color",
          "never",
        ];

        if (skip_git_check) {
          codexArgs.push("--skip-git-repo-check");
        }

        // Add reasoning effort if specified
        if (reasoning_effort) {
          // Map "extra_high" to "xhigh" for the API
          const effortValue = reasoning_effort === "extra_high" ? "xhigh" : reasoning_effort;
          codexArgs.push("-c", `model_reasoning_effort="${effortValue}"`);
        }

        codexArgs.push(...additional_flags, task);

        // Spawn codex process
        const proc = spawn(CODEX_BIN, codexArgs, {
          cwd: resolvedWorkdir,
          stdio: ["ignore", "pipe", "pipe"],
          env: { ...process.env },
        });

        const agent: CodexAgent = {
          id: agentId,
          task,
          workdir: resolvedWorkdir,
          model,
          process: proc,
          stdout: "",
          stderr: "",
          stdoutTruncated: false,
          stderrTruncated: false,
          exitCode: null,
          startedAt: new Date(),
          finishedAt: null,
        };

        // Capture output with size limits to prevent memory issues
        proc.stdout?.on("data", (data) => {
          if (!agent.stdoutTruncated) {
            const newData = data.toString();
            if (agent.stdout.length + newData.length > MAX_OUTPUT_SIZE) {
              const remaining = MAX_OUTPUT_SIZE - agent.stdout.length;
              agent.stdout += newData.substring(0, remaining);
              agent.stdout += "\n... [output truncated due to size limit] ...";
              agent.stdoutTruncated = true;
            } else {
              agent.stdout += newData;
            }
          }
        });

        proc.stderr?.on("data", (data) => {
          if (!agent.stderrTruncated) {
            const newData = data.toString();
            if (agent.stderr.length + newData.length > MAX_OUTPUT_SIZE) {
              const remaining = MAX_OUTPUT_SIZE - agent.stderr.length;
              agent.stderr += newData.substring(0, remaining);
              agent.stderr += "\n... [output truncated due to size limit] ...";
              agent.stderrTruncated = true;
            } else {
              agent.stderr += newData;
            }
          }
        });

        proc.on("exit", (code) => {
          agent.exitCode = code;
          agent.finishedAt = new Date();
        });

        agents.set(agentId, agent);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  agent_id: agentId,
                  status: "spawned",
                  task,
                  workdir: resolvedWorkdir,
                  model,
                  started_at: agent.startedAt.toISOString(),
                  command: `${CODEX_BIN} ${codexArgs.join(" ")}`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "list_agents": {
        const { filter = "all" } = args as { filter?: string };

        let agentList = Array.from(agents.values());

        if (filter === "running") {
          agentList = agentList.filter((a) => a.exitCode === null);
        } else if (filter === "completed") {
          agentList = agentList.filter((a) => a.exitCode !== null);
        }

        const summary = agentList.map((a) => ({
          agent_id: a.id,
          task: a.task,
          workdir: a.workdir,
          model: a.model,
          status: a.exitCode === null ? "running" : "completed",
          exit_code: a.exitCode,
          started_at: a.startedAt.toISOString(),
          finished_at: a.finishedAt?.toISOString() || null,
          runtime_seconds:
            a.finishedAt
              ? (a.finishedAt.getTime() - a.startedAt.getTime()) / 1000
              : (new Date().getTime() - a.startedAt.getTime()) / 1000,
        }));

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  total: agents.size,
                  running: agentList.filter((a) => a.exitCode === null).length,
                  completed: agentList.filter((a) => a.exitCode !== null).length,
                  agents: summary,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "get_agent_output": {
        const { agent_id } = args as { agent_id: string };
        const agent = agents.get(agent_id);

        if (!agent) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: `Agent ${agent_id} not found` }),
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  agent_id: agent.id,
                  task: agent.task,
                  status: agent.exitCode === null ? "running" : "completed",
                  exit_code: agent.exitCode,
                  stdout: agent.stdout,
                  stderr: agent.stderr,
                  stdout_truncated: agent.stdoutTruncated,
                  stderr_truncated: agent.stderrTruncated,
                  started_at: agent.startedAt.toISOString(),
                  finished_at: agent.finishedAt?.toISOString() || null,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "stop_agent": {
        const { agent_id, signal = "SIGTERM" } = args as {
          agent_id: string;
          signal?: NodeJS.Signals;
        };
        const agent = agents.get(agent_id);

        if (!agent) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: `Agent ${agent_id} not found` }),
              },
            ],
            isError: true,
          };
        }

        if (agent.exitCode !== null) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: `Agent ${agent_id} already completed`,
                  exit_code: agent.exitCode,
                }),
              },
            ],
            isError: true,
          };
        }

        agent.process.kill(signal as NodeJS.Signals);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                agent_id,
                status: "terminated",
                signal,
              }),
            },
          ],
        };
      }

      case "wait_for_agent": {
        const { agent_id, timeout = 300000 } = args as {
          agent_id: string;
          timeout?: number;
        };
        const agent = agents.get(agent_id);

        if (!agent) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ error: `Agent ${agent_id} not found` }),
              },
            ],
            isError: true,
          };
        }

        // Wait for completion
        const startWait = Date.now();
        while (agent.exitCode === null && Date.now() - startWait < timeout) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        if (agent.exitCode === null) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  error: `Timeout waiting for agent ${agent_id}`,
                  timeout_ms: timeout,
                }),
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  agent_id: agent.id,
                  task: agent.task,
                  status: "completed",
                  exit_code: agent.exitCode,
                  stdout: agent.stdout,
                  stderr: agent.stderr,
                  stdout_truncated: agent.stdoutTruncated,
                  stderr_truncated: agent.stderrTruncated,
                  runtime_seconds:
                    (agent.finishedAt!.getTime() - agent.startedAt.getTime()) /
                    1000,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "spawn_parallel_agents": {
        const { tasks } = args as {
          tasks: Array<{ task: string; workdir?: string; model?: string; reasoning_effort?: string }>;
        };

        const spawnedAgents: string[] = [];

        for (const taskConfig of tasks) {
          const {
            task,
            workdir = process.cwd(),
            model = DEFAULT_MODEL,
            reasoning_effort,
          } = taskConfig;

          const agentId = randomUUID();
          const resolvedWorkdir = path.resolve(workdir);

          const codexArgs = [
            "exec",
            "--dangerously-bypass-approvals-and-sandbox",
            "-m",
            model,
            "-C",
            resolvedWorkdir,
            "--json",
            "--color",
            "never",
            "--skip-git-repo-check",
          ];

          // Add reasoning effort if specified
          if (reasoning_effort) {
            // Map "extra_high" to "xhigh" for the API
            const effortValue = reasoning_effort === "extra_high" ? "xhigh" : reasoning_effort;
            codexArgs.push("-c", `model_reasoning_effort="${effortValue}"`);
          }

          codexArgs.push(task);

          const proc = spawn(CODEX_BIN, codexArgs, {
            cwd: resolvedWorkdir,
            stdio: ["ignore", "pipe", "pipe"],
            env: { ...process.env },
          });

          const agent: CodexAgent = {
            id: agentId,
            task,
            workdir: resolvedWorkdir,
            model,
            process: proc,
            stdout: "",
            stderr: "",
            stdoutTruncated: false,
            stderrTruncated: false,
            exitCode: null,
            startedAt: new Date(),
            finishedAt: null,
          };

          proc.stdout?.on("data", (data) => {
            if (!agent.stdoutTruncated) {
              const newData = data.toString();
              if (agent.stdout.length + newData.length > MAX_OUTPUT_SIZE) {
                const remaining = MAX_OUTPUT_SIZE - agent.stdout.length;
                agent.stdout += newData.substring(0, remaining);
                agent.stdout += "\n... [output truncated due to size limit] ...";
                agent.stdoutTruncated = true;
              } else {
                agent.stdout += newData;
              }
            }
          });

          proc.stderr?.on("data", (data) => {
            if (!agent.stderrTruncated) {
              const newData = data.toString();
              if (agent.stderr.length + newData.length > MAX_OUTPUT_SIZE) {
                const remaining = MAX_OUTPUT_SIZE - agent.stderr.length;
                agent.stderr += newData.substring(0, remaining);
                agent.stderr += "\n... [output truncated due to size limit] ...";
                agent.stderrTruncated = true;
              } else {
                agent.stderr += newData;
              }
            }
          });

          proc.on("exit", (code) => {
            agent.exitCode = code;
            agent.finishedAt = new Date();
          });

          agents.set(agentId, agent);
          spawnedAgents.push(agentId);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  spawned_count: spawnedAgents.length,
                  agent_ids: spawnedAgents,
                  status: "parallel_execution_started",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ error: `Unknown tool: ${name}` }),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
          }),
        },
      ],
      isError: true,
    };
  }
});

async function handleCheckCodex() {
  return new Promise<{ content: Array<{ type: string; text: string }> }>(
    (resolve) => {
      const proc = spawn(CODEX_BIN, ["--version"], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("exit", (code) => {
        if (code === 0) {
          resolve({
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  available: true,
                  binary: CODEX_BIN,
                  version: stdout.trim(),
                }),
              },
            ],
          });
        } else {
          resolve({
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  available: false,
                  binary: CODEX_BIN,
                  error: stderr || "Failed to execute codex",
                }),
              },
            ],
          });
        }
      });

      proc.on("error", (err) => {
        resolve({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                available: false,
                binary: CODEX_BIN,
                error: err.message,
              }),
            },
          ],
        });
      });
    }
  );
}

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with MCP protocol
  console.error("Codex MCP server running on stdio");
  console.error(`Using codex binary: ${CODEX_BIN}`);
  console.error(`Default model: ${DEFAULT_MODEL}`);
  console.error(`Max output size: ${MAX_OUTPUT_SIZE} bytes (${(MAX_OUTPUT_SIZE / 1024 / 1024).toFixed(2)}MB)`);
  console.error("Server ready to accept tool calls");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
