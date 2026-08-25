import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma.js';
import { TransactionEngine } from '../engine/transactionEngine.js';
import { broadcastEvent } from '../websocket/broadcaster.js';
import {
  TransactionType, TransactionPriority, TransactionStatus,
  ResourceType, EventType, EventStatus, BedStatus, AdmissionStatus
} from '../types/domain.js';



export async function getTransactionsHandler(request: FastifyRequest, reply: FastifyReply) {
  const transactions = await prisma.transaction.findMany({
    include: {
      patient: true,
      events: { orderBy: { sequenceNumber: 'asc' } },
      conflicts: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return reply.send(transactions);
}

export async function getTransactionDetailHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const transaction = await prisma.transaction.findUnique({
    where: { id },
    include: {
      patient: true,
      events: { orderBy: { sequenceNumber: 'asc' } },
      conflicts: { include: { conflictingTransaction: true, winnerTransaction: true } },
      auditLogs: { include: { user: true } },
    },
  });

  if (!transaction) return reply.status(404).send({ error: 'Transaction not found' });
  return reply.send(transaction);
}



export async function createManualTransactionHandler(request: FastifyRequest, reply: FastifyReply) {
  const body = request.body as any;
  const result = await TransactionEngine.executeTransaction({
    transactionNumber: body.transactionNumber,
    patientId: body.patientId,
    initiatedBy: body.initiatedBy || 'SYSTEM',
    type: body.type,
    priority: body.priority,
    resourceType: body.resourceType,
    resourceId: body.resourceId,
    simulateFailureStep: body.simulateFailureStep,
  });
  return reply.send(result);
}

export async function createPendingBedRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  const { patientId, departmentId, doctorId, bedId, priority, reason, initiatedBy } = request.body as any;

  if (!patientId || !bedId) {
    return reply.status(400).send({ error: 'Patient and Bed are required' });
  }

  const txNumber = `REQ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const transaction = await prisma.transaction.create({
    data: {
      transactionNumber: txNumber,
      patientId,
      initiatedBy: initiatedBy || doctorId || 'DOCTOR',
      type: TransactionType.PATIENT_ADMISSION,
      priority: priority || TransactionPriority.ROUTINE,
      status: TransactionStatus.REQUESTED, // REQUESTED represents Pending
      resourceType: ResourceType.BED,
      resourceId: bedId,
    },
    include: {
      patient: true,
    },
  });

  await prisma.event.create({
    data: {
      eventId: `EVT-${transaction.id}-1`,
      transactionId: transaction.id,
      eventType: EventType.RESOURCE_REQUESTED,
      sequenceNumber: 1,
      payload: JSON.stringify({ bedId, priority, departmentId, doctorId, reason }),
      status: EventStatus.PROCESSED,
      processedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: initiatedBy || 'DOCTOR',
      transactionId: transaction.id,
      action: 'BED_REQUEST_SUBMITTED',
      entityType: 'Bed',
      entityId: bedId,
      newState: TransactionStatus.REQUESTED,
      reason: reason || 'Bed admission requested by doctor. Pending allocation approval.',
    },
  });

  broadcastEvent('transaction:created', { transaction, message: 'Bed request sent.' });
  return reply.send({ transaction, message: 'Bed request sent.' });
}

export async function acceptBedRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { acceptedBy } = (request.body as any) || {};

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: { patient: true, events: true },
  });

  if (!tx) return reply.status(404).send({ error: 'Request not found' });
  if (tx.status === TransactionStatus.COMMITTED) {
    return reply.status(400).send({ error: 'Request is already approved and completed.' });
  }

  let departmentId = undefined;
  let doctorId = undefined;
  let reason = undefined;

  const firstEvt = tx.events.find((e) => e.eventType === EventType.RESOURCE_REQUESTED);
  if (firstEvt && firstEvt.payload) {
    try {
      const p = JSON.parse(firstEvt.payload);
      departmentId = p.departmentId;
      doctorId = p.doctorId;
      reason = p.reason;
    } catch (e) {}
  }

  // 1. Update Bed Status to OCCUPIED
  const bed = await prisma.bed.update({
    where: { id: tx.resourceId },
    data: {
      status: BedStatus.OCCUPIED,
      currentPatientId: tx.patientId || null,
    },
    include: { department: true },
  });

  // 2. Create or Update Admission if patient exists
  let admission = null;
  if (tx.patientId) {
    let activeDoctor = doctorId;
    if (!activeDoctor) {
      const doc = await prisma.doctor.findFirst({ where: { availabilityStatus: 'AVAILABLE' } });
      activeDoctor = doc?.id;
    }

    admission = await prisma.admission.create({
      data: {
        patientId: tx.patientId,
        doctorId: activeDoctor || '',
        departmentId: departmentId || bed.departmentId,
        bedId: bed.id,
        admissionDate: new Date(),
        status: AdmissionStatus.ADMITTED,
        reason: reason || 'Bed Request Approved by Department Admin',
      },
    });
  }

  // 3. Update Transaction status to COMMITTED
  const updatedTx = await prisma.transaction.update({
    where: { id },
    data: {
      status: TransactionStatus.COMMITTED,
    },
    include: { patient: true, events: true },
  });

  // 4. Audit Log
  await prisma.auditLog.create({
    data: {
      userId: acceptedBy || 'RESOURCE_MANAGER',
      transactionId: tx.id,
      action: 'BED_REQUEST_APPROVED',
      entityType: 'Bed',
      entityId: bed.id,
      oldState: 'RESERVED',
      newState: 'OCCUPIED',
      reason: `Bed ${bed.bedNumber} request approved and allocated to patient.`,
    },
  });

  broadcastEvent('transaction:updated', {
    transaction: updatedTx,
    status: 'COMMITTED',
    bedNumber: bed.bedNumber,
    message: `Bed Request Approved! Bed ${bed.bedNumber} allocated.`,
  });
  broadcastEvent('resource:updated', { resourceType: 'BED', resource: bed });

  return reply.send({
    transaction: updatedTx,
    bedNumber: bed.bedNumber,
    admission,
    message: `Bed request approved! Bed ${bed.bedNumber} allocated successfully.`,
  });
}


export async function rejectBedRequestHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { rejectedBy, reason } = request.body as any;

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: { patient: true },
  });

  if (!tx) return reply.status(404).send({ error: 'Request not found' });

  const rejectedTx = await prisma.transaction.update({
    where: { id },
    data: {
      status: TransactionStatus.CANCELLED,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: rejectedBy || 'RESOURCE_MANAGER',
      transactionId: tx.id,
      action: 'BED_REQUEST_REJECTED',
      entityType: 'Bed',
      entityId: tx.resourceId,
      oldState: tx.status,
      newState: TransactionStatus.CANCELLED,
      reason: reason || 'Bed request rejected by Resource Manager.',
    },
  });

  broadcastEvent('transaction:updated', {
    transaction: rejectedTx,
    status: 'REJECTED',
    message: 'Bed request rejected.',
  });

  return reply.send({
    transaction: rejectedTx,
    message: 'Bed request rejected.',
  });
}

export async function offerAlternativeBedHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { newBedId, offeredBy, reason } = request.body as any;

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: { patient: true, events: true },
  });

  if (!tx) return reply.status(404).send({ error: 'Request not found' });
  if (!newBedId) return reply.status(400).send({ error: 'Alternative bed ID is required' });

  let departmentId = undefined;
  let doctorId = undefined;

  const firstEvt = tx.events.find((e) => e.eventType === EventType.RESOURCE_REQUESTED);
  if (firstEvt && firstEvt.payload) {
    try {
      const p = JSON.parse(firstEvt.payload);
      departmentId = p.departmentId;
      doctorId = p.doctorId;
    } catch (e) {}
  }

  const result = await TransactionEngine.executeTransaction({
    transactionNumber: tx.transactionNumber,
    patientId: tx.patientId || undefined,
    initiatedBy: offeredBy || 'DEPARTMENT_ADMIN',
    type: tx.type,
    priority: tx.priority,
    resourceType: ResourceType.BED,
    resourceId: newBedId,
    departmentId,
    doctorId,
    reason: reason || 'Offered alternative bed at another department.',
  });

  const bed = await prisma.bed.findUnique({
    where: { id: newBedId },
    include: { department: true },
  });
  const bedNumber = bed?.bedNumber || 'BED';
  const deptName = bed?.department?.name || 'Department';

  broadcastEvent('transaction:updated', {
    transaction: result.transaction,
    status: 'APPROVED',
    bedNumber,
    message: `Alternative bed ${bedNumber} in ${deptName} offered and assigned.`,
  });

  return reply.send({
    result,
    bedNumber,
    deptName,
    message: `Alternative bed ${bedNumber} in ${deptName} offered and assigned.`,
  });
}

export async function getConflictsHandler(request: FastifyRequest, reply: FastifyReply) {
  const conflicts = await prisma.conflict.findMany({
    include: {
      transaction: { include: { patient: true } },
      conflictingTransaction: { include: { patient: true } },
      winnerTransaction: { include: { patient: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return reply.send(conflicts);
}

export async function overrideConflictHandler(request: FastifyRequest, reply: FastifyReply) {
  const { conflictId, winnerTransactionId, reason, userId } = request.body as any;

  const conflict = await prisma.conflict.findUnique({ where: { id: conflictId } });
  if (!conflict) return reply.status(404).send({ error: 'Conflict record not found' });

  const updatedConflict = await prisma.conflict.update({
    where: { id: conflictId },
    data: {
      winnerTransactionId,
      status: 'OVERRIDDEN',
      reason: `Manual Admin Override: ${reason}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: userId || 'ADMIN',
      action: 'OVERRIDE_CONFLICT',
      entityType: 'Conflict',
      entityId: conflictId,
      oldState: conflict.status,
      newState: 'OVERRIDDEN',
      reason: `Conflict overridden manually for winner TX ${winnerTransactionId}. Reason: ${reason}`,
    },
  });

  broadcastEvent('conflict:updated', updatedConflict);
  return reply.send(updatedConflict);
}

export async function getAuditLogsHandler(request: FastifyRequest, reply: FastifyReply) {
  const logs = await prisma.auditLog.findMany({
    include: { user: true, transaction: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return reply.send(logs);
}

export async function getEventsHandler(request: FastifyRequest, reply: FastifyReply) {
  const events = await prisma.event.findMany({
    include: { transaction: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return reply.send(events);
}
