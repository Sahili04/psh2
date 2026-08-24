import { FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { JWT_SECRET } from '../config/env.js';

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) {
  const { email, password } = request.body as any;

  if (!email || !password) {
    return reply.status(400).send({ error: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    include: { department: true, doctors: true, nurses: true },
  });

  if (!user) {
    return reply.status(401).send({ error: 'Invalid credentials' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return reply.status(401).send({ error: 'Invalid credentials' });
  }

  // Get patient ID if role is PATIENT
  let patientId = null;
  if (user.role === 'PATIENT') {
    const p = await prisma.patient.findFirst({ where: { name: user.name } });
    if (p) patientId = p.id;
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return reply.send({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department?.name,
      departmentId: user.departmentId,
      doctorId: user.doctors[0]?.id || null,
      nurseId: user.nurses[0]?.id || null,
      patientId,
    },
  });
}

export async function registerPatientHandler(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password, dateOfBirth, gender, phone, bloodGroup } = request.body as any;

  if (!name || !email || !password) {
    return reply.status(400).send({ error: 'Name, email, and password are required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return reply.status(400).send({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const patientNumber = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'PATIENT',
    },
  });

  const patient = await prisma.patient.create({
    data: {
      patientNumber,
      name,
      dateOfBirth: dateOfBirth || '1995-01-01',
      gender: gender || 'Male',
      phone: phone || '+1-555-0100',
      address: '100 Main St',
      emergencyContact: '+1-555-9999',
      bloodGroup: bloodGroup || 'O+',
      priority: 'ROUTINE',
    },
  });

  const token = jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return reply.send({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      patientId: patient.id,
    },
  });
}

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { department: true, doctors: true, nurses: true },
    });

    if (!user) return reply.status(404).send({ error: 'User not found' });

    let patientId = null;
    if (user.role === 'PATIENT') {
      const p = await prisma.patient.findFirst({ where: { name: user.name } });
      if (p) patientId = p.id;
    }

    return reply.send({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department?.name,
      departmentId: user.departmentId,
      doctorId: user.doctors[0]?.id || null,
      nurseId: user.nurses[0]?.id || null,
      patientId,
    });
  } catch (e) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

export async function getUsersHandler(request: FastifyRequest, reply: FastifyReply) {
  const users = await prisma.user.findMany({
    include: { department: true },
    orderBy: { createdAt: 'desc' },
  });
  return reply.send(users);
}

export async function createDepartmentAdminHandler(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password, departmentId, organizationId } = request.body as any;

  if (!name || !email || !departmentId) {
    return reply.status(400).send({ error: 'Name, email, and departmentId are required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return reply.status(400).send({ error: 'An account with this email already exists' });
  }

  const genPassword = password || 'DeptAdmin2026!';
  const passwordHash = await bcrypt.hash(genPassword, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'DEPARTMENT_ADMIN',
      departmentId,
      organizationId: organizationId || null,
    },
    include: { department: true },
  });

  return reply.send({
    message: `Department Admin account created for ${user.name}!`,
    user,
    credentials: {
      email: user.email,
      password: genPassword,
      role: 'DEPARTMENT_ADMIN',
      department: user.department?.name,
    },
  });
}

export async function createStaffHandler(request: FastifyRequest, reply: FastifyReply) {
  const { name, email, password, role, departmentId, organizationId, specialization, licenseNumber } = request.body as any;

  if (!name || !email || !role) {
    return reply.status(400).send({ error: 'Name, email, and role are required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return reply.status(400).send({ error: 'Email already registered' });
  }

  const genPassword = password || 'StaffPass2026!';
  const passwordHash = await bcrypt.hash(genPassword, 10);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      departmentId: departmentId || null,
      organizationId: organizationId || null,
    },
  });

  if (role === 'DOCTOR' && departmentId) {
    await prisma.doctor.create({
      data: {
        userId: user.id,
        specialization: specialization || 'General Medicine',
        licenseNumber: licenseNumber || `LIC-${Math.floor(10000 + Math.random() * 90000)}`,
        departmentId,
      },
    });
  } else if (role === 'NURSE' && departmentId) {
    await prisma.nurse.create({
      data: {
        userId: user.id,
        departmentId,
      },
    });
  }

  return reply.send({
    message: `${role} account created successfully!`,
    user,
    credentials: {
      email: user.email,
      password: genPassword,
      role,
    },
  });
}

export async function deleteUserHandler(request: FastifyRequest, reply: FastifyReply) {
  const { id } = request.params as any;

  // Cleanup doctors or nurses linked
  await prisma.doctor.deleteMany({ where: { userId: id } });
  await prisma.nurse.deleteMany({ where: { userId: id } });
  await prisma.auditLog.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });

  return reply.send({ message: 'User access revoked and account deleted' });
}
