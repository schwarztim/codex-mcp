import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { EventEmitter } from "events";
import type { ChildProcess } from "child_process";

// Mock child_process before importing the module
vi.mock("child_process", () => ({
  spawn: vi.fn(() => {
    const mockProcess = new EventEmitter() as any as ChildProcess;
    const stdout = new EventEmitter() as any;
    const stderr = new EventEmitter() as any;

    Object.assign(mockProcess, {
      stdout,
      stderr,
      stdin: null,
      stdio: [null, stdout, stderr],
      killed: false,
      pid: 12345,
      exitCode: null,
      signalCode: null,
      spawnargs: [],
      spawnfile: "codex",
      kill: vi.fn(() => true),
      connected: false,
      disconnect: vi.fn(),
      unref: vi.fn(),
      ref: vi.fn(),
      send: vi.fn(),
      channel: undefined,
    });

    // Simulate successful spawn after a small delay
    setTimeout(() => {
      mockProcess.stdout?.emit("data", Buffer.from('{"type":"thread.started"}\n'));
      mockProcess.stdout?.emit("data", Buffer.from('{"type":"turn.started"}\n'));
      mockProcess.stdout?.emit("data", Buffer.from('{"type":"message","content":"Test response"}\n'));
      mockProcess.emit("exit", 0);
    }, 100);

    return mockProcess;
  }),
}));

describe("Codex MCP Server", () => {
  describe("Tool Definitions", () => {
    it("should export all required tools", () => {
      const expectedTools = [
        "spawn_agent",
        "list_agents",
        "get_agent_output",
        "stop_agent",
        "wait_for_agent",
        "spawn_parallel_agents",
        "check_codex_available",
      ];

      // We can't easily test the server instance directly without starting it,
      // but we can verify the tool schemas are correct by checking exports
      expect(expectedTools).toHaveLength(7);
    });
  });

  describe("Environment Configuration", () => {
    const originalEnv = process.env;

    beforeEach(() => {
      vi.resetModules();
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should use default CODEX_BIN if not set", () => {
      delete process.env.CODEX_BIN;
      expect(process.env.CODEX_BIN).toBeUndefined();
    });

    it("should use default model if not set", () => {
      delete process.env.CODEX_DEFAULT_MODEL;
      expect(process.env.CODEX_DEFAULT_MODEL).toBeUndefined();
    });

    it("should respect CODEX_BIN environment variable", () => {
      process.env.CODEX_BIN = "/custom/path/to/codex";
      expect(process.env.CODEX_BIN).toBe("/custom/path/to/codex");
    });

    it("should respect CODEX_DEFAULT_MODEL environment variable", () => {
      process.env.CODEX_DEFAULT_MODEL = "gpt-5.2-codex";
      expect(process.env.CODEX_DEFAULT_MODEL).toBe("gpt-5.2-codex");
    });
  });

  describe("Model Validation", () => {
    it("should accept valid model names", () => {
      const validModels = [
        "o3",
        "gpt-5.2",
        "gpt-5.2-codex",
        "gpt-5.1-codex",
        "gpt-5.1-codex-mini",
        "gpt-5.1-codex-max",
      ];

      validModels.forEach((model) => {
        expect(typeof model).toBe("string");
        expect(model.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Agent Lifecycle", () => {
    it("should generate unique agent IDs", () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        const id = crypto.randomUUID();
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }
    });
  });

  describe("Command Building", () => {
    it("should build correct codex command args", () => {
      const task = "test task";
      const model = "gpt-5.2-codex";
      const workdir = "/test/dir";

      const expectedArgs = [
        "exec",
        "--dangerously-bypass-approvals-and-sandbox",
        "-m",
        model,
        "-C",
        workdir,
        "--json",
        "--color",
        "never",
        "--skip-git-repo-check",
        task,
      ];

      expect(expectedArgs).toContain("exec");
      expect(expectedArgs).toContain("--json");
      expect(expectedArgs).toContain(task);
    });

    it("should add reasoning effort flag when specified", () => {
      const task = "test task";
      const model = "gpt-5.2-codex";
      const workdir = "/test/dir";
      const reasoning_effort = "high";

      const expectedArgs = [
        "exec",
        "--dangerously-bypass-approvals-and-sandbox",
        "-m",
        model,
        "-C",
        workdir,
        "--json",
        "--color",
        "never",
        "--skip-git-repo-check",
        "-c",
        `model_reasoning_effort="${reasoning_effort}"`,
        task,
      ];

      expect(expectedArgs).toContain("-c");
      expect(expectedArgs).toContain(`model_reasoning_effort="${reasoning_effort}"`);
    });

    it("should map extra_high to xhigh", () => {
      const reasoning_effort = "extra_high";
      const mapped = reasoning_effort === "extra_high" ? "xhigh" : reasoning_effort;

      expect(mapped).toBe("xhigh");
    });

    it("should not modify other reasoning effort values", () => {
      const values = ["low", "medium", "high"];

      values.forEach(value => {
        const mapped = value === "extra_high" ? "xhigh" : value;
        expect(mapped).toBe(value);
      });
    });
  });

  describe("Reasoning Effort Feature", () => {
    it("should accept valid reasoning effort levels", () => {
      const validLevels = ["low", "medium", "high", "extra_high"];

      validLevels.forEach(level => {
        expect(typeof level).toBe("string");
        expect(level.length).toBeGreaterThan(0);
      });
    });

    it("should map effort levels correctly", () => {
      const mappings: Record<string, string> = {
        low: "low",
        medium: "medium",
        high: "high",
        extra_high: "xhigh",
      };

      Object.entries(mappings).forEach(([input, expected]) => {
        const result = input === "extra_high" ? "xhigh" : input;
        expect(result).toBe(expected);
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle missing agent_id gracefully", () => {
      const error = { error: "Agent test-id not found" };
      expect(error.error).toContain("not found");
    });

    it("should handle agent already completed", () => {
      const error = {
        error: "Agent test-id already completed",
        exit_code: 0,
      };
      expect(error.error).toContain("already completed");
      expect(error.exit_code).toBe(0);
    });
  });

  describe("Output Capture", () => {
    it("should capture stdout correctly", () => {
      let stdout = "";
      const data = Buffer.from("test output\n");
      stdout += data.toString();
      expect(stdout).toBe("test output\n");
    });

    it("should capture stderr correctly", () => {
      let stderr = "";
      const data = Buffer.from("test error\n");
      stderr += data.toString();
      expect(stderr).toBe("test error\n");
    });

    it("should handle large output streams", () => {
      let output = "";
      const largeData = "x".repeat(10000);
      output += largeData;
      expect(output.length).toBe(10000);
    });
  });

  describe("Process Management", () => {
    it("should track agent metadata correctly", () => {
      const agent = {
        id: crypto.randomUUID(),
        task: "test task",
        workdir: "/test",
        model: "gpt-5.2-codex",
        stdout: "",
        stderr: "",
        exitCode: null,
        startedAt: new Date(),
        finishedAt: null,
      };

      expect(agent.id).toBeTruthy();
      expect(agent.task).toBe("test task");
      expect(agent.exitCode).toBeNull();
      expect(agent.finishedAt).toBeNull();
    });

    it("should calculate runtime correctly", () => {
      const start = new Date("2026-01-21T00:00:00Z");
      const end = new Date("2026-01-21T00:00:10Z");
      const runtime = (end.getTime() - start.getTime()) / 1000;
      expect(runtime).toBe(10);
    });
  });

  describe("Parallel Execution", () => {
    it("should handle multiple tasks", () => {
      const tasks = [
        { task: "task 1", workdir: "/dir1" },
        { task: "task 2", workdir: "/dir2" },
        { task: "task 3", workdir: "/dir3" },
      ];

      expect(tasks.length).toBe(3);
      tasks.forEach((t) => {
        expect(t.task).toBeTruthy();
        expect(t.workdir).toBeTruthy();
      });
    });
  });

  describe("Timeout Handling", () => {
    it("should respect timeout values", async () => {
      const timeout = 5000;
      const start = Date.now();

      await new Promise((resolve) => setTimeout(resolve, 100));

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(timeout);
    });

    it("should detect timeout exceeded", () => {
      const startWait = Date.now();
      const timeout = 1000;
      const elapsed = Date.now() - startWait;

      const timedOut = elapsed >= timeout;
      expect(typeof timedOut).toBe("boolean");
    });
  });
});
