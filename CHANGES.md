# Changes Made — Feature: Priority-Aware Multiple Request Handling

## `backend/src/engine/lockManager.ts` — Rewritten

**Before:** Simple FIFO mutex — requests processed in arrival order regardless of priority.

**After:** Priority-aware queue:

- When a resource is **free** → execute immediately
- When a resource is **busy** → request enters a **priority-sorted wait queue**
- Queue is sorted: `EMERGENCY(4) > CRITICAL(3) > URGENT(2) > ROUTINE(1)`
- Ties broken by arrival time (earlier request wins)
- When the current holder finishes → the **highest priority** waiting request goes next

## `backend/src/engine/transactionEngine.ts` — Updated

- Added `params.priority` as the third argument to `acquireLock()`, so the lock manager knows each request's priority for queue ordering.
- Added `MultiResourceParams` interface for multi-resource transactions.
- Added `executeMultiResourceTransaction()` method — **Atomic Multi-Resource Allocation**:
  - Allocates Bed + Doctor + Equipment (Ventilator) as ONE atomic transaction
  - Step 1: Reserve Bed → Step 2: Reserve Doctor → Step 3: Reserve Equipment
  - If Doctor fails → Saga Compensation releases Bed
  - If Equipment fails → Saga Compensation releases Bed + Doctor
  - If all succeed → COMMIT all resources atomically
  - "Either the patient gets the complete resource set — or the hospital state returns to exactly where it was."

## `backend/src/services/simulationService.ts` — Added scenarios

- `runMultiResourceSuccess()` — Tests Bed + Doctor + Ventilator all-succeed path
- `runMultiResourceVentilatorFail()` — Tests Ventilator failure with automatic Bed + Doctor rollback

## `backend/src/controllers/transactionController.ts` — Added handler

- `createMultiResourceTransactionHandler` — API handler for multi-resource transactions

## `backend/src/routes/apiRoutes.ts` — Added route

- `POST /api/transactions/multi-resource` — New endpoint for atomic multi-resource allocation

## `backend/src/controllers/simulationController.ts` — Added cases

- `MULTI_RESOURCE_SUCCESS` — Simulation scenario for successful multi-resource allocation
- `MULTI_RESOURCE_VENTILATOR_FAIL` — Simulation scenario for ventilator failure with rollback
