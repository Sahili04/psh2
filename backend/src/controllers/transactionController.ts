import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma.js';
import { TransactionEngine } from '../engine/transactionEngine.js';
import { broadcastEvent } from '../websocket/broadcaster.js';

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
