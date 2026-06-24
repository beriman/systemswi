// Circuit Breaker for Google Sheets API — SWI 2.0 Agent Reliability
// Prevents cascade failures when Google APIs are unavailable.
// States: CLOSED (normal) → OPEN (failing) → HALF_OPEN (testing recovery)

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

export interface CircuitBreakerOptions {
  failureThreshold: number; // failures before opening
  recoveryTimeMs: number; // ms before trying half-open
  halfOpenMaxRequests: number; // test requests in half-open state
}

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  recoveryTimeMs: 60_000, // 1 minute
  halfOpenMaxRequests: 1,
};

class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private halfOpenRequests = 0;
  private lastFailureTime = 0;
  private options: CircuitBreakerOptions;

  constructor(
    private name: string,
    options: Partial<CircuitBreakerOptions> = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  getState(): CircuitState {
    if (this.state === "OPEN") {
      // Check if recovery time has passed
      if (Date.now() - this.lastFailureTime >= this.options.recoveryTimeMs) {
        this.state = "HALF_OPEN";
        this.halfOpenRequests = 0;
        console.log(`[CircuitBreaker:${this.name}] → HALF_OPEN (recovery time elapsed)`);
      }
    }
    return this.state;
  }

  canExecute(): boolean {
    const state = this.getState();
    if (state === "CLOSED") return true;
    if (state === "HALF_OPEN" && this.halfOpenRequests < this.options.halfOpenMaxRequests) {
      this.halfOpenRequests++;
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= this.options.halfOpenMaxRequests) {
        this.state = "CLOSED";
        this.failureCount = 0;
        this.successCount = 0;
        console.log(`[CircuitBreaker:${this.name}] → CLOSED (recovery confirmed)`);
      }
    } else if (this.state === "CLOSED") {
      this.failureCount = Math.max(0, this.failureCount - 1);
    }
  }

  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === "HALF_OPEN") {
      this.state = "OPEN";
      console.warn(`[CircuitBreaker:${this.name}] → OPEN (half-open test failed)`);
    } else if (this.state === "CLOSED" && this.failureCount >= this.options.failureThreshold) {
      this.state = "OPEN";
      console.warn(`[CircuitBreaker:${this.name}] → OPEN (${this.failureCount} failures)`);
    }
  }

  getStats() {
    return {
      name: this.name,
      state: this.getState(),
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
        ? new Date(this.lastFailureTime).toISOString()
        : null,
    };
  }

  reset(): void {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenRequests = 0;
  }
}

// ── Singleton registry ─────────────────────────────────────────────
const breakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(name: string, options?: Partial<CircuitBreakerOptions>): CircuitBreaker {
  if (!breakers.has(name)) {
    breakers.set(name, new CircuitBreaker(name, options));
  }
  return breakers.get(name)!;
}

export function getAllCircuitBreakerStats() {
  return Array.from(breakers.values()).map((b) => b.getStats());
}

export function resetAllCircuitBreakers(): void {
  breakers.forEach((b) => b.reset());
}

// ── Execute with circuit breaker ────────────────────────────────────
export async function withCircuitBreaker<T>(
  name: string,
  fn: () => Promise<T>,
  options?: Partial<CircuitBreakerOptions>
): Promise<T> {
  const breaker = getCircuitBreaker(name, options);

  if (!breaker.canExecute()) {
    throw new Error(`Circuit breaker "${name}" is OPEN — service unavailable`);
  }

  try {
    const result = await fn();
    breaker.recordSuccess();
    return result;
  } catch (error) {
    breaker.recordFailure();
    throw error;
  }
}
