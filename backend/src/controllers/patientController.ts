import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma.js';
import { TransactionEngine } from '../engine/transactionEngine.js';
import { ResourceType, TransactionType, BedStatus, AdmissionStatus } from '../types/domain.js';
import { broadcastEvent } from '../websocket/broadcaster.js';

export async function autoAllocateDoctorAndNurse(departmentId?: string | null) {
  let docWhere: any = { availabilityStatus: 'AVAILABLE' };
  if (departmentId) docWhere.departmentId = departmentId;

  let availableDocs = await prisma.doctor.findMany({
    where: docWhere,
    include: { assignedPatients: true, user: true, department: true },
  });

  if (availableDocs.length === 0 && departmentId) {
    availableDocs = await prisma.doctor.findMany({
      where: { availabilityStatus: 'AVAILABLE' },
      include: { assignedPatients: true, user: true, department: true },
    });
  }

  if (availableDocs.length === 0) {
    availableDocs = await prisma.doctor.findMany({
      include: { assignedPatients: true, user: true, department: true },
    });
  }

  const selectedDoc = availableDocs.sort((a, b) => a.assignedPatients.length - b.assignedPatients.length)[0] || null;

  let nurseWhere: any = {};
  if (departmentId) nurseWhere.departmentId = departmentId;

  let availableNurses = await prisma.nurse.findMany({
    where: nurseWhere,
    include: { assignedPatients: true, user: true, department: true },
  });

  if (availableNurses.length === 0) {
    availableNurses = await prisma.nurse.findMany({
      include: { assignedPatients: true, user: true, department: true },
    });
  }

  const selectedNurse = availableNurses.sort((a, b) => a.assignedPatients.length - b.assignedPatients.length)[0] || null;

  return {
    doctorId: selectedDoc?.id || null,
    nurseId: selectedNurse?.id || null,
    doctor: selectedDoc,
    nurse: selectedNurse,
  };
}

export async function getPatientsHandler(request: FastifyRequest, reply: FastifyReply) {
  const patients = await prisma.patient.findMany({
    include: {
      assignedDoctor: { include: { user: true, department: true } },
      assignedNurse: { include: { user: true, department: true } },
      admissions: { include: { bed: true, doctor: { include: { user: true } } } },
      appointments: { include: { doctor: { include: { user: true } } } },
      prescriptions: true,
      reports: true,
      vitals: { orderBy: { createdAt: 'desc' }, take: 5 },
      careTasks: { include: { nurse: { include: { user: true } } } },
      emergencyAlerts: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
    orderBy: { patientNumber: 'desc' },
  });
  return reply.send(patients);
}

export async function createPatientHandler(request: FastifyRequest, reply: FastifyReply) {
  const data = request.body as any;
  const count = await prisma.patient.count();
  const patientNumber = `PAT-${101 + count}`;

  const { doctorId, nurseId, doctor, nurse } = await autoAllocateDoctorAndNurse(data.departmentId);

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
      assignedDoctorId: doctorId,
      assignedNurseId: nurseId,
    },
    include: {
      assignedDoctor: { include: { user: true, department: true } },
      assignedNurse: { include: { user: true, department: true } },
    },
  });

  broadcastEvent('patient:allocated', {
    patient,
    doctor,
    nurse,
    message: `Patient ${patient.name} registered and allotted Dr. ${doctor?.user?.name || 'Duty Doctor'} & Nurse ${nurse?.user?.name || 'Duty Nurse'}.`,
  });

  return reply.status(201).send(patient);
}

export async function getPatientProfileHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      assignedDoctor: { include: { user: true, department: true } },
      assignedNurse: { include: { user: true, department: true } },
      admissions: { include: { bed: true, doctor: { include: { user: true } }, department: true } },
      appointments: { include: { doctor: { include: { user: true } }, department: true } },
      consultations: { include: { doctor: { include: { user: true } } } },
      prescriptions: { include: { doctor: { include: { user: true } } } },
      reports: { include: { doctor: { include: { user: true } } } },
      vitals: { orderBy: { createdAt: 'desc' } },
      careTasks: { include: { nurse: { include: { user: true } } } },
      transactions: { include: { events: true } },
      emergencyAlerts: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!patient) return reply.status(404).send({ error: 'Patient not found' });
  return reply.send(patient);
}

export async function triggerEmergencySosHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any; // patientId
  const { nurseId, reason } = request.body as any;

  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      assignedDoctor: { include: { user: true, department: true } },
      assignedNurse: { include: { user: true, department: true } },
      vitals: { orderBy: { createdAt: 'desc' }, take: 5 },
      prescriptions: { include: { doctor: { include: { user: true } } } },
      consultations: { include: { doctor: { include: { user: true } } } },
      careTasks: true,
      reports: true,
    },
  });

  if (!patient) return reply.status(404).send({ error: 'Patient not found' });

  // Get effective doctor and nurse
  let targetDoctorId = patient.assignedDoctorId;
  if (!targetDoctorId) {
    const doc = await prisma.doctor.findFirst({ where: { availabilityStatus: 'AVAILABLE' } });
    targetDoctorId = doc?.id || null;
  }

  let triggeringNurseId = nurseId || patient.assignedNurseId;
  if (!triggeringNurseId) {
    const n = await prisma.nurse.findFirst();
    triggeringNurseId = n?.id || '';
  }

  const alertReason = reason || `🚨 CRITICAL EMERGENCY SOS: Patient ${patient.name} needs immediate doctor attention!`;

  const alert = await prisma.emergencyAlert.create({
    data: {
      patientId: patient.id,
      nurseId: triggeringNurseId,
      doctorId: targetDoctorId || '',
      reason: alertReason,
      status: 'ACTIVE',
    },
    include: {
      patient: true,
      nurse: { include: { user: true } },
      doctor: { include: { user: true } },
    },
  });

  const ambulanceStandby = {
    vehicleNumber: 'AMB-ALS-01',
    type: 'Advanced Cardiac Life Support (ALS)',
    status: 'STANDBY_DISPATCHED',
    driverName: 'Rajesh Kumar',
    driverPhone: '+91-98765-11223',
    location: 'Emergency Bay #1 — Standing By STAT',
  };

  const fullSosPayload = {
    alertId: alert.id,
    patientId: patient.id,
    patientName: patient.name,
    patientNumber: patient.patientNumber,
    dateOfBirth: patient.dateOfBirth,
    gender: patient.gender,
    bloodGroup: patient.bloodGroup,
    allergies: patient.allergies,
    medicalHistory: patient.medicalHistory,
    emergencyContact: patient.emergencyContact,
    priority: 'EMERGENCY',
    reason: alertReason,
    nurseName: alert.nurse?.user?.name || 'Duty Nurse',
    doctorId: targetDoctorId,
    doctorName: alert.doctor?.user?.name || 'Attending Doctor',
    ambulance: ambulanceStandby,
    vitals: patient.vitals,
    prescriptions: patient.prescriptions,
    consultations: patient.consultations,
    careTasks: patient.careTasks,
    reports: patient.reports,
    createdAt: alert.createdAt,
  };

  broadcastEvent('emergency:sos', fullSosPayload);

  return reply.status(201).send({
    message: `🚨 Emergency SOS dispatched to Dr. ${fullSosPayload.doctorName} STAT! Ambulance ${ambulanceStandby.vehicleNumber} assigned for Standby.`,
    alert,
    payload: fullSosPayload,
  });
}


export async function acknowledgeEmergencySosHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any; // alertId
  const alert = await prisma.emergencyAlert.update({
    where: { id },
    data: { status: 'ACKNOWLEDGED' },
    include: { patient: true, doctor: { include: { user: true } }, nurse: { include: { user: true } } },
  });

  broadcastEvent('emergency:acknowledged', { alertId: alert.id, status: 'ACKNOWLEDGED', patientName: alert.patient.name });
  return reply.send(alert);
}

export async function getEmergencyAlertsHandler(request: FastifyRequest, reply: FastifyReply) {
  const alerts = await prisma.emergencyAlert.findMany({
    include: {
      patient: true,
      doctor: { include: { user: true } },
      nurse: { include: { user: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
  return reply.send(alerts);
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
