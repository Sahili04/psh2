import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma.js';
import { TransactionEngine } from '../engine/transactionEngine.js';
import { ResourceType, TransactionType, BedStatus, EquipmentStatus, OTStatus } from '../types/domain.js';
import { broadcastEvent } from '../websocket/broadcaster.js';

export async function getBedsHandler(request: FastifyRequest, reply: FastifyReply) {
  const beds = await prisma.bed.findMany({
    include: { department: true },
    orderBy: { bedNumber: 'asc' },
  });
  return reply.send(beds);
}

export async function createBedHandler(request: FastifyRequest, reply: FastifyReply) {
  const { bedNumber, type, departmentId, floor } = request.body as any;
  const bed = await prisma.bed.create({
    data: {
      bedNumber,
      type,
      departmentId,
      floor: parseInt(floor, 10),
      status: BedStatus.AVAILABLE,
    },
    include: { department: true },
  });
  broadcastEvent('resource:created', { resourceType: 'BED', resource: bed });
  return reply.status(201).send(bed);
}

export async function updateBedStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { status, currentPatientId } = request.body as any;
  const bed = await prisma.bed.update({
    where: { id },
    data: { status, currentPatientId: currentPatientId || null },
    include: { department: true },
  });
  broadcastEvent('resource:updated', { resourceType: 'BED', resource: bed });
  return reply.send(bed);
}

export async function reserveBedHandler(request: FastifyRequest, reply: FastifyReply) {
  const { bedId, patientId, priority, userId } = request.body as any;
  const result = await TransactionEngine.executeTransaction({
    initiatedBy: userId || 'SYSTEM',
    patientId,
    type: TransactionType.BED_ALLOCATION,
    priority: priority || 'ROUTINE',
    resourceType: ResourceType.BED,
    resourceId: bedId,
  });
  return reply.send(result);
}

export async function getDoctorsHandler(request: FastifyRequest, reply: FastifyReply) {
  const doctors = await prisma.doctor.findMany({
    include: {
      user: true,
      department: true,
      assignedPatients: { select: { id: true, name: true, patientNumber: true, status: true } },
    },
    orderBy: { specialization: 'asc' },
  });
  return reply.send(doctors);
}

export async function updateDoctorStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { availabilityStatus, shift } = request.body as any;

  if (availabilityStatus === 'OFF_SHIFT' || shift === 'OFF_SHIFT' || availabilityStatus === 'ON_LEAVE') {
    return endDoctorShiftHandler(request, reply);
  }

  const doctor = await prisma.doctor.update({
    where: { id },
    data: { availabilityStatus, shift },
    include: { user: true, department: true, assignedPatients: true },
  });
  broadcastEvent('resource:updated', { resourceType: 'DOCTOR', resource: doctor });
  return reply.send(doctor);
}

export async function endDoctorShiftHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { newAvailabilityStatus } = (request.body as any) || {};

  const currentDoctor = await prisma.doctor.findUnique({
    where: { id },
    include: { user: true, department: true, assignedPatients: true },
  });

  if (!currentDoctor) return reply.status(404).send({ error: 'Doctor not found' });

  const nextStatus = newAvailabilityStatus || 'OFF_SHIFT';
  const updatedDoc = await prisma.doctor.update({
    where: { id },
    data: { availabilityStatus: nextStatus, shift: 'OFF_SHIFT' },
    include: { user: true, department: true },
  });

  const assignedPatients = await prisma.patient.findMany({
    where: { assignedDoctorId: id, status: { in: ['ACTIVE', 'ADMITTED'] } },
  });

  let reallocatedCount = 0;
  let targetDoctor: any = null;

  if (assignedPatients.length > 0) {
    let altDocs = await prisma.doctor.findMany({
      where: {
        id: { not: id },
        departmentId: currentDoctor.departmentId,
        availabilityStatus: 'AVAILABLE',
      },
      include: { assignedPatients: true, user: true, department: true },
    });

    if (altDocs.length === 0) {
      altDocs = await prisma.doctor.findMany({
        where: {
          id: { not: id },
          availabilityStatus: 'AVAILABLE',
        },
        include: { assignedPatients: true, user: true, department: true },
      });
    }

    if (altDocs.length > 0) {
      targetDoctor = altDocs.sort((a, b) => a.assignedPatients.length - b.assignedPatients.length)[0];

      for (const p of assignedPatients) {
        await prisma.patient.update({
          where: { id: p.id },
          data: { assignedDoctorId: targetDoctor.id },
        });

        await prisma.admission.updateMany({
          where: { patientId: p.id, status: 'ADMITTED' },
          data: { doctorId: targetDoctor.id },
        });
      }
      reallocatedCount = assignedPatients.length;
    }
  }

  const handoffPayload = {
    previousDoctorId: id,
    previousDoctorName: currentDoctor.user.name,
    newDoctorId: targetDoctor?.id || null,
    newDoctorName: targetDoctor?.user?.name || 'Duty Doctor Team',
    patientCount: reallocatedCount,
    patientNames: assignedPatients.map((p) => p.name),
    message: reallocatedCount > 0
      ? `Shift Handoff Complete: ${reallocatedCount} patient(s) reassigned from Dr. ${currentDoctor.user.name} to Dr. ${targetDoctor?.user?.name}.`
      : `Dr. ${currentDoctor.user.name}'s shift ended. No active patients needed handoff.`,
  };

  broadcastEvent('doctor:shift_ended', handoffPayload);
  broadcastEvent('patient:reassigned', handoffPayload);

  return reply.send({
    doctor: updatedDoc,
    handoff: handoffPayload,
  });
}


export async function getEquipmentHandler(request: FastifyRequest, reply: FastifyReply) {
  const equipment = await prisma.equipment.findMany({
    include: { department: true },
    orderBy: { name: 'asc' },
  });
  return reply.send(equipment);
}

export async function createEquipmentHandler(request: FastifyRequest, reply: FastifyReply) {
  const { name, type, serialNumber, departmentId, location } = request.body as any;
  const eq = await prisma.equipment.create({
    data: {
      name,
      type,
      serialNumber,
      departmentId,
      location,
      status: EquipmentStatus.AVAILABLE,
    },
    include: { department: true },
  });
  broadcastEvent('resource:created', { resourceType: 'EQUIPMENT', resource: eq });
  return reply.status(201).send(eq);
}

export async function updateEquipmentStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { status, location } = request.body as any;
  const eq = await prisma.equipment.update({
    where: { id },
    data: { status, location },
    include: { department: true },
  });
  broadcastEvent('resource:updated', { resourceType: 'EQUIPMENT', resource: eq });
  return reply.send(eq);
}

export async function surveyEquipmentHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { doctorName, adminName, assessorName, healthScore, calibrationStatus, batteryLevel, sensorAccuracy, nextSurveyDate, notes } = request.body as any;

  const assessor = adminName || assessorName || doctorName || 'Department Admin';
  const now = new Date();
  const nextDate = nextSurveyDate ? new Date(nextSurveyDate) : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const updatedEq = await prisma.equipment.update({
    where: { id },
    data: {
      healthScore: healthScore !== undefined ? parseInt(healthScore, 10) : 100,
      calibrationStatus: calibrationStatus || 'CALIBRATED',
      batteryLevel: batteryLevel !== undefined ? parseInt(batteryLevel, 10) : 100,
      sensorAccuracy: sensorAccuracy || '99.5%',
      lastSurveyDate: now,
      surveyedByDoctorName: assessor,
      nextSurveyDate: nextDate,
      surveyNotes: notes || 'Routine machine parameter inspection completed by Department Admin.',
    },
    include: { department: true, surveys: true },
  });

  const surveyLog = await prisma.equipmentSurvey.create({
    data: {
      equipmentId: id,
      doctorName: assessor,
      healthScore: healthScore !== undefined ? parseInt(healthScore, 10) : 100,
      calibrationStatus: calibrationStatus || 'CALIBRATED',
      batteryLevel: batteryLevel !== undefined ? parseInt(batteryLevel, 10) : 100,
      sensorAccuracy: sensorAccuracy || '99.5%',
      surveyDate: now,
      nextSurveyDate: nextDate,
      notes: notes || 'Routine machine parameter inspection completed by Department Admin.',
    },
  });

  broadcastEvent('resource:updated', { resourceType: 'EQUIPMENT', resource: updatedEq });
  return reply.send({ equipment: updatedEq, survey: surveyLog });
}

export async function getEquipmentSurveysHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const surveys = await prisma.equipmentSurvey.findMany({
    where: { equipmentId: id },
    orderBy: { surveyDate: 'desc' },
  });
  return reply.send(surveys);
}

export async function getOTsHandler(request: FastifyRequest, reply: FastifyReply) {
  const ots = await prisma.operationTheatre.findMany({
    include: { department: true },
    orderBy: { name: 'asc' },
  });
  return reply.send(ots);
}

export async function updateOTStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { status } = request.body as any;
  const ot = await prisma.operationTheatre.update({
    where: { id },
    data: { status },
    include: { department: true },
  });
  broadcastEvent('resource:updated', { resourceType: 'OT', resource: ot });
  return reply.send(ot);
}

export async function getDepartmentsHandler(request: FastifyRequest, reply: FastifyReply) {
  const depts = await prisma.department.findMany({
    include: { beds: true, doctors: true, equipment: true },
  });
  return reply.send(depts);
}

export async function createDepartmentHandler(request: FastifyRequest, reply: FastifyReply) {
  const { name, specialty, floor, capacity } = request.body as any;
  const dept = await prisma.department.create({
    data: {
      name,
      specialty,
      floor: floor ? parseInt(floor, 10) : 1,
      capacity: capacity ? parseInt(capacity, 10) : 50,
    },
  });
  return reply.status(201).send(dept);
}
