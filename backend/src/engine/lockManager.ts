/**
 * Priority-Aware Per-Resource Lock Manager
 * 
 * Ensures serialized execution for concurrent requests targeting the same clinical resource.
 * When multiple requests are queued for the same resource, higher-priority requests are
 * processed FIRST (EMERGENCY > CRITICAL > URGENT > ROUTINE) instead of FIFO.
 * 
 * This guarantees that if 1000 simultaneous requests arrive for 1 ICU bed,
 * the EMERGENCY patient gets served before ROUTINE — regardless of arrival order.
 */

import { getPriorityScore } from './priorityEngine.js';

interface QueuedRequest<T = any> {
  priority: string;
  score: number;
  fn: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: any) => void;
  enqueuedAt: number;
}

class ResourceLockManager {
  private activeLocks: Map<string, boolean> = new Map();
  private waitQueues: Map<string, QueuedRequest[]> = new Map();

  /**
   * Acquire a priority-aware lock on a resource.
   * If the resource is free, execute immediately.
   * If busy, queue the request — sorted by priority so highest goes next.
   */
  async acquireLock<T>(resourceId: string, fn: () => Promise<T>, priority: string = 'ROUTINE'): Promise<T> {
    const score = getPriorityScore(priority);

    // If resource is not currently locked, execute immediately
    if (!this.activeLocks.get(resourceId)) {
      return this.executeWithLock(resourceId, fn);
    }

    // Resource is busy — add to priority queue and wait
    return new Promise<T>((resolve, reject) => {
      const queue = this.waitQueues.get(resourceId) || [];
      queue.push({ priority, score, fn, resolve, reject, enqueuedAt: Date.now() });

      // Sort queue: highest priority first, ties broken by arrival time (earlier first)
      queue.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score; // higher score = higher priority
        return a.enqueuedAt - b.enqueuedAt; // earlier arrival wins ties
      });

      this.waitQueues.set(resourceId, queue);
    });
  }

  /**
   * Execute function while holding the lock, then release and process next in queue.
   */
  private async executeWithLock<T>(resourceId: string, fn: () => Promise<T>): Promise<T> {
    this.activeLocks.set(resourceId, true);

    try {
      const result = await fn();
      return result;
    } finally {
      this.releaseLock(resourceId);
    }
  }

  /**
   * Release lock and process the next highest-priority queued request.
   */
  private releaseLock(resourceId: string): void {
    const queue = this.waitQueues.get(resourceId);

    if (queue && queue.length > 0) {
      // Dequeue the highest priority request (already sorted)
      const next = queue.shift()!;

      if (queue.length === 0) {
        this.waitQueues.delete(resourceId);
      }

      // Execute next request with the lock
      this.executeWithLock(resourceId, next.fn)
        .then(next.resolve)
        .catch(next.reject);
    } else {
      // No more waiting requests — release the lock entirely
      this.activeLocks.delete(resourceId);
      this.waitQueues.delete(resourceId);
    }
  }

  /**
   * Get current queue depth for a resource (useful for monitoring/debugging).
   */
  getQueueDepth(resourceId: string): number {
    return this.waitQueues.get(resourceId)?.length || 0;
  }

  /**
   * Check if a resource is currently locked.
   */
  isLocked(resourceId: string): boolean {
    return this.activeLocks.get(resourceId) || false;
  }
}

export const resourceLockManager = new ResourceLockManager();
