import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma.js';
import { TransactionEngine } from '../engine/transactionEngine.js';
import { ResourceType, TransactionType, BedStatus, AdmissionStatus } from '../types/domain.js';
import { broadcastEvent } from '../websocket/broadcaster.js';

export async function getPatientsHandler(request: FastifyRequest, reply: FastifyReply) {
  const patients = await prisma.patient.findMany({
    include: {
      admissions: { include: { bed: true, doctor: { include: { user: true } } } },
      appointments: { include: { doctor: { include: { user: true } } } },
      prescriptions: true,
      reports: true,
      vitals: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
    orderBy: { patientNumber: 'asc' },
  });
  return reply.send(patients);
}

export async function createPatientHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = request.body as any;
  const count = await prisma.patient.count();
  const patientNumber = `PAT-${101 + count}`;

  const patient = await prisma.patient.create({
    data: {
      patientNumber,
      name: data.name,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      phone: data.phone,
      address: data.address,
      emergencyContact: data.emergencyContact,
      bloodGroup: data.bloodGroup,
      allergies: data.allergies || 'None',
      medicalHistory: data.medicalHistory || 'None',
      priority: data.priority || 'ROUTINE',
      status: 'ACTIVE',
    },
  });
  return reply.status(201).send(patient);
}

export async function getPatientProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      admissions: { include: { bed: true, doctor: { include: { user: true } }, department: true } },
      appointments: { include: { doctor: { include: { user: true } }, department: true } },
      consultations: { include: { doctor: { include: { user: true } } } },
      prescriptions: { include: { doctor: { include: { user: true } } } },
      reports: { include: { doctor: { include: { user: true } } } },
      vitals: { orderBy: { createdAt: 'desc' } },
      careTasks: { include: { nurse: { include: { user: true } } } },
      transactions: { include: { events: true } },
    },
  });

  if (!patient) return reply.status(404).send({ error: 'Patient not found' });
  return reply.send(patient);
}

export async function admitPatientHandler(request: FastifyRequest, reply: FastifyReply) {
  const { patientId, doctorId, departmentId, bedId, priority, reason, userId, transactionNumber } = request.body as any;

  // Execute multi-step atomic transaction via TransactionEngine
  const txResult = await TransactionEngine.executeTransaction({
    transactionNumber,
    initiatedBy: userId || 'SYSTEM',
    patientId,
    type: TransactionType.PATIENT_ADMISSION,
    priority: priority || 'ROUTINE',
    resourceType: ResourceType.BED,
    resourceId: bedId,
    doctorId,
    departmentId,
    reason,
  });

  if (txResult.isDuplicate) {
    return reply.status(200).send({
      txResult,
      admission: txResult.admission,
      isDuplicate: true,
      userMessage: 'Request already completed.',
      message: 'Request already completed.',
    });
  }

  if (txResult.status !== 'COMMITTED') {
    const userMessage =
      txResult.status === 'ESCALATED' ? 'Bed is already in use.' : 'Could not complete the request. No changes were made.';
    return reply.status(409).send({
      ...txResult,
      userMessage,
      error: userMessage,
    });
  }

  const admission = txResult.admission;
  if (admission) {
    broadcastEvent('admission:created', admission);
  }

  return reply.status(201).send({ txResult, admission, userMessage: 'Patient admitted successfully.' });
}

export async function transferPatientHandler(request: FastifyRequest, reply: FastifyReply) {
  const { admissionId, newBedId, newDepartmentId, userId, priority } = request.body as any;

  const currentAdm = await prisma.admission.findUnique({ where: { id: admissionId }, include: { bed: true } });
  if (!currentAdm) return reply.status(404).send({ error: 'Admission not found' });

  // 1. Reserve new bed via TransactionEngine
  const txResult = await TransactionEngine.executeTransaction({
    initiatedBy: userId || 'SYSTEM',
    patientId: currentAdm.patientId,
    type: TransactionType.PATIENT_TRANSFER,
    priority: priority || 'URGENT',
    resourceType: ResourceType.BED,
    resourceId: newBedId,
  });

  if (txResult.status !== 'COMMITTED') {
    return reply.status(409).send(txResult);
  }

  // 2. Release old bed
  await prisma.bed.update({
    where: { id: currentAdm.bedId },
    data: { status: BedStatus.AVAILABLE, currentPatientId: null },
  });

  // 3. Update Admission
  const updatedAdm = await prisma.admission.update({
    where: { id: admissionId },
    data: {
      bedId: newBedId,
      departmentId: newDepartmentId || currentAdm.departmentId,
      status: AdmissionStatus.TRANSFERRED,
    },
    include: { patient: true, bed: true, department: true },
  });

  broadcastEvent('admission:transferred', updatedAdm);
  return reply.send({ txResult, admission: updatedAdm });
}

export async function dischargePatientHandler(request: FastifyRequest, reply: FastifyReply) {
  const { admissionId, diagnosis, dischargeSummary, followUp, userId } = request.body as any;

  const admission = await prisma.admission.findUnique({ where: { id: admissionId } });
  if (!admission) return reply.status(404).send({ error: 'Admission not found' });

  // 1. Discharge admission
  const updatedAdm = await prisma.admission.update({
    where: { id: admissionId },
    data: {
      status: AdmissionStatus.DISCHARGED,
      dischargeDate: new Date(),
    },
  });

  // 2. Release Bed
  await prisma.bed.update({
    where: { id: admission.bedId },
    data: { status: BedStatus.AVAILABLE, currentPatientId: null },
  });

  // 3. Release any attached equipment
  await prisma.equipment.updateMany({
    where: { currentPatientId: admission.patientId },
    data: { status: 'AVAILABLE', currentPatientId: null },
  });

  // 4. Update Patient Status
  await prisma.patient.update({
    where: { id: admission.patientId },
    data: { status: 'DISCHARGED' },
  });

  // Audit
  await prisma.auditLog.create({
    data: {
      userId: userId || 'SYSTEM',
      action: 'DISCHARGE_PATIENT',
      entityType: 'Admission',
      entityId: admissionId,
      oldState: 'ADMITTED',
      newState: 'DISCHARGED',
      reason: `Patient discharged with summary: ${dischargeSummary || diagnosis}`,
    },
  });

  broadcastEvent('admission:discharged', updatedAdm);
  return reply.send({ message: 'Patient discharged successfully', admission: updatedAdm });
}

export async function getAppointmentsHandler(request: FastifyRequest, reply: FastifyReply) {
  const appts = await prisma.appointment.findMany({
    include: { patient: true, doctor: { include: { user: true } }, department: true },
    orderBy: { dateTime: 'desc' },
  });
  return reply.send(appts);
}

export async function createAppointmentHandler(request: FastifyRequest, reply: FastifyReply) {
  const { patientId, doctorId, departmentId, dateTime, reason } = request.body as any;

  // Check double booking
  const existingAppt = await prisma.appointment.findFirst({
    where: {
      doctorId,
      dateTime: new Date(dateTime),
      status: { in: ['SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS'] },
    },
  });

  if (existingAppt) {
    return reply.status(409).send({ error: 'Doctor is already booked for this time slot.' });
  }

  const appt = await prisma.appointment.create({
    data: {
      patientId,
      doctorId,
      departmentId,
      dateTime: new Date(dateTime),
      reason,
      status: 'SCHEDULED',
    },
    include: { patient: true, doctor: { include: { user: true } } },
  });

  broadcastEvent('appointment:created', appt);
  return reply.status(201).send(appt);
}

export async function updateAppointmentStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { status } = request.body as any;
  const appt = await prisma.appointment.update({
    where: { id },
    data: { status },
    include: { patient: true, doctor: { include: { user: true } } },
  });
  broadcastEvent('appointment:updated', appt);
  return reply.send(appt);
}

export async function createConsultationHandler(request: FastifyRequest, reply: FastifyReply) {
  const { patientId, doctorId, symptoms, observations, diagnosis, treatmentPlan, notes } = request.body as any;

  const consultation = await prisma.consultation.create({
    data: {
      patientId,
      doctorId,
      symptoms,
      observations,
      diagnosis,
      treatmentPlan,
      notes,
    },
  });
  return reply.status(201).send(consultation);
}

export async function createPrescriptionHandler(request: FastifyRequest, reply: FastifyReply) {
  const { patientId, doctorId, medicine, dosage, frequency, duration, instructions } = request.body as any;

  const rx = await prisma.prescription.create({
    data: {
      patientId,
      doctorId,
      medicine,
      dosage,
      frequency,
      duration,
      instructions,
    },
  });
  return reply.status(201).send(rx);
}

export async function createReportHandler(request: FastifyRequest, reply: FastifyReply) {
  const { patientId, doctorId, type, title, result } = request.body as any;

  const report = await prisma.medicalReport.create({
    data: {
      patientId,
      doctorId,
      type,
      title,
      result,
      status: 'COMPLETED',
    },
  });
  return reply.status(201).send(report);
}

export async function createVitalHandler(request: FastifyRequest, reply: FastifyReply) {
  const { patientId, recordedBy, temperature, heartRate, bloodPressure, spO2, respiratoryRate } = request.body as any;

  const vital = await prisma.vital.create({
    data: {
      patientId,
      recordedBy,
      temperature: parseFloat(temperature),
      heartRate: parseInt(heartRate, 10),
      bloodPressure,
      spO2: parseInt(spO2, 10),
      respiratoryRate: parseInt(respiratoryRate, 10),
    },
  });
  broadcastEvent('vitals:created', vital);
  return reply.status(201).send(vital);
}

export async function updateCareTaskHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const { status } = request.body as any;

  const task = await prisma.careTask.update({
    where: { id },
    data: { status },
  });
  return reply.send(task);
}
