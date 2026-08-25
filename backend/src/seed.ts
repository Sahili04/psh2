import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  Role, BedType, BedStatus, EquipmentStatus, OTStatus,
  AppointmentStatus, AdmissionStatus, TransactionType, TransactionPriority,
  TransactionStatus, ResourceType, EventType, EventStatus, ConflictStatus
} from './types/domain.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting H-02 Hospital System Database Seeding with Indian Dataset...');

  // Clean up database
  await prisma.emergencyAlert.deleteMany();
  await prisma.conflict.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.event.deleteMany();
  await prisma.resourceRequest.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.careTask.deleteMany();
  await prisma.vital.deleteMany();
  await prisma.medicalReport.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.admission.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.operationTheatre.deleteMany();
  await prisma.equipmentSurvey.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.nurse.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.organization.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 0. Create Default Authorized Hospital / Organization
  const mainOrg = await prisma.organization.create({
    data: {
      name: 'Apollo Multi-Specialty Hospital',
      code: 'HOSP-001',
      registrationNumber: 'REG-APOLLO-2026',
      email: 'contact@apollohospital.in',
      phone: '+91-800-APOLLO-MED',
      address: '100 Healthcare Boulevard, Outer Ring Road',
      city: 'Bengaluru',
      hospitalType: 'MULTI_SPECIALTY',
      status: 'APPROVED',
      superAdminName: 'Dr. Rajesh Sharma',
      superAdminEmail: 'superadmin@hospital.com',
    },
  });

  // Seed a Pending Organization Request for Platform Owner testing
  await prisma.organization.create({
    data: {
      name: 'Max Heart & Trauma Center',
      code: 'HOSP-4099',
      registrationNumber: 'REG-MAX-9988',
      email: 'info@maxheart.in',
      phone: '+91-888-MAX-CARE',
      address: '750 Emergency Expressway, Aerocity',
      city: 'New Delhi',
      hospitalType: 'CARDIAC_TRAUMA_SPECIALTY',
      status: 'PENDING',
      superAdminName: 'Dr. Vikramaditya Rao (Director)',
      superAdminEmail: 'vance@apextrauma.org',
    },
  });

  // 1. Create 22 Multi-Specialty Departments
  const deptData = [
    { name: 'Emergency & Trauma', specialty: 'Emergency Medicine', floor: 1, capacity: 30, organizationId: mainOrg.id },
    { name: 'General Medicine', specialty: 'Internal Medicine', floor: 1, capacity: 50, organizationId: mainOrg.id },
    { name: 'Cardiology Unit', specialty: 'Cardiology', floor: 2, capacity: 40, organizationId: mainOrg.id },
    { name: 'Neurology Department', specialty: 'Neurology', floor: 3, capacity: 25, organizationId: mainOrg.id },
    { name: 'Orthopedics Center', specialty: 'Orthopedics', floor: 2, capacity: 35, organizationId: mainOrg.id },
    { name: 'Gynecology & Obstetrics', specialty: 'Obstetrics & Gynecology', floor: 3, capacity: 30, organizationId: mainOrg.id },
    { name: 'Pediatrics Ward', specialty: 'Pediatrics', floor: 4, capacity: 30, organizationId: mainOrg.id },
    { name: 'Surgical Suite', specialty: 'General Surgery', floor: 3, capacity: 30, organizationId: mainOrg.id },
    { name: 'Oncology Center', specialty: 'Oncology', floor: 5, capacity: 20, organizationId: mainOrg.id },
    { name: 'Gastroenterology', specialty: 'Gastroenterology', floor: 2, capacity: 20, organizationId: mainOrg.id },
    { name: 'Pulmonology', specialty: 'Pulmonology', floor: 3, capacity: 20, organizationId: mainOrg.id },
    { name: 'Nephrology', specialty: 'Nephrology', floor: 4, capacity: 20, organizationId: mainOrg.id },
    { name: 'Urology', specialty: 'Urology', floor: 2, capacity: 15, organizationId: mainOrg.id },
    { name: 'ENT (Ear Nose Throat)', specialty: 'Otolaryngology', floor: 1, capacity: 15, organizationId: mainOrg.id },
    { name: 'Ophthalmology', specialty: 'Ophthalmology', floor: 1, capacity: 15, organizationId: mainOrg.id },
    { name: 'Dermatology', specialty: 'Dermatology', floor: 1, capacity: 15, organizationId: mainOrg.id },
    { name: 'Psychiatry', specialty: 'Psychiatry', floor: 5, capacity: 20, organizationId: mainOrg.id },
    { name: 'Intensive Care Unit (ICU)', specialty: 'Critical Care', floor: 4, capacity: 20, organizationId: mainOrg.id },
    { name: 'Radiology & Imaging', specialty: 'Radiology', floor: 1, capacity: 15, organizationId: mainOrg.id },
    { name: 'Pathology & Laboratory', specialty: 'Pathology', floor: 1, capacity: 15, organizationId: mainOrg.id },
    { name: 'Anesthesiology', specialty: 'Anesthesiology', floor: 3, capacity: 15, organizationId: mainOrg.id },
    { name: 'Physiotherapy', specialty: 'Physical Therapy', floor: 1, capacity: 20, organizationId: mainOrg.id },
  ];

  const depts: any = {};
  for (const d of deptData) {
    const created = await prisma.department.create({ data: d });
    depts[d.name] = created;
  }

  // 2. Create Platform Owner + Super Admin + Department Admins + Core Users
  const demoUsers = [
    { name: 'Software Platform Owner', email: 'owner@hospitalecho.com', role: 'PLATFORM_OWNER', dept: null, org: null },
    { name: 'Dr. Rajesh Sharma (Super Admin)', email: 'superadmin@hospital.com', role: Role.SUPER_ADMIN, dept: null, org: mainOrg.id },
    { name: 'Emergency Admin - Dr. Vikramaditya', email: 'admin.emergency@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Emergency & Trauma'].id, org: mainOrg.id },
    { name: 'Cardiology Admin - Dr. Sunita', email: 'admin.cardiology@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Cardiology Unit'].id, org: mainOrg.id },
    { name: 'Neurology Admin - Dr. Rohan', email: 'admin.neurology@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Neurology Department'].id, org: mainOrg.id },
    { name: 'Orthopedics Admin - Dr. Kavita', email: 'admin.orthopedics@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Orthopedics Center'].id, org: mainOrg.id },
    { name: 'Pediatrics Admin - Dr. Priya', email: 'admin.pediatrics@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Pediatrics Ward'].id, org: mainOrg.id },
    { name: 'Oncology Admin - Dr. Amitav', email: 'admin.oncology@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Oncology Center'].id, org: mainOrg.id },
    { name: 'General Medicine Admin - Dr. Suresh', email: 'admin.general@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['General Medicine'].id, org: mainOrg.id },
    { name: 'Surgical Suite Admin - Dr. Meenakshi', email: 'admin.surgery@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Surgical Suite'].id, org: mainOrg.id },
    { name: 'ICU Dept Admin - Dr. Ananya', email: 'deptadmin@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Intensive Care Unit (ICU)'].id, org: mainOrg.id },
    { name: 'Radiology Dept Admin - Dr. Arvind', email: 'admin.radiology@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Radiology & Imaging'].id, org: mainOrg.id },

    // Staff & Demo Patient
    { name: 'Dr. Ananya Iyer', email: 'doctor@hospital.com', role: Role.DOCTOR, dept: depts['Intensive Care Unit (ICU)'].id, org: mainOrg.id },
    { name: 'Dr. Vikramaditya Rao', email: 'doctor2@hospital.com', role: Role.DOCTOR, dept: depts['Emergency & Trauma'].id, org: mainOrg.id },
    { name: 'Nurse Sunita Devi', email: 'nurse@hospital.com', role: Role.NURSE, dept: depts['Intensive Care Unit (ICU)'].id, org: mainOrg.id },
    { name: 'Reception Manager Ramesh', email: 'reception@hospital.com', role: Role.RECEPTIONIST, dept: depts['General Medicine'].id, org: mainOrg.id },
    { name: 'Resource Mgr Suresh', email: 'resource@hospital.com', role: Role.RESOURCE_MANAGER, dept: depts['Intensive Care Unit (ICU)'].id, org: mainOrg.id },
    { name: 'Patient Rahul Verma', email: 'patient@hospital.com', role: Role.PATIENT, dept: null, org: mainOrg.id },
  ];

  const users: Record<string, any> = {};
  for (const u of demoUsers) {
    const created = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        passwordHash,
        role: u.role,
        departmentId: u.dept,
        organizationId: u.org || null,
      },
    });
    users[u.email] = created;
  }

  // 3. Create 15 Doctors with Indian Names
  const doctorSpecs = [
    { name: 'Dr. Ananya Iyer', email: 'doctor@hospital.com', spec: 'Critical Care & ICU', lic: 'LIC-IND-001', dept: depts['Intensive Care Unit (ICU)'] },
    { name: 'Dr. Vikramaditya Rao', email: 'doctor2@hospital.com', spec: 'Emergency Medicine', lic: 'LIC-IND-002', dept: depts['Emergency & Trauma'] },
    { name: 'Dr. Sunita Deshmukh', email: 'dr.sunita@hospital.com', spec: 'Cardiology', lic: 'LIC-IND-003', dept: depts['Cardiology Unit'] },
    { name: 'Dr. Rohan Mehta', email: 'dr.rohan@hospital.com', spec: 'Neurology', lic: 'LIC-IND-004', dept: depts['Neurology Department'] },
    { name: 'Dr. Kavita Reddy', email: 'dr.kavita@hospital.com', spec: 'Orthopedics', lic: 'LIC-IND-005', dept: depts['Orthopedics Center'] },
    { name: 'Dr. Priya Sharma', email: 'dr.priya@hospital.com', spec: 'Pediatrics', lic: 'LIC-IND-006', dept: depts['Pediatrics Ward'] },
    { name: 'Dr. Amitav Ghosh', email: 'dr.amitav@hospital.com', spec: 'Oncology', lic: 'LIC-IND-007', dept: depts['Oncology Center'] },
    { name: 'Dr. Suresh Nair', email: 'dr.suresh@hospital.com', spec: 'Internal Medicine', lic: 'LIC-IND-008', dept: depts['General Medicine'] },
    { name: 'Dr. Meenakshi Joshi', email: 'dr.meenakshi@hospital.com', spec: 'General Surgery', lic: 'LIC-IND-009', dept: depts['Surgical Suite'] },
    { name: 'Dr. Arvind Swamy', email: 'dr.arvind@hospital.com', spec: 'Neurosurgery', lic: 'LIC-IND-010', dept: depts['Neurology Department'] },
    { name: 'Dr. Priyanka Sengupta', email: 'dr.priyankas@hospital.com', spec: 'Cardiothoracic Surgery', lic: 'LIC-IND-011', dept: depts['Cardiology Unit'] },
    { name: 'Dr. Devraj Mukherjee', email: 'dr.devraj@hospital.com', spec: 'Pediatric Surgery', lic: 'LIC-IND-012', dept: depts['Pediatrics Ward'] },
    { name: 'Dr. Deepa Subramanian', email: 'dr.deepas@hospital.com', spec: 'General Surgery', lic: 'LIC-IND-013', dept: depts['Surgical Suite'] },
    { name: 'Dr. Sameer Kapoor', email: 'dr.sameer@hospital.com', spec: 'Trauma Surgery', lic: 'LIC-IND-014', dept: depts['Emergency & Trauma'] },
    { name: 'Dr. Aditi Kulkarni', email: 'dr.aditi@hospital.com', spec: 'Gynecology & Obstetrics', lic: 'LIC-IND-015', dept: depts['Gynecology & Obstetrics'] },
  ];

  const doctors: any[] = [];
  for (const doc of doctorSpecs) {
    let u = users[doc.email];
    if (!u) {
      u = await prisma.user.create({
        data: {
          name: doc.name,
          email: doc.email,
          passwordHash,
          role: Role.DOCTOR,
          departmentId: doc.dept.id,
        },
      });
      users[doc.email] = u;
    }
    const createdDoc = await prisma.doctor.create({
      data: {
        userId: u.id,
        specialization: doc.spec,
        licenseNumber: doc.lic,
        departmentId: doc.dept.id,
        availabilityStatus: 'AVAILABLE',
        shift: 'DAY',
      },
    });
    doctors.push(createdDoc);
  }

  // Update Head Doctor for key Departments
  await prisma.department.update({ where: { id: depts['Intensive Care Unit (ICU)'].id }, data: { headDoctorId: doctors[0].id } });
  await prisma.department.update({ where: { id: depts['Emergency & Trauma'].id }, data: { headDoctorId: doctors[1].id } });

  // 4. Create 15 Nurses with Indian Names
  const nurseNames = [
    'Nurse Sunita Devi', 'Nurse Deepa Sharma', 'Nurse Anjali Verma', 'Nurse Lakshmi Prasanna',
    'Nurse Pooja Kulkarni', 'Nurse Rekha Patel', 'Nurse Meera Nair', 'Nurse Priyanka Rao',
    'Nurse Swati Deshmukh', 'Nurse Radhika Iyer', 'Nurse Kavita Joshi', 'Nurse Neha Kapoor',
    'Nurse Aarti Shah', 'Nurse Bhavna Trivedi', 'Nurse Divya Pillai'
  ];

  const deptList = Object.values(depts) as any[];
  const nurses: any[] = [];
  for (let i = 0; i < nurseNames.length; i++) {
    const name = nurseNames[i];
    const email = i === 0 ? 'nurse@hospital.com' : `nurse${i + 1}@hospital.com`;
    const targetDept = deptList[i % deptList.length];

    let u = users[email];
    if (!u) {
      u = await prisma.user.findUnique({ where: { email } });
    }
    if (!u) {
      u = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          role: Role.NURSE,
          departmentId: targetDept.id,
        },
      });
      users[email] = u;
    }

    const createdNurse = await prisma.nurse.create({
      data: {
        userId: u.id,
        departmentId: targetDept.id,
        shift: i % 2 === 0 ? 'DAY' : 'NIGHT',
      },
    });
    nurses.push(createdNurse);
  }

  // 5. Create 30 Synthetic Patients with Authentic Indian Names & Pre-assigned Doctor/Nurse
  const indianPatientNames = [
    'Rahul Verma', 'Aarav Patel', 'Meera Joshi', 'Rajesh Kumar', 'Priya Sharma',
    'Vikram Malhotra', 'Sneha Gupta', 'Arjun Reddy', 'Kavya Swaminathan', 'Ramesh Patel',
    'Sunita Agarwal', 'Amit Shah', 'Neha Kapoor', 'Sanjay Singhania', 'Deepa Pillai',
    'Manish Tiwari', 'Ankita Banerjee', 'Alok Mishra', 'Pooja Deshmukh', 'Tarun Saxena',
    'Ritu Chatterjee', 'Nikhil Bhatia', 'Shweta Kulkarni', 'Gaurav Joshi', 'Bhavna Chauhan',
    'Karthik Sundaram', 'Divya Nambiar', 'Siddharth Roy', 'Ishita Sengupta', 'Varun Naidu'
  ];

  const patients: any[] = [];
  for (let i = 0; i < 30; i++) {
    const doc = doctors[i % doctors.length];
    const nurse = nurses[i % nurses.length];

    const p = await prisma.patient.create({
      data: {
        patientNumber: `PAT-${1000 + i + 1}`,
        name: i === 0 ? 'Patient Rahul Verma' : `Patient ${indianPatientNames[i]}`,
        dateOfBirth: `198${i % 9}-0${(i % 9) + 1}-15`,
        gender: i % 2 === 0 ? 'Male' : 'Female',
        phone: `+91-98765-${10000 + i}`,
        address: `${100 + i} MG Road, Indiranagar`,
        emergencyContact: `+91-98765-${90000 + i}`,
        bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'O-'][i % 5],
        allergies: i % 3 === 0 ? 'Penicillin, Dust' : 'None',
        medicalHistory: i % 2 === 0 ? 'Type 2 Diabetes, Hypertension' : 'Asthma, Mild Gastritis',
        priority: i === 0 ? TransactionPriority.EMERGENCY : i % 5 === 0 ? TransactionPriority.CRITICAL : TransactionPriority.ROUTINE,
        assignedDoctorId: doc.id,
        assignedNurseId: nurse.id,
      },
    });
    patients.push(p);
  }

  // 6. Create Beds (60 Beds total across Departments)
  const beds: any[] = [];
  const icuDept = depts['Intensive Care Unit (ICU)'];
  for (let i = 1; i <= 20; i++) {
    const b = await prisma.bed.create({
      data: {
        bedNumber: `ICU-BED-${i < 10 ? '0' + i : i}`,
        type: BedType.ICU,
        departmentId: icuDept.id,
        floor: 4,
        status: i === 1 ? BedStatus.OCCUPIED : i < 15 ? BedStatus.RESERVED : BedStatus.MAINTENANCE,
        currentPatientId: i === 1 ? patients[0].id : null,
      },
    });
    beds.push(b);
  }

  const emgDept = depts['Emergency & Trauma'];
  for (let i = 1; i <= 15; i++) {
    const b = await prisma.bed.create({
      data: {
        bedNumber: `EMG-BED-${i < 10 ? '0' + i : i}`,
        type: BedType.EMERGENCY,
        departmentId: emgDept.id,
        floor: 1,
        status: BedStatus.AVAILABLE,
      },
    });
    beds.push(b);
  }

  const genDept = depts['General Medicine'];
  for (let i = 1; i <= 15; i++) {
    const b = await prisma.bed.create({
      data: {
        bedNumber: `GEN-BED-${i < 10 ? '0' + i : i}`,
        type: BedType.GENERAL,
        departmentId: genDept.id,
        floor: 1,
        status: BedStatus.AVAILABLE,
      },
    });
    beds.push(b);
  }

  const oncDept = depts['Oncology Center'];
  for (let i = 1; i <= 10; i++) {
    const b = await prisma.bed.create({
      data: {
        bedNumber: `ISO-BED-${i < 10 ? '0' + i : i}`,
        type: BedType.ISOLATION,
        departmentId: oncDept.id,
        floor: 5,
        status: i > 5 ? BedStatus.OCCUPIED : BedStatus.AVAILABLE,
        currentPatientId: i > 5 ? patients[i].id : null,
      },
    });
    beds.push(b);
  }

  // 7. Create Equipment
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const overdueDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const equipmentData = [
    {
      name: 'ICU Ventilator Alpha', type: 'VENTILATOR', serialNumber: 'VENT-001', dept: icuDept, status: EquipmentStatus.IN_USE, currentPatientId: patients[0].id,
      healthScore: 98, calibrationStatus: 'CALIBRATED', batteryLevel: 94, sensorAccuracy: '99.8%', lastSurveyDate: now, nextSurveyDate: nextWeek, surveyedByDoctorName: 'Dr. Ananya Iyer (ICU Admin)', surveyNotes: 'Turbine pressure flow calibrated and patient sensor accurate.'
    },
    {
      name: 'ICU Ventilator Beta', type: 'VENTILATOR', serialNumber: 'VENT-002', dept: icuDept, status: EquipmentStatus.RESERVED,
      healthScore: 82, calibrationStatus: 'DUE_SOON', batteryLevel: 78, sensorAccuracy: '97.2%', lastSurveyDate: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000), nextSurveyDate: now, surveyedByDoctorName: 'Dr. Ananya Iyer (ICU Admin)', surveyNotes: 'Oxygen sensor recalibration due for upcoming ICU allocation.'
    },
    {
      name: 'Cardiac Defibrillator X1', type: 'DEFIBRILLATOR', serialNumber: 'DEFIB-001', dept: depts['Cardiology Unit'], status: EquipmentStatus.AVAILABLE,
      healthScore: 65, calibrationStatus: 'OVERDUE', batteryLevel: 45, sensorAccuracy: '94.0%', lastSurveyDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), nextSurveyDate: overdueDate, surveyedByDoctorName: 'Dr. Sunita Deshmukh (Cardiology Admin)', surveyNotes: 'Battery discharge test needed immediately.'
    },
    {
      name: 'Portable Ultrasound Scan', type: 'ULTRASOUND', serialNumber: 'ULT-001', dept: depts['Radiology & Imaging'], status: EquipmentStatus.AVAILABLE,
      healthScore: 100, calibrationStatus: 'CALIBRATED', batteryLevel: 100, sensorAccuracy: '99.9%', lastSurveyDate: now, nextSurveyDate: nextWeek, surveyedByDoctorName: 'Dr. Arvind Swamy (Radiology Admin)', surveyNotes: 'Doppler transducer frequency verified.'
    },
    {
      name: 'Infusion Pump Tower A', type: 'INFUSION_PUMP', serialNumber: 'INF-001', dept: icuDept, status: EquipmentStatus.IN_USE,
      healthScore: 90, calibrationStatus: 'CALIBRATED', batteryLevel: 88, sensorAccuracy: '98.5%', lastSurveyDate: now, nextSurveyDate: nextWeek, surveyedByDoctorName: 'Dr. Ananya Iyer (ICU Admin)', surveyNotes: 'Micro-drip rate verified for ICU automated medication.'
    },
  ];

  for (const eq of equipmentData) {
    const createdEq = await prisma.equipment.create({
      data: {
        name: eq.name,
        type: eq.type,
        serialNumber: eq.serialNumber,
        departmentId: eq.dept.id,
        location: `Floor ${eq.dept.floor}`,
        status: eq.status,
        currentPatientId: eq.currentPatientId || null,
        healthScore: eq.healthScore,
        calibrationStatus: eq.calibrationStatus,
        batteryLevel: eq.batteryLevel,
        sensorAccuracy: eq.sensorAccuracy,
        lastSurveyDate: eq.lastSurveyDate,
        nextSurveyDate: eq.nextSurveyDate,
        surveyedByDoctorName: eq.surveyedByDoctorName,
        surveyNotes: eq.surveyNotes,
      },
    });

    await prisma.equipmentSurvey.create({
      data: {
        equipmentId: createdEq.id,
        doctorName: eq.surveyedByDoctorName,
        healthScore: eq.healthScore,
        calibrationStatus: eq.calibrationStatus,
        batteryLevel: eq.batteryLevel,
        sensorAccuracy: eq.sensorAccuracy,
        surveyDate: eq.lastSurveyDate,
        nextSurveyDate: eq.nextSurveyDate,
        notes: eq.surveyNotes,
      },
    });
  }

  // 8. Create Operation Theatres
  const otData = [
    { name: 'Main Surgical Suite OT-1', dept: depts['Surgical Suite'], status: OTStatus.AVAILABLE },
    { name: 'Trauma Emergency OT-2', dept: emgDept, status: OTStatus.AVAILABLE },
    { name: 'Cardiothoracic OT-3', dept: depts['Cardiology Unit'], status: OTStatus.SCHEDULED },
    { name: 'Neurosurgery OT-4', dept: depts['Neurology Department'], status: OTStatus.AVAILABLE },
  ];

  for (const ot of otData) {
    await prisma.operationTheatre.create({
      data: {
        name: ot.name,
        departmentId: ot.dept.id,
        status: ot.status,
      },
    });
  }

  // 8.5. Create 20 Appointments, 10 Admissions, 15 Prescriptions, Vitals & Care Tasks
  for (let i = 0; i < 20; i++) {
    const p = patients[i % patients.length];
    const d = doctors[i % doctors.length];
    const dept = deptList[i % deptList.length];

    await prisma.appointment.create({
      data: {
        patientId: p.id,
        doctorId: d.id,
        departmentId: dept.id,
        dateTime: new Date(Date.now() + i * 3600000),
        status: i % 3 === 0 ? 'CHECKED_IN' : i % 2 === 0 ? 'SCHEDULED' : 'COMPLETED',
        reason: ['Acute Chest Pain Evaluation', 'Routine Diabetes Checkup', 'Post-Op Surgical Review', 'Pediatric Fever Evaluation', 'Neurological Migraine Review'][i % 5],
      },
    });
  }

  for (let i = 0; i < 10; i++) {
    const p = patients[i];
    const d = doctors[i % doctors.length];
    const dept = deptList[i % deptList.length];
    const b = beds[i];

    await prisma.admission.create({
      data: {
        patientId: p.id,
        doctorId: d.id,
        departmentId: dept.id,
        bedId: b.id,
        admissionDate: new Date(),
        status: 'ADMITTED',
        reason: ['Acute Myocardial Infarction', 'Traumatic Head Injury', 'Severe Respiratory Distress', 'Post-Operative Recovery', 'Sepsis ICU Monitoring'][i % 5],
      },
    });
  }

  for (let i = 0; i < 15; i++) {
    const p = patients[i];
    const d = doctors[i % doctors.length];

    await prisma.consultation.create({
      data: {
        patientId: p.id,
        doctorId: d.id,
        symptoms: ['Severe chest discomfort, shortness of breath', 'High fever, persistent cough', 'Joint swelling and stiffness', 'Frequent headaches', 'Acute abdominal pain'][i % 5],
        observations: 'Vital signs stable. Heart sounds S1 S2 clear. Lungs clear to auscultation.',
        diagnosis: ['Hypertension & ACS', 'Acute Bronchitis', 'Osteoarthritis', 'Migraine with Aura', 'Acute Gastritis'][i % 5],
        treatmentPlan: 'Medication prescribed. Advised 1 week rest.',
        notes: 'Follow up in OPD after 7 days with repeat lab tests.',
      },
    });

    await prisma.prescription.create({
      data: {
        patientId: p.id,
        doctorId: d.id,
        medicine: ['Amoxicillin 500mg', 'Atorvastatin 20mg & Aspirin 75mg', 'Metformin 500mg', 'Ibuprofen 400mg', 'Telmisartan 40mg'][i % 5],
        dosage: '1 Tablet',
        frequency: ['TID (3x daily)', 'QD (1x daily)', 'BID (2x daily)', 'PRN (As needed)'][i % 4],
        duration: '7 Days',
        instructions: 'Take after meals with warm water.',
      },
    });

    await prisma.vital.create({
      data: {
        patientId: p.id,
        recordedBy: nurses[i % nurses.length].user?.name || 'Nurse Sunita Devi',
        temperature: 98.6 + (i % 3) * 0.5,
        heartRate: 72 + (i % 5) * 4,
        bloodPressure: `${120 + i}/${80 + (i % 4)}`,
        spO2: 96 + (i % 4),
        respiratoryRate: 16 + (i % 3),
      },
    });

    await prisma.careTask.create({
      data: {
        patientId: p.id,
        nurseId: nurses[i % nurses.length].id,
        description: ['Administer Morning Medication', 'Change Surgical Wound Dressing', 'Check IV Drip Flow Rate', 'Monitor Hourly Blood Glucose', 'Assist Patient Mobility'][i % 5],
        status: i % 2 === 0 ? 'COMPLETED' : 'PENDING',
        dueTime: '10:00 AM',
      },
    });
  }

  // 9. Initial Transactions, Conflicts & Audit Logs
  const txSpecs = [
    { num: 'TX-1001', type: TransactionType.MULTI_RESOURCE_ADMISSION, prio: TransactionPriority.EMERGENCY, stat: TransactionStatus.COMMITTED, resType: ResourceType.BED, resId: beds[0].id, by: 'Dr. Ananya Iyer', patient: patients[0] },
    { num: 'TX-1002', type: TransactionType.BED_ALLOCATION, prio: TransactionPriority.CRITICAL, stat: TransactionStatus.COMMITTED, resType: ResourceType.BED, resId: beds[1].id, by: 'Dr. Vikramaditya Rao', patient: patients[1] },
    { num: 'TX-1003', type: TransactionType.EQUIPMENT_RESERVATION, prio: TransactionPriority.EMERGENCY, stat: TransactionStatus.COMMITTED, resType: ResourceType.EQUIPMENT, resId: equipmentData[0].name, by: 'Dr. Ananya Iyer', patient: patients[2] },
    { num: 'TX-1004', type: TransactionType.DOCTOR_ASSIGNMENT, prio: TransactionPriority.URGENT, stat: TransactionStatus.COMMITTED, resType: ResourceType.DOCTOR, resId: doctors[2].id, by: 'Dr. Sunita Deshmukh', patient: patients[3] },
    { num: 'TX-1005', type: TransactionType.OT_BOOKING, prio: TransactionPriority.CRITICAL, stat: TransactionStatus.COMMITTED, resType: ResourceType.OT, resId: otData[0].name, by: 'Dr. Meenakshi Joshi', patient: patients[4] },
    { num: 'TX-1006', type: TransactionType.BED_ALLOCATION, prio: TransactionPriority.ROUTINE, stat: TransactionStatus.ROLLED_BACK, resType: ResourceType.BED, resId: beds[2].id, by: 'Nurse Sunita Devi', patient: patients[5] },
    { num: 'TX-1007', type: TransactionType.MULTI_RESOURCE_ADMISSION, prio: TransactionPriority.EMERGENCY, stat: TransactionStatus.COMMITTED, resType: ResourceType.BED, resId: beds[3].id, by: 'Dr. Vikramaditya Rao', patient: patients[6] },
    { num: 'TX-1008', type: TransactionType.PATIENT_TRANSFER, prio: TransactionPriority.URGENT, stat: TransactionStatus.COMMITTED, resType: ResourceType.BED, resId: beds[4].id, by: 'Reception Manager Ramesh', patient: patients[7] },
    { num: 'TX-1009', type: TransactionType.BED_ALLOCATION, prio: TransactionPriority.ROUTINE, stat: TransactionStatus.ESCALATED, resType: ResourceType.BED, resId: beds[0].id, by: 'Resource Mgr Suresh', patient: patients[8] },
    { num: 'TX-1010', type: TransactionType.EQUIPMENT_RESERVATION, prio: TransactionPriority.CRITICAL, stat: TransactionStatus.COMMITTED, resType: ResourceType.EQUIPMENT, resId: equipmentData[1].name, by: 'Dr. Ananya Iyer', patient: patients[9] },
    { num: 'TX-1011', type: TransactionType.OT_BOOKING, prio: TransactionPriority.EMERGENCY, stat: TransactionStatus.COMMITTED, resType: ResourceType.OT, resId: otData[1].name, by: 'Dr. Sameer Kapoor', patient: patients[10] },
    { num: 'TX-1012', type: TransactionType.BED_ALLOCATION, prio: TransactionPriority.URGENT, stat: TransactionStatus.FAILED, resType: ResourceType.BED, resId: beds[5].id, by: 'Dr. Suresh Nair', patient: patients[11] },
  ];

  const createdTxs: any[] = [];
  for (const t of txSpecs) {
    const tx = await prisma.transaction.create({
      data: {
        transactionNumber: t.num,
        patientId: t.patient.id,
        initiatedBy: t.by,
        type: t.type,
        priority: t.prio,
        status: t.stat,
        resourceType: t.resType,
        resourceId: t.resId,
      },
    });
    createdTxs.push(tx);

    await prisma.event.createMany({
      data: [
        { eventId: `EVT-${t.num}-1`, transactionId: tx.id, eventType: EventType.RESOURCE_REQUESTED, sequenceNumber: 1, payload: JSON.stringify({ resource: t.resId, priority: t.prio }), status: EventStatus.PROCESSED },
        { eventId: `EVT-${t.num}-2`, transactionId: tx.id, eventType: EventType.RESOURCE_LOCK_ACQUIRED, sequenceNumber: 2, payload: JSON.stringify({ lockAcquired: true }), status: EventStatus.PROCESSED },
        { eventId: `EVT-${t.num}-3`, transactionId: tx.id, eventType: EventType.DOCTOR_ASSIGNED, sequenceNumber: 3, payload: JSON.stringify({ doctor: t.by }), status: EventStatus.PROCESSED },
        { eventId: `EVT-${t.num}-4`, transactionId: tx.id, eventType: t.stat === TransactionStatus.ROLLED_BACK ? EventType.ROLLED_BACK : EventType.COMMITTED, sequenceNumber: 4, payload: JSON.stringify({ status: t.stat }), status: EventStatus.PROCESSED },
      ],
    });
  }

  // Preemption Conflict Resolution Records
  await prisma.conflict.createMany({
    data: [
      {
        transactionId: createdTxs[0].id,
        resourceId: beds[0].id,
        conflictingTransactionId: createdTxs[8].id,
        winnerTransactionId: createdTxs[0].id,
        status: ConflictStatus.RESOLVED,
        reason: 'Deterministic Priority Preemption: EMERGENCY Trauma Request (TX-1001) beat ROUTINE Admission Request (TX-1009).',
      },
      {
        transactionId: createdTxs[2].id,
        resourceId: equipmentData[0].name,
        conflictingTransactionId: createdTxs[5].id,
        winnerTransactionId: createdTxs[2].id,
        status: ConflictStatus.RESOLVED,
        reason: 'Equipment Allocation Priority Preemption: EMERGENCY Ventilator Request (TX-1003) preempted ROUTINE Request (TX-1006).',
      },
      {
        transactionId: createdTxs[10].id,
        resourceId: otData[1].name,
        conflictingTransactionId: createdTxs[4].id,
        winnerTransactionId: createdTxs[10].id,
        status: ConflictStatus.RESOLVED,
        reason: 'Surgical OT Conflict Arbitration: EMERGENCY Trauma Surgery (TX-1011) granted priority access over CRITICAL Elective Surgery (TX-1005).',
      },
      {
        transactionId: createdTxs[1].id,
        resourceId: beds[1].id,
        conflictingTransactionId: createdTxs[7].id,
        winnerTransactionId: createdTxs[1].id,
        status: ConflictStatus.RESOLVED,
        reason: 'ICU Bed Preemption: CRITICAL Cardiac Failure (TX-1002) beat URGENT General Ward Transfer (TX-1008).',
      },
    ],
  });

  // Human Readable Audit Logs
  const auditLogsData = [
    { action: 'TRANSACTION_COMMITTED', entityType: 'Transaction', entityId: 'TX-1001', oldState: 'RESERVED', newState: 'COMMITTED', reason: 'Dr. Ananya Iyer successfully committed ICU Bed #01 for Emergency Patient Rahul Verma' },
    { action: 'RESOURCE_LOCK_ACQUIRED', entityType: 'Bed', entityId: beds[0].id, oldState: 'AVAILABLE', newState: 'RESERVED', reason: 'Mutex lock acquired on ICU Bed #01 for incoming trauma admission' },
    { action: 'PRIORITY_PREEMPTION', entityType: 'Conflict', entityId: 'CONF-001', oldState: 'OPEN', newState: 'RESOLVED', reason: 'Engine arbitrated conflict: EMERGENCY request displaced ROUTINE request for Bed ICU-BED-01' },
    { action: 'STAFF_CREATED', entityType: 'User', entityId: 'USER-DEPT-ADMIN', oldState: 'NULL', newState: 'ACTIVE', reason: 'Super Admin assigned Dr. Sunita Deshmukh as Department Admin for Cardiology Unit' },
    { action: 'EQUIPMENT_ALLOCATED', entityType: 'Equipment', entityId: 'VENT-001', oldState: 'AVAILABLE', newState: 'IN_USE', reason: 'ICU Ventilator Alpha allocated to Patient Rahul Verma' },
    { action: 'PATIENT_REGISTERED', entityType: 'Patient', entityId: 'PAT-1001', oldState: 'NULL', newState: 'REGISTERED', reason: 'Patient Rahul Verma completed self-registration and was allotted Dr. Ananya Iyer & Nurse Sunita Devi' },
  ];

  for (const al of auditLogsData) {
    await prisma.auditLog.create({
      data: {
        userId: users['superadmin@hospital.com'].id,
        action: al.action,
        entityType: al.entityType,
        entityId: al.entityId,
        oldState: al.oldState,
        newState: al.newState,
        reason: al.reason,
      },
    });
  }

  console.log('✅ H-02 Database Seeding with Indian Dataset Completed Successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 Demo Login Credentials (All passwords: password123):');
  console.log('   SUPER ADMIN: superadmin@hospital.com (Dr. Rajesh Sharma)');
  console.log('   DOCTOR:      doctor@hospital.com (Dr. Ananya Iyer)');
  console.log('   NURSE:       nurse@hospital.com (Nurse Sunita Devi)');
  console.log('   PATIENT:     patient@hospital.com (Patient Rahul Verma)');
  console.log('   RECEPTION:   reception@hospital.com (Reception Manager Ramesh)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
