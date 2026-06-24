// Agent Error Recovery & Retry Mechanism
// Provides resilient execution with exponential backoff for agent tasks
// Compliance: All retries are logged to audit trail for transparency

import { logAgentActionSafe } from "./audit";

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[]; // error messages/patterns that warrant retry
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: ["ECONNRESET", "ETIMEDOUT", "429", "500", "502", "503", "504", "rate_limit"],
};

export interface ExecutionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
  totalDurationMs: number;
  retried: boolean;
}

// ── Sleep utility ──
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Check if error is retryable ──
function isRetryable(error: unknown, config: RetryConfig): boolean {
  if (!config.retryableErrors || config.retryableErrors.length === 0) return true;
  const errorStr = error instanceof Error ? error.message : String(error);
  return config.retryableErrors.some((pattern) => errorStr.includes(pattern));
}

// ── Execute with retry ──
export async function executeWithRetry<T>(
  taskName: string,
  taskFn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<ExecutionResult<T>> {
  const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
  const startTime = Date.now();
  let lastError: unknown;
  let attempts = 0;
  let retried = false;

  for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
    attempts = attempt + 1;
    try {
      const data = await taskFn();
      const duration = Date.now() - startTime;

      if (retried) {
        await logAgentActionSafe({
          timestamp: new Date().toISOString(),
          agent: "HemuHemu/OWL",
          action: "Task Recovered After Retry",
          target: taskName,
          status: "success",
          humanApproved: "n/a",
          notes: `Succeeded after ${attempts} attempts (${duration}ms total)`,
        });
      }

      return { success: true, data, attempts, totalDurationMs: duration, retried };
    } catch (error) {
      lastError = error;
      const errorStr = error instanceof Error ? error.message : String(error);

      if (attempt < cfg.maxRetries && isRetryable(error, cfg)) {
        retried = true;
        const delay = Math.min(
          cfg.baseDelayMs * Math.pow(cfg.backoffMultiplier, attempt),
          cfg.maxDelayMs
        );

        await logAgentActionSafe({
          timestamp: new Date().toISOString(),
          agent: "HemuHemu/OWL",
          action: `Retrying Task (attempt ${attempt + 1}/${cfg.maxRetries + 1})`,
          target: taskName,
          status: "retrying",
          humanApproved: "n/a",
          notes: `Error: ${errorStr}. Retrying in ${delay}ms...`,
        });

        await sleep(delay);
      } else {
        // Non-retryable error or max retries exceeded
        break;
      }
    }
  }

  const duration = Date.now() - startTime;
  const errorStr = lastError instanceof Error ? lastError.message : String(lastError);

  await logAgentActionSafe({
    timestamp: new Date().toISOString(),
    agent: "HemuHemu/OWL",
    action: "Task Failed After Retries",
    target: taskName,
    status: "failed",
    humanApproved: "n/a",
    notes: `Failed after ${attempts} attempts (${duration}ms). Last error: ${errorStr}`,
  });

  return { success: false, error: errorStr, attempts, totalDurationMs: duration, retried };
}

// ── Circuit Breaker Pattern ──
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private state: "closed" | "open" | "half-open" = "closed";

  constructor(
    private name: string,
    private threshold: number = 5,
    private resetTimeoutMs: number = 60000
  ) {}

  async execute<T>(taskFn: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.resetTimeoutMs) {
        this.state = "half-open";
      } else {
        throw new Error(`Circuit breaker [${this.name}] is OPEN — service unavailable`);
      }
    }

    try {
      const result = await taskFn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.threshold) {
      this.state = "open";
      console.warn(`[CircuitBreaker] ${this.name} → OPEN (failures: ${this.failureCount})`);
    }
  }

  getState(): { state: string; failures: number; lastFailure: number | null } {
    return { state: this.state, failures: this.failureCount, lastFailure: this.lastFailureTime };
  }

  reset(): void {
    this.failureCount = 0;
    this.state = "closed";
    this.lastFailureTime = null;
  }
}

// ── Agent Health Tracker ──
export class AgentHealthTracker {
  private taskHistory: Map<string, ExecutionResult<unknown>[]> = new Map();
  private readonly maxHistoryPerTask = 50;

  record(taskName: string, result: ExecutionResult<unknown>): void {
    if (!this.taskHistory.has(taskName)) {
      this.taskHistory.set(taskName, []);
    }
    const history = this.taskHistory.get(taskName)!;
    history.push(result);
    if (history.length > this.maxHistoryPerTask) {
      history.shift();
    }
  }

  getUptime(taskName: string): number {
    const history = this.taskHistory.get(taskName);
    if (!history || history.length === 0) return 100;
    const successes = history.filter((r) => r.success).length;
    return Math.round((successes / history.length) * 100);
  }

  getAverageDuration(taskName: string): number {
    const history = this.taskHistory.get(taskName);
    if (!history || history.length === 0) return 0;
    const total = history.reduce((sum, r) => sum + r.totalDurationMs, 0);
    return Math.round(total / history.length);
  }

  getStats(taskName: string): {
    uptime: number;
    avgDurationMs: number;
    totalRuns: number;
    lastRun?: string;
    lastStatus?: string;
  } {
    const history = this.taskHistory.get(taskName);
    if (!history || history.length === 0) {
      return { uptime: 100, avgDurationMs: 0, totalRuns: 0 };
    }
    const last = history[history.length - 1];
    return {
      uptime: this.getUptime(taskName),
      avgDurationMs: this.getAverageDuration(taskName),
      totalRuns: history.length,
      lastRun: new Date().toISOString(),
      lastStatus: last.success ? "success" : "failed",
    };
  }

  getAllStats(): Record<string, ReturnType<AgentHealthTracker["getStats"]>> {
    const result: Record<string, ReturnType<AgentHealthTracker["getStats"]>> = {};
    for (const taskName of this.taskHistory.keys()) {
      result[taskName] = this.getStats(taskName);
    }
    return result;
  }
}

// Singleton instance
export const agentHealthTracker = new AgentHealthTracker();

// ── Common circuit breakers ──
export const sheetsCircuitBreaker = new CircuitBreaker("Google-Sheets", 3, 30000);
export const telegramCircuitBreaker = new CircuitBreaker("Telegram", 5, 60000);
