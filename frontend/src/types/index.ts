export type Role =
  | 'PLATFORM_OWNER'
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'DEPARTMENT_ADMIN'
  | 'DOCTOR'
  | 'NURSE'
  | 'RECEPTIONIST'
  | 'RESOURCE_MANAGER'
  | 'PATIENT';

export type BedType = 'ICU' | 'GENERAL' | 'EMERGENCY' | 'ISOLATION';
export type BedStatus = 'AVAILABLE' | 'RESERVED' | 'OCCUPIED' | 'MAINTENANCE';

export type EquipmentStatus = 'AVAILABLE' | 'RESERVED' | 'IN_USE' | 'MAINTENANCE';
export type OTStatus = 'AVAILABLE' | 'SCHEDULED' | 'RESERVED' | 'IN_USE' | 'MAINTENANCE';

export type TransactionPriority = 'EMERGENCY' | 'CRITICAL' | 'URGENT' | 'ROUTINE';
export type TransactionStatus =
  | 'REQUESTED'
  | 'VALIDATING'
  | 'PROCESSING'
  | 'RESERVED'
  | 'COMMITTED'
  | 'FAILED'
  | 'COMPENSATING'
  | 'ROLLED_BACK'
  | 'ESCALATED'
  | 'OUT_OF_ORDER'
  | 'CANCELLED';

export interface Organization {
  id: string;
  name: string;
  code: string;
  registrationNumber: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  hospitalType: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  superAdminName: string;
  superAdminEmail: string;
  createdAt: string;
  updatedAt: string;
  departments?: any[];
  users?: any[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  department?: string;
  departmentId?: string;
  organizationId?: string;
  doctorId?: string;
  nurseId?: string;
  patientId?: string;
}

export interface Bed {
  id: string;
  bedNumber: string;
  type: BedType;
  departmentId: string;
  department?: { name: string };
  floor: number;
  status: BedStatus;
  currentPatientId?: string;
}

export interface Doctor {
  id: string;
  userId: string;
  user: { name: string; email: string };
  specialization: string;
  licenseNumber: string;
  departmentId: string;
  department?: { name: string };
  availabilityStatus: string;
  shift: string;
}

export interface Patient {
  id: string;
  patientNumber: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  address: string;
  emergencyContact: string;
  bloodGroup: string;
  allergies: string;
  medicalHistory: string;
  priority: TransactionPriority;
  status: string;
  admissions?: Admission[];
  vitals?: Vital[];
}

export interface Admission {
  id: string;
  patientId: string;
  patient?: Patient;
  doctorId: string;
  doctor?: Doctor;
  departmentId: string;
  department?: { name: string };
  bedId: string;
  bed?: Bed;
  admissionDate: string;
  dischargeDate?: string;
  status: string;
  reason: string;
}

export interface Transaction {
  id: string;
  transactionNumber: string;
  patientId?: string;
  patient?: Patient;
  initiatedBy: string;
  type: string;
  priority: TransactionPriority;
  status: TransactionStatus;
  resourceType: string;
  resourceId: string;
  createdAt: string;
  events?: TransactionEvent[];
  conflicts?: Conflict[];
}

export interface TransactionEvent {
  id: string;
  eventId: string;
  transactionId: string;
  eventType: string;
  sequenceNumber: number;
  payload: string;
  status: string;
  createdAt: string;
}

export interface Conflict {
  id: string;
  transactionId: string;
  transaction?: Transaction;
  resourceId: string;
  conflictingTransactionId: string;
  conflictingTransaction?: Transaction;
  winnerTransactionId?: string;
  winnerTransaction?: Transaction;
  reason: string;
  status: string;
  createdAt: string;
}

export interface Vital {
  id: string;
  patientId: string;
  recordedBy: string;
  temperature: number;
  heartRate: number;
  bloodPressure: string;
  spO2: number;
  respiratoryRate: number;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: { name: string; email: string };
  transactionId?: string;
  action: string;
  entityType: string;
  entityId: string;
  oldState?: string;
  newState?: string;
  reason?: string;
  createdAt: string;
}
