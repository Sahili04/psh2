import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../config/prisma.js';
import bcrypt from 'bcryptjs';
import { broadcastEvent } from '../websocket/broadcaster.js';

// 1. PUBLIC: Register a new Organization / Hospital (Status: PENDING)
export async function registerOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const {
      name,
      registrationNumber,
      email,
      phone,
      address,
      city,
      hospitalType,
      superAdminName,
      superAdminEmail,
    } = request.body as any;

    if (!name || !registrationNumber || !email || !superAdminEmail) {
      return reply.status(400).send({ message: 'Missing required hospital fields (name, registration number, email, super admin email)' });
    }

    // Check existing registration number
    const existingReg = await prisma.organization.findFirst({
      where: {
        OR: [
          { registrationNumber },
          { email },
          { code: `HOSP-${registrationNumber.slice(-4).toUpperCase()}` },
        ],
      },
    });

    if (existingReg) {
      return reply.status(409).send({ message: 'A hospital with this Registration Number or Email is already registered in the ecosystem.' });
    }

    // Generate unique code e.g. HOSP-1089
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `HOSP-${randomSuffix}`;

    const org = await prisma.organization.create({
      data: {
        name,
        code,
        registrationNumber,
        email,
        phone: phone || '+1-800-HOSPITAL',
        address: address || 'Main Medical Complex',
        city: city || 'Metropolis',
        hospitalType: hospitalType || 'MULTI_SPECIALTY',
        status: 'PENDING',
        superAdminName: superAdminName || `${name} Executive Director`,
        superAdminEmail,
      },
    });

    broadcastEvent('organization:created', { organization: org });

    return reply.status(201).send({
      message: 'Hospital registration application submitted successfully! Pending Platform Owner authorization.',
      organization: org,
    });
  } catch (err: any) {
    console.error('Failed to register organization:', err);
    return reply.status(500).send({ message: err.message || 'Failed to submit hospital registration' });
  }
}

// 2. PUBLIC: Check Organization Registration Status (by Reg Number or Email)
export async function checkOrganizationStatusHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { query } = request.query as any;
    if (!query) {
      return reply.status(400).send({ message: 'Please provide registration number or email to check status' });
    }

    const org = await prisma.organization.findFirst({
      where: {
        OR: [
          { registrationNumber: { equals: query } },
          { email: { equals: query } },
          { superAdminEmail: { equals: query } },
          { code: { equals: query } },
        ],
      },
      include: {
        users: {
          where: { role: 'SUPER_ADMIN' },
          select: { id: true, name: true, email: true, role: true, status: true },
        },
      },
    });

    if (!org) {
      return reply.status(404).send({ message: 'No registered hospital found matching your query.' });
    }

    return reply.send({ organization: org });
  } catch (err: any) {
    return reply.status(500).send({ message: err.message || 'Failed to check status' });
  }
}

// 3. PLATFORM OWNER: Get All Organizations
export async function getAllOrganizationsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const orgs = await prisma.organization.findMany({
      include: {
        departments: true,
        users: {
          select: { id: true, name: true, email: true, role: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(orgs);
  } catch (err: any) {
    return reply.status(500).send({ message: err.message || 'Failed to fetch organizations' });
  }
}

// 4. PLATFORM OWNER: Get Pending Organizations
export async function getPendingOrganizationsHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const pendingOrgs = await prisma.organization.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(pendingOrgs);
  } catch (err: any) {
    return reply.status(500).send({ message: err.message || 'Failed to fetch pending requests' });
  }
}

// 5. PLATFORM OWNER: Approve Hospital Request & Auto-Generate Super Admin Credentials
export async function approveOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const { initialPassword } = request.body as any;

    const org = await prisma.organization.findUnique({ where: { id } });
    if (!org) {
      return reply.status(404).send({ message: 'Organization not found' });
    }

    if (org.status === 'APPROVED') {
      return reply.status(400).send({ message: 'Hospital is already authorized and approved.' });
    }

    // Default or custom password for Super Admin
    const defaultPass = initialPassword || 'HospitalPass2026!';
    const passwordHash = await bcrypt.hash(defaultPass, 10);

    // Update Org Status to APPROVED
    const updatedOrg = await prisma.organization.update({
      where: { id },
      data: { status: 'APPROVED', rejectionReason: null },
    });

    // Check if Super Admin user already exists for this email
    let superAdmin = await prisma.user.findUnique({
      where: { email: org.superAdminEmail },
    });

    if (!superAdmin) {
      superAdmin = await prisma.user.create({
        data: {
          name: org.superAdminName,
          email: org.superAdminEmail,
          passwordHash,
          role: 'SUPER_ADMIN',
          organizationId: org.id,
          status: 'ACTIVE',
        },
      });
    } else {
      superAdmin = await prisma.user.update({
        where: { id: superAdmin.id },
        data: {
          role: 'SUPER_ADMIN',
          organizationId: org.id,
          passwordHash,
          status: 'ACTIVE',
        },
      });
    }

    broadcastEvent('organization:updated', { organization: updatedOrg });

    return reply.send({
      message: `Hospital ${org.name} successfully authorized! Super Admin account generated.`,
      organization: updatedOrg,
      superAdmin: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        generatedPassword: defaultPass,
      },
    });
  } catch (err: any) {
    console.error('Error approving organization:', err);
    return reply.status(500).send({ message: err.message || 'Failed to approve organization' });
  }
}

// 6. PLATFORM OWNER: Reject Hospital Request
export async function rejectOrganizationHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = request.params as any;
    const { reason } = request.body as any;

    const org = await prisma.organization.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason || 'Registration details did not meet health accreditation requirements.',
      },
    });

    broadcastEvent('organization:updated', { organization: org });

    return reply.send({ message: `Hospital registration application for ${org.name} rejected.`, organization: org });

    return reply.send({
      message: `Hospital application for ${org.name} rejected.`,
      organization: org,
    });
  } catch (err: any) {
    return reply.status(500).send({ message: err.message || 'Failed to reject organization' });
  }
}
