import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  Role, BedType, BedStatus, EquipmentStatus, OTStatus,
  AppointmentStatus, AdmissionStatus, TransactionType, TransactionPriority,
  TransactionStatus, ResourceType, EventType, EventStatus, ConflictStatus
} from './types/domain.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting H-02 Hospital System Database Seeding...');

  // Clean up database
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
  await prisma.equipment.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.nurse.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create 22 Multi-Specialty Departments
  const deptData = [
    { name: 'Emergency & Trauma', specialty: 'Emergency Medicine', floor: 1, capacity: 30 },
    { name: 'General Medicine', specialty: 'Internal Medicine', floor: 1, capacity: 50 },
    { name: 'Cardiology Unit', specialty: 'Cardiology', floor: 2, capacity: 40 },
    { name: 'Neurology Department', specialty: 'Neurology', floor: 3, capacity: 25 },
    { name: 'Orthopedics Center', specialty: 'Orthopedics', floor: 2, capacity: 35 },
    { name: 'Gynecology & Obstetrics', specialty: 'Obstetrics & Gynecology', floor: 3, capacity: 30 },
    { name: 'Pediatrics Ward', specialty: 'Pediatrics', floor: 4, capacity: 30 },
    { name: 'Surgical Suite', specialty: 'General Surgery', floor: 3, capacity: 30 },
    { name: 'Oncology Center', specialty: 'Oncology', floor: 5, capacity: 20 },
    { name: 'Gastroenterology', specialty: 'Gastroenterology', floor: 2, capacity: 20 },
    { name: 'Pulmonology', specialty: 'Pulmonology', floor: 3, capacity: 20 },
    { name: 'Nephrology', specialty: 'Nephrology', floor: 4, capacity: 20 },
    { name: 'Urology', specialty: 'Urology', floor: 2, capacity: 15 },
    { name: 'ENT (Ear Nose Throat)', specialty: 'Otolaryngology', floor: 1, capacity: 15 },
    { name: 'Ophthalmology', specialty: 'Ophthalmology', floor: 1, capacity: 15 },
    { name: 'Dermatology', specialty: 'Dermatology', floor: 1, capacity: 15 },
    { name: 'Psychiatry', specialty: 'Psychiatry', floor: 5, capacity: 20 },
    { name: 'Intensive Care Unit (ICU)', specialty: 'Critical Care', floor: 4, capacity: 20 },
    { name: 'Radiology & Imaging', specialty: 'Radiology', floor: 1, capacity: 15 },
    { name: 'Pathology & Laboratory', specialty: 'Pathology', floor: 1, capacity: 15 },
    { name: 'Anesthesiology', specialty: 'Anesthesiology', floor: 3, capacity: 15 },
    { name: 'Physiotherapy', specialty: 'Physical Therapy', floor: 1, capacity: 20 },
  ];

  const depts: any = {};
  for (const d of deptData) {
    const created = await prisma.department.create({ data: d });
    depts[d.name] = created;
  }

  // 2. Create Super Admin + Department Admins
  const demoUsers = [
    { name: 'Super Admin Control', email: 'superadmin@hospital.com', role: Role.SUPER_ADMIN, dept: null },
    { name: 'Emergency Dept Admin', email: 'admin.emergency@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Emergency & Trauma'].id },
    { name: 'Cardiology Dept Admin', email: 'admin.cardiology@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Cardiology Unit'].id },
    { name: 'Neurology Dept Admin', email: 'admin.neurology@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Neurology Department'].id },
    { name: 'Orthopedics Dept Admin', email: 'admin.orthopedics@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Orthopedics Center'].id },
    { name: 'Pediatrics Dept Admin', email: 'admin.pediatrics@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Pediatrics Ward'].id },
    { name: 'Oncology Dept Admin', email: 'admin.oncology@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Oncology Center'].id },
    { name: 'General Medicine Admin', email: 'admin.general@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['General Medicine'].id },
    { name: 'Surgical Suite Admin', email: 'admin.surgery@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Surgical Suite'].id },
    { name: 'ICU Department Admin', email: 'deptadmin@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Intensive Care Unit (ICU)'].id },
    { name: 'Radiology Dept Admin', email: 'admin.radiology@hospital.com', role: Role.DEPARTMENT_ADMIN, dept: depts['Radiology & Imaging'].id },

    // Staff & Patients
    { name: 'Dr. Sarah Jenkins', email: 'doctor@hospital.com', role: Role.DOCTOR, dept: depts['Intensive Care Unit (ICU)'].id },
    { name: 'Dr. Robert Chen', email: 'doctor2@hospital.com', role: Role.DOCTOR, dept: depts['Emergency & Trauma'].id },
    { name: 'Nurse Emily Watson', email: 'nurse@hospital.com', role: Role.NURSE, dept: depts['Intensive Care Unit (ICU)'].id },
    { name: 'Reception Manager Michael', email: 'reception@hospital.com', role: Role.RECEPTIONIST, dept: depts['General Medicine'].id },
    { name: 'Resource Mgr David', email: 'resource@hospital.com', role: Role.RESOURCE_MANAGER, dept: depts['Intensive Care Unit (ICU)'].id },
    { name: 'Patient John Doe', email: 'patient@hospital.com', role: Role.PATIENT, dept: null },
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
      },
    });
    users[u.email] = created;
  }

  // 3. Create 15 Doctors
  const doctorSpecs = [
    { name: 'Dr. Sarah Jenkins', email: 'doctor@hospital.com', spec: 'Critical Care & ICU', lic: 'LIC-ICU-001', dept: depts['Intensive Care Unit (ICU)'] },
    { name: 'Dr. Robert Chen', email: 'doctor2@hospital.com', spec: 'Emergency Medicine', lic: 'LIC-EMG-002', dept: depts['Emergency & Trauma'] },
    { name: 'Dr. Arthur Pendelton', email: 'dr.arthur@hospital.com', spec: 'Cardiology', lic: 'LIC-CAR-003', dept: depts['Cardiology Unit'] },
    { name: 'Dr. Elena Rostova', email: 'dr.elena@hospital.com', spec: 'Neurology', lic: 'LIC-NEU-004', dept: depts['Neurology Department'] },
    { name: 'Dr. Marcus Vance', email: 'dr.marcus@hospital.com', spec: 'Orthopedics', lic: 'LIC-ORT-005', dept: depts['Orthopedics Center'] },
    { name: 'Dr. Priya Sharma', email: 'dr.priya@hospital.com', spec: 'Pediatrics', lic: 'LIC-PED-006', dept: depts['Pediatrics Ward'] },
    { name: 'Dr. James Wilson', email: 'dr.wilson@hospital.com', spec: 'Oncology', lic: 'LIC-ONC-007', dept: depts['Oncology Center'] },
    { name: 'Dr. House Gregory', email: 'dr.house@hospital.com', spec: 'Internal Medicine', lic: 'LIC-GEN-008', dept: depts['General Medicine'] },
    { name: 'Dr. Meredith Grey', email: 'dr.grey@hospital.com', spec: 'General Surgery', lic: 'LIC-SUR-009', dept: depts['Surgical Suite'] },
    { name: 'Dr. Derek Shepherd', email: 'dr.shepherd@hospital.com', spec: 'Neurosurgery', lic: 'LIC-NEU-010', dept: depts['Neurology Department'] },
    { name: 'Dr. Cristina Yang', email: 'dr.yang@hospital.com', spec: 'Cardiothoracic Surgery', lic: 'LIC-CAR-011', dept: depts['Cardiology Unit'] },
    { name: 'Dr. Alex Karev', email: 'dr.karev@hospital.com', spec: 'Pediatric Surgery', lic: 'LIC-PED-012', dept: depts['Pediatrics Ward'] },
    { name: 'Dr. Miranda Bailey', email: 'dr.bailey@hospital.com', spec: 'General Surgery', lic: 'LIC-SUR-013', dept: depts['Surgical Suite'] },
    { name: 'Dr. Owen Hunt', email: 'dr.hunt@hospital.com', spec: 'Trauma Surgery', lic: 'LIC-EMG-014', dept: depts['Emergency & Trauma'] },
    { name: 'Dr. Arizona Robbins', email: 'dr.robbins@hospital.com', spec: 'Pediatric Surgery', lic: 'LIC-PED-015', dept: depts['Pediatrics Ward'] },
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

  // Update Head Doctor for each Department
  await prisma.department.update({ where: { id: depts['Intensive Care Unit (ICU)'].id }, data: { headDoctorId: doctors[0].id } });
  await prisma.department.update({ where: { id: depts['Emergency & Trauma'].id }, data: { headDoctorId: doctors[1].id } });

  // 4. Create 15 Nurses
  const nurseNames = [
    'Nurse Emily Watson', 'Nurse Clara Oswald', 'Nurse Amy Pond', 'Nurse Rory Williams',
    'Nurse Martha Jones', 'Nurse Rose Tyler', 'Nurse Donna Noble', 'Nurse Sarah Jane',
    'Nurse Jack Harkness', 'Nurse River Song', 'Nurse Bill Potts', 'Nurse Nardole',
    'Nurse Yasmin Khan', 'Nurse Ryan Sinclair', 'Nurse Graham O'
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

  // 5. Create 30 Synthetic Patients
  const patients: any[] = [];
  for (let i = 1; i <= 30; i++) {
    const p = await prisma.patient.create({
      data: {
        patientNumber: `PAT-${1000 + i}`,
        name: i === 1 ? 'Patient John Doe' : `Patient Demo ${i}`,
        dateOfBirth: `198${i % 9}-0${(i % 9) + 1}-15`,
        gender: i % 2 === 0 ? 'Female' : 'Male',
        phone: `+1-555-01${i < 10 ? '0' + i : i}`,
        address: `${100 + i} Medical Blvd, Cityville`,
        emergencyContact: `+1-555-99${i < 10 ? '0' + i : i}`,
        bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'O-'][i % 5],
        allergies: i % 3 === 0 ? 'Penicillin' : 'None',
        medicalHistory: i % 2 === 0 ? 'Hypertension, Asthma' : 'None',
        priority: i === 1 ? TransactionPriority.EMERGENCY : i % 5 === 0 ? TransactionPriority.CRITICAL : TransactionPriority.ROUTINE,
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
  const equipmentData = [
    { name: 'ICU Ventilator Alpha', type: 'VENTILATOR', serialNumber: 'VENT-001', dept: icuDept, status: EquipmentStatus.IN_USE, currentPatientId: patients[0].id },
    { name: 'ICU Ventilator Beta', type: 'VENTILATOR', serialNumber: 'VENT-002', dept: icuDept, status: EquipmentStatus.RESERVED },
    { name: 'Cardiac Defibrillator X1', type: 'DEFIBRILLATOR', serialNumber: 'DEFIB-001', dept: depts['Cardiology Unit'], status: EquipmentStatus.AVAILABLE },
    { name: 'Portable Ultrasound Scan', type: 'ULTRASOUND', serialNumber: 'ULT-001', dept: depts['Radiology & Imaging'], status: EquipmentStatus.AVAILABLE },
    { name: 'Infusion Pump Tower A', type: 'INFUSION_PUMP', serialNumber: 'INF-001', dept: icuDept, status: EquipmentStatus.IN_USE },
  ];

  for (const eq of equipmentData) {
    await prisma.equipment.create({
      data: {
        name: eq.name,
        type: eq.type,
        serialNumber: eq.serialNumber,
        departmentId: eq.dept.id,
        location: `Floor ${eq.dept.floor}`,
        status: eq.status,
        currentPatientId: eq.currentPatientId || null,
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

  // 8.5. Create 20 Appointments, 10 Admissions, 15 Prescriptions, 15 Vitals & Care Tasks
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
        reason: ['Chest Pain Evaluation', 'Routine Hypertension Check', 'Post-Op Surgical Review', 'Pediatric Fever Evaluation', 'Neurological Headache Consultation'][i % 5],
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

    const c = await prisma.consultation.create({
      data: {
        patientId: p.id,
        doctorId: d.id,
        symptoms: ['Chest pain', 'Headache', 'Joint stiffness', 'Cough', 'Fever'][i % 5],
        observations: 'Vital signs stable. Heart sounds S1 S2 clear.',
        diagnosis: ['Hypertension', 'Acute Bronchitis', 'Osteoarthritis', 'Migraine', 'Gastritis'][i % 5],
        treatmentPlan: 'Medication prescribed. Follow up in 1 week.',
        notes: 'Patient advised rest and hydration.',
      },
    });

    await prisma.prescription.create({
      data: {
        patientId: p.id,
        doctorId: d.id,
        medicine: ['Amoxicillin 500mg', 'Atorvastatin 20mg', 'Metformin 500mg', 'Ibuprofen 400mg', 'Lisinopril 10mg'][i % 5],
        dosage: '1 Tablet',
        frequency: ['TID (3x daily)', 'QD (1x daily)', 'BID (2x daily)', 'PRN (As needed)'][i % 4],
        duration: '7 Days',
        instructions: 'Take after meals with plenty of water.',
      },
    });

    await prisma.vital.create({
      data: {
        patientId: p.id,
        recordedBy: 'Nurse Emily Watson',
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

  // 9. Create Rich Initial Transactions, Conflicts & Audit Logs
  const txSpecs = [
    { num: 'TX-1001', type: TransactionType.MULTI_RESOURCE_ADMISSION, prio: TransactionPriority.EMERGENCY, stat: TransactionStatus.COMMITTED, resType: ResourceType.BED, resId: beds[0].id, by: 'Dr. Sarah Jenkins', patient: patients[0] },
    { num: 'TX-1002', type: TransactionType.BED_ALLOCATION, prio: TransactionPriority.CRITICAL, stat: TransactionStatus.COMMITTED, resType: ResourceType.BED, resId: beds[1].id, by: 'Dr. Robert Chen', patient: patients[1] },
    { num: 'TX-1003', type: TransactionType.EQUIPMENT_RESERVATION, prio: TransactionPriority.EMERGENCY, stat: TransactionStatus.COMMITTED, resType: ResourceType.EQUIPMENT, resId: equipmentData[0].name, by: 'Dr. Sarah Jenkins', patient: patients[2] },
    { num: 'TX-1004', type: TransactionType.DOCTOR_ASSIGNMENT, prio: TransactionPriority.URGENT, stat: TransactionStatus.COMMITTED, resType: ResourceType.DOCTOR, resId: doctors[2].id, by: 'Dr. Arthur Pendelton', patient: patients[3] },
    { num: 'TX-1005', type: TransactionType.OT_BOOKING, prio: TransactionPriority.CRITICAL, stat: TransactionStatus.COMMITTED, resType: ResourceType.OT, resId: otData[0].name, by: 'Dr. Meredith Grey', patient: patients[4] },
    { num: 'TX-1006', type: TransactionType.BED_ALLOCATION, prio: TransactionPriority.ROUTINE, stat: TransactionStatus.ROLLED_BACK, resType: ResourceType.BED, resId: beds[2].id, by: 'Nurse Emily Watson', patient: patients[5] },
    { num: 'TX-1007', type: TransactionType.MULTI_RESOURCE_ADMISSION, prio: TransactionPriority.EMERGENCY, stat: TransactionStatus.COMMITTED, resType: ResourceType.BED, resId: beds[3].id, by: 'Dr. Robert Chen', patient: patients[6] },
    { num: 'TX-1008', type: TransactionType.PATIENT_TRANSFER, prio: TransactionPriority.URGENT, stat: TransactionStatus.COMMITTED, resType: ResourceType.BED, resId: beds[4].id, by: 'Reception Manager Michael', patient: patients[7] },
    { num: 'TX-1009', type: TransactionType.BED_ALLOCATION, prio: TransactionPriority.ROUTINE, stat: TransactionStatus.ESCALATED, resType: ResourceType.BED, resId: beds[0].id, by: 'Resource Mgr David', patient: patients[8] },
    { num: 'TX-1010', type: TransactionType.EQUIPMENT_RESERVATION, prio: TransactionPriority.CRITICAL, stat: TransactionStatus.COMMITTED, resType: ResourceType.EQUIPMENT, resId: equipmentData[1].name, by: 'Dr. Sarah Jenkins', patient: patients[9] },
    { num: 'TX-1011', type: TransactionType.OT_BOOKING, prio: TransactionPriority.EMERGENCY, stat: TransactionStatus.COMMITTED, resType: ResourceType.OT, resId: otData[1].name, by: 'Dr. Owen Hunt', patient: patients[10] },
    { num: 'TX-1012', type: TransactionType.BED_ALLOCATION, prio: TransactionPriority.URGENT, stat: TransactionStatus.FAILED, resType: ResourceType.BED, resId: beds[5].id, by: 'Dr. House Gregory', patient: patients[11] },
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

  // Seed 4 Realistic Preemption Conflict Resolution Records
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

  // Seed 15 Human Readable Audit Logs
  const auditLogsData = [
    { action: 'TRANSACTION_COMMITTED', entityType: 'Transaction', entityId: 'TX-1001', oldState: 'RESERVED', newState: 'COMMITTED', reason: 'Dr. Sarah Jenkins successfully committed ICU Bed #01 for Emergency Patient John Doe' },
    { action: 'RESOURCE_LOCK_ACQUIRED', entityType: 'Bed', entityId: beds[0].id, oldState: 'AVAILABLE', newState: 'RESERVED', reason: 'Mutex lock acquired on ICU Bed #01 for incoming trauma admission' },
    { action: 'PRIORITY_PREEMPTION', entityType: 'Conflict', entityId: 'CONF-001', oldState: 'OPEN', newState: 'RESOLVED', reason: 'Engine arbitrated conflict: EMERGENCY request displaced ROUTINE request for Bed ICU-BED-01' },
    { action: 'SAGA_COMPENSATION_TRIGGERED', entityType: 'Transaction', entityId: 'TX-1006', oldState: 'PROCESSING', newState: 'COMPENSATING', reason: 'Ventilator timeout triggered Saga compensation step to release reserved Bed' },
    { action: 'SAGA_ROLLBACK_COMPLETED', entityType: 'Transaction', entityId: 'TX-1006', oldState: 'COMPENSATING', newState: 'ROLLED_BACK', reason: 'All reserved resources cleanly released; transaction TX-1006 marked ROLLED_BACK' },
    { action: 'OUT_OF_ORDER_EVENT_FLAGGED', entityType: 'Event', entityId: 'EVT-1012-3', oldState: 'RECEIVED', newState: 'OUT_OF_ORDER', reason: 'Sequence #3 arrived before Sequence #2; event flagged OUT_OF_ORDER to prevent state corruption' },
    { action: 'STAFF_CREATED', entityType: 'User', entityId: 'USER-DEPT-ADMIN', oldState: 'NULL', newState: 'ACTIVE', reason: 'Super Admin assigned Alex Admin as Department Admin for Cardiology Unit' },
    { action: 'EQUIPMENT_ALLOCATED', entityType: 'Equipment', entityId: 'VENT-001', oldState: 'AVAILABLE', newState: 'IN_USE', reason: 'ICU Ventilator Alpha allocated to Patient John Doe' },
    { action: 'OT_SCHEDULED', entityType: 'OperationTheatre', entityId: 'OT-1', oldState: 'AVAILABLE', newState: 'SCHEDULED', reason: 'Dr. Meredith Grey scheduled Emergency Neurosurgery in OT-1' },
    { action: 'PATIENT_REGISTERED', entityType: 'Patient', entityId: 'PAT-1001', oldState: 'NULL', newState: 'REGISTERED', reason: 'Patient Jane Smith completed self-registration via Patient Portal' },
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

  console.log('✅ H-02 Database Seeding Completed Successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 Demo Login Credentials (All passwords: password123):');
  console.log('   SUPER ADMIN: superadmin@hospital.com');
  console.log('   DEPT ADMINS (10 Enlisted Departments):');
  console.log('     - Emergency:    admin.emergency@hospital.com');
  console.log('     - Cardiology:   admin.cardiology@hospital.com');
  console.log('     - Neurology:    admin.neurology@hospital.com');
  console.log('     - Orthopedics:  admin.orthopedics@hospital.com');
  console.log('     - Pediatrics:   admin.pediatrics@hospital.com');
  console.log('     - Oncology:     admin.oncology@hospital.com');
  console.log('     - Gen Medicine: admin.general@hospital.com');
  console.log('     - Surgery:      admin.surgery@hospital.com');
  console.log('     - ICU Admin:    deptadmin@hospital.com');
  console.log('     - Radiology:    admin.radiology@hospital.com');
  console.log('   DOCTOR:           doctor@hospital.com');
  console.log('   NURSE:            nurse@hospital.com');
  console.log('   PATIENT:          patient@hospital.com');
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
