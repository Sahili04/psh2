import { prisma } from '../config/prisma.js';
import { resourceLockManager } from './lockManager.js';
import { comparePriority, isHigherPriority } from './priorityEngine.js';
import { broadcastEvent } from '../websocket/broadcaster.js';
import {
  TransactionType, TransactionPriority, TransactionStatus,
  ResourceType, EventType, EventStatus, BedStatus, EquipmentStatus,
  OTStatus, ConflictStatus, AdmissionStatus
} from '../types/domain.js';

export interface CreateTransactionParams {
  transactionNumber?: string;
  patientId?: string;
  initiatedBy: string;
  type: string;
  priority: string;
  resourceType: string;
  resourceId: string;
  doctorId?: string;
  departmentId?: string;
  reason?: string;
  equipmentId?: string;
  simulateFailureStep?: string; // Optional failure injection for demo (e.g. 'EQUIPMENT_FAILED' or 'DOCTOR_FAILED')
}

export interface TransactionResult {
  transaction: any;
  status: string;
  events: any[];
  admission?: any;
  conflict?: any;
  isDuplicate?: boolean;
  message: string;
}

export class TransactionEngine {

  /**
   * Main Transaction Orchestrator with locking, idempotency, conflict check, and saga compensation.
   */
  static async executeTransaction(params: CreateTransactionParams): Promise<TransactionResult> {
    const txNumber = params.transactionNumber || `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const resourceKey = `${params.resourceType}:${params.resourceId}`;

    // Acquire lock per resource to serialize competing operations
    return await resourceLockManager.acquireLock(resourceKey, async () => {
      // 1. Idempotency Check
      const existingTx = await prisma.transaction.findUnique({
        where: { transactionNumber: txNumber },
        include: { events: true, conflicts: true },
      });

      if (existingTx) {
        // Find existing admission if present
        let existingAdmission = null;
        if (existingTx.patientId) {
          existingAdmission = await prisma.admission.findFirst({
            where: { patientId: existingTx.patientId },
            include: { patient: true, doctor: { include: { user: true } }, bed: true },
          });
        }

        // Record duplicate attempt event
        const dupEvent = await prisma.event.create({
          data: {
            eventId: `EVT-DUP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            transactionId: existingTx.id,
            eventType: EventType.RESOURCE_REQUESTED,
            sequenceNumber: existingTx.events.length + 1,
            payload: JSON.stringify({ duplicateTxNumber: txNumber, timestamp: new Date() }),
            status: EventStatus.DUPLICATE,
            processedAt: new Date(),
          },
        });

        await prisma.auditLog.create({
          data: {
            userId: params.initiatedBy,
            transactionId: existingTx.id,
            action: 'IDEMPOTENCY_DUPLICATE_DETECTED',
            entityType: 'Transaction',
            entityId: existingTx.id,
            newState: existingTx.status,
            reason: `Duplicate transaction attempt for ${txNumber}. Request ignored safely.`,
          },
        });

        broadcastEvent('transaction:updated', { transaction: existingTx, isDuplicate: true });

        return {
          transaction: existingTx,
          status: existingTx.status,
          events: [...existingTx.events, dupEvent],
          admission: existingAdmission,
          isDuplicate: true,
          message: `Request already completed. Transaction ${txNumber} exists in state ${existingTx.status}.`,
        };
      }

      // 2. Begin New Transaction Workflow inside DB transaction
      return await prisma.$transaction(async (db) => {
        // Create initial transaction record in REQUESTED state
        const transaction = await db.transaction.create({
          data: {
            transactionNumber: txNumber,
            patientId: params.patientId || null,
            initiatedBy: params.initiatedBy,
            type: params.type,
            priority: params.priority,
            status: TransactionStatus.REQUESTED,
            resourceType: params.resourceType,
            resourceId: params.resourceId,
          },
        });

        const eventsList: any[] = [];

        // Log Event #1: RESOURCE_REQUESTED
        const evt1 = await db.event.create({
          data: {
            eventId: `EVT-${transaction.id}-1`,
            transactionId: transaction.id,
            eventType: EventType.RESOURCE_REQUESTED,
            sequenceNumber: 1,
            payload: JSON.stringify({ resourceType: params.resourceType, resourceId: params.resourceId, priority: params.priority }),
            status: EventStatus.PROCESSED,
            processedAt: new Date(),
          },
        });
        eventsList.push(evt1);

        // 3. VALIDATE & LOCK RESOURCE
        await db.transaction.update({
          where: { id: transaction.id },
          data: { status: TransactionStatus.VALIDATING },
        });

        const evt2 = await db.event.create({
          data: {
            eventId: `EVT-${transaction.id}-2`,
            transactionId: transaction.id,
            eventType: EventType.RESOURCE_LOCK_ACQUIRED,
            sequenceNumber: 2,
            payload: JSON.stringify({ resourceKey, lockedAt: new Date() }),
            status: EventStatus.PROCESSED,
            processedAt: new Date(),
          },
        });
        eventsList.push(evt2);

        // 4. CHECK CONFLICT & AVAILABILITY
        let resourceAvailable = false;
        let activeHolderTx: any = null;

        if (params.resourceType === ResourceType.BED) {
          const bed = await db.bed.findUnique({ where: { id: params.resourceId } });
          if (bed && bed.status === BedStatus.AVAILABLE) {
            const pendingTx = await db.transaction.findFirst({
              where: {
                resourceId: params.resourceId,
                id: { not: transaction.id },
                status: {
                  in: [
                    TransactionStatus.REQUESTED,
                    TransactionStatus.VALIDATING,
                    TransactionStatus.PROCESSING,
                    TransactionStatus.RESERVED,
                  ],
                },
              },
              orderBy: { createdAt: 'desc' },
            });

            if (!pendingTx) {
              resourceAvailable = true;
            } else {
              resourceAvailable = false;
              activeHolderTx = pendingTx;
            }
          } else if (bed) {
            resourceAvailable = false;
            activeHolderTx = await db.transaction.findFirst({
              where: {
                resourceId: params.resourceId,
                id: { not: transaction.id },
                status: { in: [TransactionStatus.RESERVED, TransactionStatus.COMMITTED, TransactionStatus.PROCESSING] },
              },
              orderBy: { createdAt: 'desc' },
            });
          }
        } else if (params.resourceType === ResourceType.EQUIPMENT) {
          const eq = await db.equipment.findUnique({ where: { id: params.resourceId } });
          if (eq && eq.status === EquipmentStatus.AVAILABLE) {
            resourceAvailable = true;
          }
        } else if (params.resourceType === ResourceType.OT) {
          const ot = await db.operationTheatre.findUnique({ where: { id: params.resourceId } });
          if (ot && ot.status === OTStatus.AVAILABLE) {
            resourceAvailable = true;
          }
        }

        // Check explicit Doctor Failure simulation
        if (params.simulateFailureStep === 'DOCTOR_FAILED') {
          resourceAvailable = false;
        }

        // 5. PRIORITY RESOLUTION & CONFLICT HANDLING
        if (!resourceAvailable) {
          let conflictWinnerId: string | null = null;
          let isWinner = false;

          if (
            activeHolderTx &&
            activeHolderTx.status !== TransactionStatus.COMMITTED &&
            isHigherPriority(params.priority, activeHolderTx.priority)
          ) {
            // New request is higher priority than pending/uncommitted holder -> New wins!
            isWinner = true;
            conflictWinnerId = transaction.id;
          }

          if (!isWinner) {
            // Request lost conflict -> Escalate & Reject
            const updatedTx = await db.transaction.update({
              where: { id: transaction.id },
              data: { status: TransactionStatus.ESCALATED },
            });

            const conflict = await db.conflict.create({
              data: {
                transactionId: transaction.id,
                resourceId: params.resourceId,
                conflictingTransactionId: activeHolderTx ? activeHolderTx.id : transaction.id,
                winnerTransactionId: activeHolderTx ? activeHolderTx.id : null,
                reason: `Resource ${params.resourceId} unavailable. Priority ${params.priority} lost against existing holder/rule.`,
                status: ConflictStatus.OPEN,
              },
            });

            await db.auditLog.create({
              data: {
                userId: params.initiatedBy,
                transactionId: transaction.id,
                action: 'TRANSACTION_CONFLICT_ESCALATED',
                entityType: 'Resource',
                entityId: params.resourceId,
                newState: TransactionStatus.ESCALATED,
                reason: conflict.reason,
              },
            });

            broadcastEvent('conflict:created', { conflict, transaction: updatedTx });
            broadcastEvent('transaction:updated', { transaction: updatedTx });

            return {
              transaction: updatedTx,
              status: TransactionStatus.ESCALATED,
              events: eventsList,
              conflict,
              message: `Conflict detected on resource ${params.resourceId}. Request escalated due to priority.`,
            };
          }
        }

        // 6. RESERVE RESOURCE & EXECUTE WORKFLOW
        await db.transaction.update({
          where: { id: transaction.id },
          data: { status: TransactionStatus.RESERVED },
        });

        // Reserve resource in DB
        if (params.resourceType === ResourceType.BED) {
          await db.bed.update({
            where: { id: params.resourceId },
            data: { status: BedStatus.RESERVED, currentPatientId: params.patientId || null },
          });
        } else if (params.resourceType === ResourceType.EQUIPMENT) {
          await db.equipment.update({
            where: { id: params.resourceId },
            data: { status: EquipmentStatus.RESERVED, currentPatientId: params.patientId || null },
          });
        }

        const evt3 = await db.event.create({
          data: {
            eventId: `EVT-${transaction.id}-3`,
            transactionId: transaction.id,
            eventType: EventType.RESOURCE_RESERVED,
            sequenceNumber: 3,
            payload: JSON.stringify({ resourceId: params.resourceId, reservedAt: new Date() }),
            status: EventStatus.PROCESSED,
            processedAt: new Date(),
          },
        });
        eventsList.push(evt3);

        // 7. CHECK MULTI-RESOURCE & PARTIAL FAILURE / COMPENSATING SAGA
        if (params.simulateFailureStep === 'EQUIPMENT_FAILED' || params.simulateFailureStep === 'PARTIAL_FAILURE') {
          // Trigger Saga Compensation!
          await db.transaction.update({
            where: { id: transaction.id },
            data: { status: TransactionStatus.COMPENSATING },
          });

          const evtFail = await db.event.create({
            data: {
              eventId: `EVT-${transaction.id}-4-FAIL`,
              transactionId: transaction.id,
              eventType: EventType.RESOURCE_FAILED,
              sequenceNumber: 4,
              payload: JSON.stringify({ step: 'EQUIPMENT_ALLOCATION', reason: 'Equipment allocation failed / secondary resource offline' }),
              status: EventStatus.PROCESSED,
              processedAt: new Date(),
            },
          });
          eventsList.push(evtFail);

          const evtComp = await db.event.create({
            data: {
              eventId: `EVT-${transaction.id}-5-COMP`,
              transactionId: transaction.id,
              eventType: EventType.COMPENSATION_STARTED,
              sequenceNumber: 5,
              payload: JSON.stringify({ action: 'RELEASING_BED_AND_DOCTOR' }),
              status: EventStatus.PROCESSED,
              processedAt: new Date(),
            },
          });
          eventsList.push(evtComp);

          // Undo Step: Release reserved bed
          if (params.resourceType === ResourceType.BED) {
            await db.bed.update({
              where: { id: params.resourceId },
              data: { status: BedStatus.AVAILABLE, currentPatientId: null },
            });
          }

          const evtRel = await db.event.create({
            data: {
              eventId: `EVT-${transaction.id}-6-REL`,
              transactionId: transaction.id,
              eventType: EventType.RESOURCE_RELEASED,
              sequenceNumber: 6,
              payload: JSON.stringify({ resourceId: params.resourceId, releasedAt: new Date() }),
              status: EventStatus.PROCESSED,
              processedAt: new Date(),
            },
          });
          eventsList.push(evtRel);

          const rolledBackTx = await db.transaction.update({
            where: { id: transaction.id },
            data: { status: TransactionStatus.ROLLED_BACK },
          });

          const evtRoll = await db.event.create({
            data: {
              eventId: `EVT-${transaction.id}-7-ROLL`,
              transactionId: transaction.id,
              eventType: EventType.ROLLED_BACK,
              sequenceNumber: 7,
              payload: JSON.stringify({ status: 'ROLLED_BACK', compensatedAt: new Date() }),
              status: EventStatus.PROCESSED,
              processedAt: new Date(),
            },
          });
          eventsList.push(evtRoll);

          await db.auditLog.create({
            data: {
              userId: params.initiatedBy,
              transactionId: transaction.id,
              action: 'SAGA_COMPENSATION_COMPLETED',
              entityType: 'Transaction',
              entityId: transaction.id,
              oldState: TransactionStatus.PROCESSING,
              newState: TransactionStatus.ROLLED_BACK,
              reason: 'Partial failure detected during multi-resource workflow. Resources successfully compensated and released.',
            },
          });

          broadcastEvent('transaction:updated', { transaction: rolledBackTx });

          return {
            transaction: rolledBackTx,
            status: TransactionStatus.ROLLED_BACK,
            events: eventsList,
            message: 'Partial failure triggered Saga Compensation. All reserved resources released, transaction safely rolled back.',
          };
        }

        // 8. COMMIT WORKFLOW ATOMICALLY
        let createdAdmission: any = null;
        if (params.resourceType === ResourceType.BED) {
          await db.bed.update({
            where: { id: params.resourceId },
            data: { status: BedStatus.OCCUPIED, currentPatientId: params.patientId || null },
          });

          // Create Admission and update Patient status inside SAME atomic DB transaction!
          if (params.patientId && (params.type === TransactionType.PATIENT_ADMISSION || params.type === TransactionType.PATIENT_TRANSFER)) {
            createdAdmission = await db.admission.create({
              data: {
                patientId: params.patientId,
                doctorId: params.doctorId || 'DOC-DEFAULT',
                departmentId: params.departmentId || 'DEPT-DEFAULT',
                bedId: params.resourceId,
                status: AdmissionStatus.ADMITTED,
                reason: params.reason || 'Patient Hospital Admission',
              },
              include: { patient: true, doctor: { include: { user: true } }, bed: true },
            });

            await db.patient.update({
              where: { id: params.patientId },
              data: { status: 'ADMITTED' },
            });
          }
        } else if (params.resourceType === ResourceType.EQUIPMENT) {
          await db.equipment.update({
            where: { id: params.resourceId },
            data: { status: EquipmentStatus.IN_USE, currentPatientId: params.patientId || null },
          });
        }

        const committedTx = await db.transaction.update({
          where: { id: transaction.id },
          data: { status: TransactionStatus.COMMITTED },
        });

        const evtCommit = await db.event.create({
          data: {
            eventId: `EVT-${transaction.id}-4-COMMIT`,
            transactionId: transaction.id,
            eventType: EventType.COMMITTED,
            sequenceNumber: 4,
            payload: JSON.stringify({ committedAt: new Date(), resourceId: params.resourceId }),
            status: EventStatus.PROCESSED,
            processedAt: new Date(),
          },
        });
        eventsList.push(evtCommit);

        await db.auditLog.create({
          data: {
            userId: params.initiatedBy,
            transactionId: transaction.id,
            action: 'TRANSACTION_COMMITTED',
            entityType: params.resourceType,
            entityId: params.resourceId,
            newState: TransactionStatus.COMMITTED,
            reason: `Resource ${params.resourceId} allocated and committed successfully.`,
          },
        });

        broadcastEvent('transaction:updated', { transaction: committedTx });
        broadcastEvent('resource:updated', { resourceType: params.resourceType, resourceId: params.resourceId });

        return {
          transaction: committedTx,
          status: TransactionStatus.COMMITTED,
          events: eventsList,
          admission: createdAdmission,
          message: `Transaction ${txNumber} committed successfully. Resource ${params.resourceId} allocated.`,
        };
      });
    });
  }

  /**
   * Process Out-of-Order Event Simulation
   */
  static async processOutOfOrderEvent(transactionId: string, eventType: string, sequenceNumber: number, payload: any) {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { events: true },
    });

    if (!transaction) throw new Error('Transaction not found');

    const expectedSeq = transaction.events.length + 1;
    const isOutOfOrder = sequenceNumber !== expectedSeq;

    const event = await prisma.event.create({
      data: {
        eventId: `EVT-${transactionId}-${sequenceNumber}-${Date.now()}`,
        transactionId,
        eventType: eventType as any,
        sequenceNumber,
        payload: JSON.stringify(payload),
        status: isOutOfOrder ? EventStatus.OUT_OF_ORDER : EventStatus.PROCESSED,
        processedAt: isOutOfOrder ? null : new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: transaction.initiatedBy,
        transactionId: transaction.id,
        action: isOutOfOrder ? 'EVENT_OUT_OF_ORDER_DETECTED' : 'EVENT_PROCESSED',
        entityType: 'Event',
        entityId: event.id,
        newState: event.status,
        reason: isOutOfOrder
          ? `Out-of-order event sequence ${sequenceNumber} received (Expected ${expectedSeq}). Flagged OUT_OF_ORDER to prevent state corruption.`
          : `Event sequence ${sequenceNumber} processed successfully.`,
      },
    });

    broadcastEvent('event:created', { event, transaction });
    return { event, isOutOfOrder, expectedSeq };
  }
}
