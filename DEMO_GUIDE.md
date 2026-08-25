# Demo & Presentation Guide — H-02 Clinical Resource Transaction System

## Step 0: Setup (One-Time)

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
npm run db:push       # Creates SQLite database
npm run seed          # Populates sample hospital data
```

## Step 1: Start the App

```bash
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## Step 2: Login

Go to http://localhost:3000 and login with:

| Role            | Email                      | Password      |
|-----------------|----------------------------|---------------|
| Super Admin     | superadmin@hospital.com    | password123   |
| Platform Owner  | owner@hospitalecho.com     | password123   |

Login as **Super Admin** to access all dashboards including the Simulation Lab.

---

## Feature 1: ICU Bed Allocation — Who Gets the Resource?

**What to show:** Two patients (Emergency vs Routine) request the same ICU bed → Emergency wins deterministically.

### Demo Steps

1. Navigate to **Simulation Lab** in the sidebar.
2. Click **"Resource Conflict Resolution"** button.
3. Show the JSON result:
   - `requestA` (EMERGENCY) → status: `COMMITTED` (winner)
   - `requestB` (ROUTINE) → status: `ESCALATED` (conflict logged)
   - `conflictLogged: true`

### What to Explain

> "Both requests enter the allocation engine. The system evaluates clinical priority. Emergency receives deterministic priority. The resource is allocated to the appropriate patient. The other request is marked as conflicted."

### Optional API Call (Postman / curl)

```
POST http://localhost:5000/api/simulation/run
Body: { "scenario": "CONFLICT" }
```

---

## Feature 2: Atomic Multi-Resource Allocation (Bed + Doctor + Ventilator)

### Demo 2A: All Succeed

1. In the Simulation Lab, click **"Multi-Resource Atomic (Success)"**.
2. Show the JSON result:
   - `finalStatus: "COMMITTED"`
   - `allAllocated: true`
   - `resources.bed.statusAfter: "OCCUPIED"`
   - `resources.doctor.statusAfter: "BUSY"`
   - `resources.equipment.statusAfter: "IN_USE"`

### What to Explain

> "All 3 resources were allocated atomically as one transaction. The patient got the complete resource set."

### Demo 2B: Ventilator Fails → Everything Rolls Back

1. Click **"Multi-Resource Rollback (Ventilator Fail)"**.
2. Show the JSON result:
   - `finalStatus: "ROLLED_BACK"`
   - `bedReleased: true` (back to AVAILABLE)
   - `doctorReleased: true` (back to AVAILABLE)
   - `compensationExecuted: true`

### What to Explain

> "The bed was available, the doctor was available, but the ventilator wasn't. Instead of leaving the bed and doctor dangling, the system automatically released them via Saga Compensation. Either the patient gets the complete resource set — or the hospital state returns to exactly where it was."

### Optional API Call

```
POST http://localhost:5000/api/transactions/multi-resource
Body: {
  "patientId": "<patient-id>",
  "initiatedBy": "<user-id>",
  "priority": "EMERGENCY",
  "bedId": "<bed-id>",
  "doctorId": "<doctor-id>",
  "equipmentId": "<equipment-id>"
}
```

---

## Feature 3: Multiple Requests at the Same Time — Concurrency Control

### Demo 3A: 100 Concurrent Requests

1. In the Simulation Lab, click **"100 Requests"** under Stress Test.
2. Show the dashboard result:
   - **Successful Transactions: 1** (only 1 winner)
   - **Double Allocations: 0** (VERIFIED 100% CORRECT)
   - **Conflicts Escalated: 99** (all others safely rejected)

### What to Explain

> "100 requests arrived at the same time for 1 ICU bed. The engine serialized them through the priority-aware lock manager, processed the highest priority first, and guaranteed zero double allocations."

### Demo 3B: 1000 Concurrent Requests

1. Click **"1000 Requests"**.
2. Show the same metrics — emphasize:
   - **Double Allocations: 0**
   - Throughput (requests/sec)
   - Average response time

### What to Explain

> "Even with 1000 parallel requests, the system maintains a coherent operational state. No race conditions, no double bookings."

---

## Bonus Demos (If Time Permits)

| Button                        | What It Shows                                                        |
|-------------------------------|----------------------------------------------------------------------|
| Idempotency Protection        | Same TX submitted twice → only 1 allocation, `isDuplicate: true`     |
| Out-of-Order Event Handling   | Event #5 sent before #2 → flagged `OUT_OF_ORDER`, state protected    |
| Saga Compensation & Rollback  | Original saga demo with simulated equipment failure                  |

---

## Pages to Navigate During Demo

| Page               | What to Show                                                    |
|--------------------|-----------------------------------------------------------------|
| Transaction Center | All transactions with status (COMMITTED, ESCALATED, ROLLED_BACK)|
| Conflict Center    | All conflicts with winner/loser and override capability         |
| Audit Page         | Full audit trail of every decision the system made              |
| Beds Page          | Real-time bed status (AVAILABLE, OCCUPIED, RESERVED)            |

---

## Key Talking Points

1. **"Every resource decision is modeled as an explicit transaction"** — not just a database update.
2. **"Priority is deterministic, not first-come-first-served"** — EMERGENCY always beats ROUTINE.
3. **"Either the patient gets everything or the hospital state resets"** — atomic multi-resource with saga rollback.
4. **"Zero double allocations verified under 1000 concurrent requests"** — the number on screen proves it.
