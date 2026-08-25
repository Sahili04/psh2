# Changes Made — Feature: Priority-Aware Multiple Request Handling

## `backend/src/engine/lockManager.ts` — Rewritten

**Before:** Simple FIFO mutex — requests processed in arrival order regardless of priority.

**After:** Priority-aware queue:

- When a resource is **free** → execute immediately
- When a resource is **busy** → request enters a **priority-sorted wait queue**
- Queue is sorted: `EMERGENCY(4) > CRITICAL(3) > URGENT(2) > ROUTINE(1)`
- Ties broken by arrival time (earlier request wins)
- When the current holder finishes → the **highest priority** waiting request goes next

## `backend/src/engine/transactionEngine.ts` — Updated call

- Added `params.priority` as the third argument to `acquireLock()`, so the lock manager knows each request's priority for queue ordering.
