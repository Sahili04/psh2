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
  verificationDocuments?: Record<string, 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED'>;
  createdAt: string;
  updatedAt: string;
  departments?: any[];
  users?: any[];
}

export interface AuthorizationDocument {
  id: string;
  name: string;
  category: 'REGISTRATION' | 'SAFETY' | 'COMPLIANCE' | 'ACCREDITATION' | 'ENVIRONMENTAL';
  description: string;
  issuingAuthority: string;
  status: 'VERIFIED' | 'PENDING_REVIEW' | 'UPLOADED';
  documentNumber: string;
  validUntil: string;
  fileSize: string;
}

export const DUMMY_REQUIRED_HOSPITAL_DOCUMENTS: AuthorizationDocument[] = [
  {
    id: 'DOC-01',
    name: 'State Health Department Clinical Establishment Registration',
    category: 'REGISTRATION',
    description: 'Mandatory state health accreditation & clinical facility operating permit.',
    issuingAuthority: 'State Directorate of Health Services (SDHS)',
    status: 'VERIFIED',
    documentNumber: 'CER-STATE-2026-9041',
    validUntil: '2028-12-31',
    fileSize: '2.4 MB (PDF)',
  },
  {
    id: 'DOC-02',
    name: 'Fire Safety Clearance & Emergency Evacuation Compliance Certificate',
    category: 'SAFETY',
    description: 'Fire NOC certified by State Fire & Rescue Command for medical facility.',
    issuingAuthority: 'State Fire & Emergency Services Command',
    status: 'VERIFIED',
    documentNumber: 'FSC-NOC-2026-8812',
    validUntil: '2027-06-30',
    fileSize: '1.8 MB (PDF)',
  },
  {
    id: 'DOC-03',
    name: 'Bio-Medical Waste Management & Environmental Authorization',
    category: 'ENVIRONMENTAL',
    description: 'Pollution Control Board permit for bio-hazardous & medical waste disposal.',
    issuingAuthority: 'State Pollution Control Board (SPCB)',
    status: 'VERIFIED',
    documentNumber: 'BMW-AUTHOR-77102',
    validUntil: '2027-11-15',
    fileSize: '3.1 MB (PDF)',
  },
  {
    id: 'DOC-04',
    name: 'Atomic Energy Regulatory Board (AERB) Radiation Safety License',
    category: 'SAFETY',
    description: 'Radiation protection clearance for Diagnostic Imaging (CT, X-Ray, CathLab).',
    issuingAuthority: 'Atomic Energy Regulatory Board (AERB)',
    status: 'VERIFIED',
    documentNumber: 'AERB-RAD-LIC-5541',
    validUntil: '2029-03-31',
    fileSize: '1.2 MB (PDF)',
  },
  {
    id: 'DOC-05',
    name: 'In-House Pharmacy License & Controlled Narcotic Substances Authorization',
    category: 'COMPLIANCE',
    description: 'Drugs Control Department license for hospital pharmaceuticals.',
    issuingAuthority: 'State Drug Control Administration (SDCA)',
    status: 'VERIFIED',
    documentNumber: 'DCA-PHARM-NARC-3390',
    validUntil: '2028-08-31',
    fileSize: '1.5 MB (PDF)',
  },
  {
    id: 'DOC-06',
    name: 'National Accreditation Board for Hospitals & Healthcare Providers (NABH)',
    category: 'ACCREDITATION',
    description: 'Gold-standard clinical quality accreditation and patient safety certificate.',
    issuingAuthority: 'Quality Council of National Accreditation Board (NABH)',
    status: 'VERIFIED',
    documentNumber: 'NABH-GOLD-CERT-2025-09',
    validUntil: '2028-05-20',
    fileSize: '4.5 MB (PDF)',
  },
  {
    id: 'DOC-07',
    name: 'Blood Bank & Transfusion Center Operating Permit',
    category: 'REGISTRATION',
    description: 'Central Blood Standard Control approval for in-house blood storage.',
    issuingAuthority: 'Central Drugs Standard Control Organization (CDSCO)',
    status: 'VERIFIED',
    documentNumber: 'CDSCO-BLOOD-9921',
    validUntil: '2027-09-30',
    fileSize: '2.0 MB (PDF)',
  },
  {
    id: 'DOC-08',
    name: 'Organ Transplantation & Critical Intensive Care Unit (ICU) License',
    category: 'COMPLIANCE',
    description: 'Specialty accreditation for Level-3 Multi-bed ICU Operations.',
    issuingAuthority: 'National Organ & Tissue Transplant Organization (NOTTO)',
    status: 'VERIFIED',
    documentNumber: 'NOTTO-ICU-PERMIT-441',
    validUntil: '2029-01-15',
    fileSize: '1.9 MB (PDF)',
  },
];

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
