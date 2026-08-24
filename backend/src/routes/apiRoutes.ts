import { FastifyInstance } from 'fastify';
import {
  loginHandler, registerPatientHandler, meHandler, getUsersHandler,
  createStaffHandler, deleteUserHandler
} from '../controllers/authController.js';
import {
  getBedsHandler, createBedHandler, updateBedStatusHandler, reserveBedHandler,
  getDoctorsHandler, updateDoctorStatusHandler, getEquipmentHandler, createEquipmentHandler,
  updateEquipmentStatusHandler, getOTsHandler, updateOTStatusHandler, getDepartmentsHandler, createDepartmentHandler
} from '../controllers/resourceController.js';
import {
  getPatientsHandler, createPatientHandler, getPatientProfileHandler, admitPatientHandler,
  transferPatientHandler, dischargePatientHandler, getAppointmentsHandler, createAppointmentHandler,
  updateAppointmentStatusHandler, createConsultationHandler, createPrescriptionHandler,
  createReportHandler, createVitalHandler, updateCareTaskHandler
} from '../controllers/patientController.js';
import {
  getTransactionsHandler, getTransactionDetailHandler, createManualTransactionHandler,
  getConflictsHandler, overrideConflictHandler, getAuditLogsHandler, getEventsHandler
} from '../controllers/transactionController.js';
import { runSimulationScenarioHandler } from '../controllers/simulationController.js';

export async function registerApiRoutes(fastify: FastifyInstance) {
  // Auth & User Access Control
  fastify.post('/api/auth/login', loginHandler);
  fastify.post('/api/auth/register', registerPatientHandler);
  fastify.get('/api/auth/me', meHandler);
  fastify.get('/api/auth/users', getUsersHandler);
  fastify.post('/api/auth/users', createStaffHandler);
  fastify.delete('/api/auth/users/:id', deleteUserHandler);

  // Resources & Departments
  fastify.get('/api/resources/departments', getDepartmentsHandler);
  fastify.post('/api/resources/departments', createDepartmentHandler);
  fastify.get('/api/departments', getDepartmentsHandler);
  fastify.post('/api/departments', createDepartmentHandler);
  fastify.get('/api/resources/beds', getBedsHandler);
  fastify.post('/api/resources/beds', createBedHandler);
  fastify.patch('/api/resources/beds/:id', updateBedStatusHandler);
  fastify.post('/api/resources/beds/reserve', reserveBedHandler);

  fastify.get('/api/resources/doctors', getDoctorsHandler);
  fastify.patch('/api/resources/doctors/:id', updateDoctorStatusHandler);

  fastify.get('/api/resources/equipment', getEquipmentHandler);
  fastify.post('/api/resources/equipment', createEquipmentHandler);
  fastify.patch('/api/resources/equipment/:id', updateEquipmentStatusHandler);

  fastify.get('/api/resources/ots', getOTsHandler);
  fastify.patch('/api/resources/ots/:id', updateOTStatusHandler);

  // Patients & Admissions
  fastify.get('/api/patients', getPatientsHandler);
  fastify.post('/api/patients', createPatientHandler);
  fastify.get('/api/patients/:id', getPatientProfileHandler);

  fastify.post('/api/admissions/admit', admitPatientHandler);
  fastify.post('/api/admissions/transfer', transferPatientHandler);
  fastify.post('/api/admissions/discharge', dischargePatientHandler);

  // Appointments & Medical
  fastify.get('/api/appointments', getAppointmentsHandler);
  fastify.post('/api/appointments', createAppointmentHandler);
  fastify.patch('/api/appointments/:id', updateAppointmentStatusHandler);

  fastify.post('/api/consultations', createConsultationHandler);
  fastify.post('/api/prescriptions', createPrescriptionHandler);
  fastify.post('/api/reports', createReportHandler);

  // Nurse Care
  fastify.post('/api/vitals', createVitalHandler);
  fastify.patch('/api/care-tasks/:id', updateCareTaskHandler);

  // Transaction Engine & Audit
  fastify.get('/api/transactions', getTransactionsHandler);
  fastify.get('/api/transactions/:id', getTransactionDetailHandler);
  fastify.post('/api/transactions/execute', createManualTransactionHandler);

  fastify.get('/api/conflicts', getConflictsHandler);
  fastify.post('/api/conflicts/override', overrideConflictHandler);

  fastify.get('/api/audit-logs', getAuditLogsHandler);
  fastify.get('/api/events', getEventsHandler);

  // H-02 Simulation Lab
  fastify.post('/api/simulation/run', runSimulationScenarioHandler);
}
