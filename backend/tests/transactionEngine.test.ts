import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/config/prisma.js';
import { TransactionEngine } from '../src/engine/transactionEngine.js';
import { TransactionPriority, ResourceType, TransactionType } from '../src/types/domain.js';

describe('H-02 Transaction Engine Tests', () => {

  beforeAll(async () => {
    // Ensure clean bed state before tests
    const icuBed = await prisma.bed.findFirst({ where: { type: 'ICU' } });
    if (icuBed) {
      await prisma.bed.update({
        where: { id: icuBed.id },
        data: { status: 'AVAILABLE', currentPatientId: null },
      });
    }
  });

  it('1000 Concurrent Requests Test -> Same ICU Bed -> Assert Successful Allocations === 1 & Double Allocations === 0', async () => {
    let targetBed = await prisma.bed.findFirst({ where: { type: 'ICU' } });
    if (!targetBed) targetBed = await prisma.bed.findFirst();

    // Force bed to AVAILABLE
    await prisma.bed.update({
      where: { id: targetBed!.id },
      data: { status: 'AVAILABLE', currentPatientId: null },
    });

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const concurrencyCount = 1000;
    const requests: Promise<any>[] = [];

    for (let i = 1; i <= concurrencyCount; i++) {
      const p = TransactionEngine.executeTransaction({
        transactionNumber: `TEST-STRESS-1000-${Date.now()}-${i}`,
        initiatedBy: adminUser!.id,
        type: TransactionType.BED_ALLOCATION,
        priority: i % 2 === 0 ? TransactionPriority.EMERGENCY : TransactionPriority.ROUTINE,
        resourceType: ResourceType.BED,
        resourceId: targetBed!.id,
      }).catch((err) => ({ status: 'ERROR', error: err.message }));

      requests.push(p);
    }

    const results = await Promise.all(requests);

    let committedCount = 0;
    let escalatedCount = 0;

    for (const r of results) {
      if (r.status === 'COMMITTED') committedCount++;
      if (r.status === 'ESCALATED') escalatedCount++;
    }

    const doubleAllocations = Math.max(0, committedCount - 1);

    expect(committedCount).toBe(1);
    expect(doubleAllocations).toBe(0);
    expect(escalatedCount).toBe(concurrencyCount - 1);
  }, 40000);

  it('Idempotency Test -> Same TX Number Submitted Twice -> Assert No Double Allocation', async () => {
    const bed = await prisma.bed.findFirst({ where: { status: 'AVAILABLE' } }) || await prisma.bed.findFirst();
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const txNum = `TEST-IDEMPOTENT-${Date.now()}`;

    const res1 = await TransactionEngine.executeTransaction({
      transactionNumber: txNum,
      initiatedBy: adminUser!.id,
      type: TransactionType.BED_ALLOCATION,
      priority: TransactionPriority.URGENT,
      resourceType: ResourceType.BED,
      resourceId: bed!.id,
    });

    const res2 = await TransactionEngine.executeTransaction({
      transactionNumber: txNum,
      initiatedBy: adminUser!.id,
      type: TransactionType.BED_ALLOCATION,
      priority: TransactionPriority.URGENT,
      resourceType: ResourceType.BED,
      resourceId: bed!.id,
    });

    expect(res1.status).toBe('COMMITTED');
    expect(res2.isDuplicate).toBe(true);
    expect(res2.status).toBe('COMMITTED');
  }, 10000);

  it('Partial Failure Test -> Trigger Saga Compensation -> Assert Bed Released & Status ROLLED_BACK', async () => {
    let bed = await prisma.bed.findFirst({ where: { type: 'ICU' } });
    await prisma.bed.update({ where: { id: bed!.id }, data: { status: 'AVAILABLE', currentPatientId: null } });

    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

    const res = await TransactionEngine.executeTransaction({
      transactionNumber: `TEST-SAGA-${Date.now()}`,
      initiatedBy: adminUser!.id,
      type: TransactionType.MULTI_RESOURCE_ADMISSION,
      priority: TransactionPriority.EMERGENCY,
      resourceType: ResourceType.BED,
      resourceId: bed!.id,
      simulateFailureStep: 'EQUIPMENT_FAILED',
    });

    expect(res.status).toBe('ROLLED_BACK');

    const bedAfter = await prisma.bed.findUnique({ where: { id: bed!.id } });
    expect(bedAfter?.status).toBe('AVAILABLE');
  }, 10000);
});
