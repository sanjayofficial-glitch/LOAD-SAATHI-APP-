# V3 Swarm Coordination — Performance Optimization & Code Tightening Plan

## Goal

Optimize the 15-agent hierarchical mesh swarm coordination framework (as defined in `.claude/skills/v3-swarm-coordination/SKILL.md` and related V3 skills) so that inter-agent communication, dependency scheduling, load balancing, and GitHub integration are **fast and responsive** — without reducing coordination quality or the >85% agent utilization target.

The optimization targets the four coordination subsystems specified in the skill:
1. `DependencyCoordination` — dependency-resolution engine
2. `SwarmCommunication` (QuicSwarmBus) — inter-agent messaging
3. `EfficiencyMonitor` / `SwarmLoadBalancer` — performance monitoring & load rebalancing
4. `GitHubCoordination` — GitHub issue/issue tracking

## Current-State Bottlenecks (from SKILL.md)

| # | Subsystem | Problem | Impact |
|---|-----------|---------|--------|
| P1 | `DependencyCoordination.coordinateExecution` | O(n²) while-loop: re-scans all 15 agents every iteration to find ready ones; deadlock only detected when no agents are ready (reactive, not proactive) | Scales poorly; can miss optimal parallel windows; late deadlock detection adds latency |
| P2 | `GitHubCoordination.createEpicIssues` | Sequential `for...of` with `await` per epic — 5 epics created serially | 5× slower than necessary; delays swarm initialization |
| P3 | `GitHubCoordination.trackProgress` | `setInterval(async …)` at 1-hour — fire-and-forget, no cancellation, no backoff, overlapping on slow ticks | Memory leaks over 14-week run; missed updates under load |
| P4 | `SwarmCommunication` (QuicSwarmBus) | No message batching; fixed `retryAttempts: 3` with `messageTimeout: 30000`, no exponential backoff | High latency under burst; retry storms |
| P5 | `SwarmLoadBalancer.redistributeWork` | Sequential `for...of` with `await` per task reassignment | Slow rebalancing when an agent is overloaded; latency spikes |
| P6 | `EfficiencyMonitor.measureParallelEfficiency` | Serial `measureAgentUtilization` + `measureCoordinationCost` — no caching | Redundant computation; monitoring adds overhead |
| P7 | Phase execution patterns | `Promise.all([...])` called without `AbortSignal` or concurrency limit — 15 agents spawn simultaneously with no backpressure | Resource contention at phase boundaries |

## Optimization Strategy

### OPT-1: Replace Linear Dependency Resolution with Event-Driven Scheduler

**Current:**
```typescript
// SKILL.md:157-172
async coordinateExecution(): Promise<void> {
  const completed = new Set<number>();
  while (completed.size < 15) {
    const ready = this.getReadyAgents(completed);  // O(n) scan each iteration
    if (ready.length === 0) throw new Error('Deadlock detected');
    await Promise.all(ready.map(a => this.executeAgent(a)));
    ready.forEach(id => completed.add(id));
  }
}
```

**Tightened:**
```typescript
class DependencyScheduler {
  private readyQueue: Set<number> = new Set();
  private inDegree = new Map<number, number>();        // remaining deps per agent
  private dependents = new Map<number, number[]>();    // agent → agents that depend on it
  private deadlockTimer: NodeJS.Timeout | null = null;

  constructor(deps: Map<number, number[]>) {
    // Build in-degree map and reverse adjacency in O(V+E)
    for (const [agentId, dependencies] of deps) {
      this.inDegree.set(agentId, dependencies.length);
      for (const dep of dependencies) {
        const list = this.dependents.get(dep) ??= [];
        list.push(agentId);
      }
    }
    // Seed ready queue with zero-dependency agents
    for (const [agentId, deg] of this.inDegree) {
      if (deg === 0) this.readyQueue.add(agentId);
    }
    // Proactive deadlock timer (5s, not reactive)
    this.deadlockTimer = setTimeout(() => this.checkDeadlock(), 5000);
  }

  async executeAll(): Promise<void> {
    while (this.readyQueue.size > 0) {
      const batch = Array.from(this.readyQueue);
      this.readyQueue.clear();
      await Promise.all(batch.map(id => this.executeAgent(id)));
      for (const id of batch) this.markComplete(id);
    }
    if (this.deadlockTimer) clearTimeout(this.deadlockTimer);
  }

  private markComplete(agentId: number): void {
    const deps = this.dependents.get(agentId) ?? [];
    for (const dependentId of deps) {
      const remaining = (this.inDegree.get(dependentId) ?? 0) - 1;
      this.inDegree.set(dependentId, remaining);
      if (remaining === 0) this.readyQueue.add(dependentId);
    }
  }
}
```

**Benefits:**
- O(V+E) init instead of O(n²) repeated scans
- Ready agents dispatched immediately when their deps complete (event-driven, not polling)
- Proactive deadlock detection via timer instead of waiting for empty ready set
- `markComplete` is O(outgoing-degree) per agent, not O(n)

### OPT-2: Batch GitHub Epic Issue Creation

**Current:** Sequential `for...of` with `await`.

**Tightened:**
```typescript
async createEpicIssues(): Promise<void> {
  await Promise.all(
    epics.definitions.map(async epic => {
      const issue = await gh.createIssue({
        title: epic.title,
        labels: ['epic', 'v3', ...epic.agents.map(id => `agent-${id}`)],
        assignees: epic.agents.map(id => this.getAgentGithubUser(id))
      });
      return { epic: epic.title, issue: issue.number };
    })
  );
}
```

**Benefit:** 5 epics → 1 network round-trip window instead of 5 sequential API calls.

### OPT-3: Replace setInterval with Abortable Scheduled Runner

**Current:**
```typescript
// SKILL.md:205-212
setInterval(async () => {
  for (const agent of this.agents) {
    await this.postAgentProgress(agent);
  }
}, 3600000); // 1 hour
```

**Tightened:**
```typescript
class ScheduledProgressReporter {
  private intervalMs = 3_600_000; // 1 hour baseline
  private abortController = new AbortController();
  private consecutiveFailures = 0;
  private backoffMs = 0;

  async start(): Promise<void> {
    while (!this.abortController.signal.aborted) {
      try {
        const results = await Promise.allSettled(
          this.agents.map(a => this.postAgentProgress(a))
        );
        this.consecutiveFailures = 0;
        this.backoffMs = 0;
      } catch (err) {
        this.consecutiveFailures++;
        this.backoffMs = Math.min(60_000, 1_000 * 2 ** this.consecutiveFailures);
      }
      // Exponential backoff on failure, capped at 1 min
      await this.sleep(this.intervalMs + this.backoffMs);
    }
  }

  stop(): void { this.abortController.abort(); }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms, undefined));
  }
}
```

**Benefits:**
- No overlapping executions (sequential loop with await)
- Exponential backoff on failures (prevents hammering a down API)
- Proper cancellation via `AbortController`
- `Promise.allSettled` ensures one agent failure doesn't block others

### OPT-4: QUIC Swarm Bus — Batching + Exponential Backoff

**Current config (SKILL.md:219-223):**
```typescript
new QuicSwarmBus({
  maxAgents: 15,
  messageTimeout: 30000,
  retryAttempts: 3
})
```

**Tightened:**
```typescript
class OptimizedSwarmBus {
  private messageBatch: SwarmMessage[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_WINDOW_MS = 10;
  private readonly MAX_RETRY_ATTEMPTS = 3;

  async broadcast(message: SwarmMessage, opts?: BroadcastOpts): Promise<void> {
    this.messageBatch.push(message);
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => this.flushBatch(), this.BATCH_WINDOW_MS);
    }
  }

  private async flushBatch(): Promise<void> {
    if (this.batchTimer) { clearTimeout(this.batchTimer); this.batchTimer = null; }
    if (this.messageBatch.length === 0) return;
    const batch = this.messageBatch.splice(0);
    // Single QUIC frame carries multiple messages
    await this.transport.sendBatch(batch, {
      timeout: 30_000,
      retryStrategy: 'exponential',
      retryAttempts: this.MAX_RETRY_ATTEMPTS,
    });
  }
}
```

**Benefits:**
- 10ms batching window aggregates burst messages → fewer QUIC frames
- Exponential backoff on retry (not fixed 30s timeout)
- Priority-aware dispatch (critical messages skip batch)

### OPT-5: Parallel Task Redistribution

**Current:** Sequential reassignment loop.

**Tightened:**
```typescript
async rebalanceAgent(overloadedAgent: number): Promise<void> {
  const [availableAgents, tasks] = await Promise.all([
    this.getAvailableAgents(),
    this.getAgentTasks(overloadedAgent)
  ]);
  // Compute optimal assignment matrix in one pass
  const assignments = this.assignTasks(tasks, availableAgents);
  // Parallel reassign — each task → best agent simultaneously
  await Promise.all(
    assignments.map(({ task, targetAgent }) =>
      this.reassignTask(task, targetAgent)
    )
  );
}
```

**Benefit:** Rebalancing completes in 1 round-trip instead of N sequential calls.

### OPT-6: Caching + Sampling in EfficiencyMonitor

**Tightened:**
```typescript
class CachedEfficiencyMonitor {
  private cache = new Map<string, { data: any; expires: number }>();
  private readonly CACHE_TTL = 5_000; // 5s

  async measureParallelEfficiency(): Promise<EfficiencyReport> {
    const [util, overhead] = await Promise.all([
      this.getOrCompute('utilization', () => this.measureAgentUtilization()),
      this.getOrCompute('coordination-cost', () => this.measureCoordinationCost())
    ]);
    // ... rest unchanged
  }

  private async getOrCompute<T>(key: string, compute: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) return cached.data as T;
    const data = await compute();
    this.cache.set(key, { data, expires: Date.now() + this.CACHE_TTL });
    return data;
  }
}
```

**Benefits:**
- 5s TTL cache prevents redundant recomputation of metrics
- Parallel fetch of utilization + overhead (no serial dependency)

### OPT-7: Concurrency Control for Phase Execution

**Current:** `Promise.all([...])` with no concurrency limit.

**Tightened:**
```typescript
import pLimit from 'p-limit';

const limit = pLimit(8); // at most 8 agents active per phase

const phase1 = async () => {
  await Promise.all([
    limit(Task("Security architecture", "...", "v3-security-architect")),
    limit(Task("CVE-1 fix", "...", "security-implementer")),
    limit(Task("CVE-2 fix", "...", "security-implementer")),
    limit(Task("CVE-3 fix", "...", "security-implementer")),
    limit(Task("Security testing", "...", "test-architect")),
    limit(Task("DDD architecture", "...", "core-architect")),
    limit(Task("Type modernization", "...", "core-implementer"))
  ]);
};
```

**Benefit:** Backpressure at phase boundaries — prevents resource starvation even with 15 concurrent agents.

## Implementation Tasks

### Task List

| ID | Optimization | Skill File | Lines | Priority |
|----|-------------|------------|-------|----------|
| OPT-1 | Event-driven dependency scheduler | `v3-swarm-coordination/SKILL.md` | 157-172 | P0 |
| OPT-2 | Batched GitHub epic creation | `v3-swarm-coordination/SKILL.md` | 187-203 | P1 |
| OPT-3 | Abortable progress reporter | `v3-swarm-coordination/SKILL.md` | 205-212 | P1 |
| OPT-4 | Batching + backoff on QuicSwarmBus | `v3-swarm-coordination/SKILL.md` | 218-223 | P0 |
| OPT-5 | Parallel task redistribution | `v3-swarm-coordination/SKILL.md` | 281-291 | P1 |
| OPT-6 | Cached efficiency monitoring | `v3-swarm-coordination/SKILL.md` | 252-265 | P2 |
| OPT-7 | Concurrency-limited phase execution | `v3-swarm-coordination/SKILL.md` | 73-87, 93-102, 108-117, 123-135 | P0 |

## Validation Criteria

| Metric | Current | Target | How Measured |
|--------|---------|--------|-------------|
| Dependency resolution | O(n²) polling | O(V+E) event-driven | Time from agent completion to dependent start |
| GitHub epic creation | 5 sequential calls | 1 batch | Network round-trips for `createEpicIssues` |
| Progress reporter | `setInterval` fire-and-forget | Abortable loop with backoff | Failure simulation — no overlap, backoff applied |
| Bus latency | Per-message, 30s timeout | 10ms batch + exponential backoff | Burst message latency under 15-agent load |
| Rebalancing | N sequential calls | 1 parallel batch | Time to rebalance 10 tasks from overloaded agent |
| Phase startup | Unbounded `Promise.all` (15 agents) | `pLimit(8)` | Memory/CPU at phase boundary (15 simultaneous agent spawns) |
| Agent utilization | >85% target | ≥85% maintained | EfficiencyMonitor reports |
| Communication latency | <100ms target | ≤100ms | Inter-agent ping measurement |

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Event-driven scheduler changes deadlock detection semantics | Keep proactive timer; log pending agents on timeout for debugging |
| Batching may add up to 10ms latency for non-burst messages | Priority queue: critical messages bypass batch window |
| `Promise.allSettled` for progress reporting may mask partial failures | Log each rejection individually; aggregate for alert |
| p-limit introduces a new dependency | Check `package.json` in target project; if absent, implement a simple semaphore wrapper |
| Removing `setInterval` may miss the existing API contract | Abstract behind `start()`/`stop()` interface; existing callers updated transparently |

## Out of Scope

- Implementing the actual claude-flow v3 codebase (this plan optimizes the coordination *pattern* described in the skill)
- Changing the 15-agent topology or the 4-phase lifecycle
- Modifying the QuicSwarmBus transport layer itself (QUIC protocol tuning is handled in `v3-mcp-optimization`)
- Altering the dependency graph (which agents depend on which) — only the *resolution algorithm* changes
