import { getSession } from '@auth0/nextjs-auth0';
import { prisma } from './prisma';
import { UserRole } from '@prisma/client';

export async function getCurrentUser() {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { auth0Id: session.user.sub },
    include: {
      studentProfile: true,
      employerProfile: true,
      adminProfile: true,
    },
  });

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();

  if (user.role !== role) {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return user;
}

export async function requireStudent() {
  const user = await requireUser();

  if (user.role !== 'STUDENT' || !user.studentProfile) {
    throw new Error('Forbidden: Student access required');
  }

  return { user, profile: user.studentProfile };
}

export async function requireEmployer() {
  const user = await requireUser();

  if (user.role !== 'EMPLOYER' || !user.employerProfile) {
    throw new Error('Forbidden: Employer access required');
  }

  return { user, profile: user.employerProfile };
}

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== 'ADMIN' || !user.adminProfile) {
    throw new Error('Forbidden: Admin access required');
  }

  return { user, profile: user.adminProfile };
}
