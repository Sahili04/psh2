/**
 * Per-Resource Mutex Lock Manager
 * Ensures strict serialized execution for concurrent requests targeting the same clinical resource ID.
 */

class ResourceLockManager {
  private locks: Map<string, Promise<void>> = new Map();

  async acquireLock<T>(resourceId: string, fn: () => Promise<T>): Promise<T> {
    const currentLock = this.locks.get(resourceId) || Promise.resolve();

    let releaseNextLock: () => void = () => {};
    const nextLock = new Promise<void>((resolve) => {
      releaseNextLock = resolve;
    });

    // Queue the next lock
    this.locks.set(resourceId, currentLock.then(() => nextLock));

    try {
      // Wait for previous lock on this resource
      await currentLock;
      return await fn();
    } finally {
      releaseNextLock();
      if (this.locks.get(resourceId) === nextLock) {
        this.locks.delete(resourceId);
      }
    }
  }
}

export const resourceLockManager = new ResourceLockManager();
