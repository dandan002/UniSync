import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

// POST - Complete user onboarding
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role, firstName, lastName, ...profileData } = body;

    if (!role || !['STUDENT', 'EMPLOYER', 'ADMIN'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already onboarded' },
        { status: 400 }
      );
    }

    // Create user and profile
    const user = await prisma.user.create({
      data: {
        auth0Id: session.user.sub,
        email: session.user.email!,
        role: role as UserRole,
        firstName,
        lastName,
        ...(role === 'STUDENT' && {
          studentProfile: {
            create: {
              phone: profileData.phone,
              university: profileData.university,
              major: profileData.major,
              graduationYear: profileData.graduationYear
                ? parseInt(profileData.graduationYear)
                : undefined,
            },
          },
        }),
        ...(role === 'EMPLOYER' && {
          employerProfile: {
            create: {
              companyName: profileData.companyName,
              companyWebsite: profileData.companyWebsite,
              industry: profileData.industry,
              description: profileData.description,
            },
          },
        }),
        ...(role === 'ADMIN' && {
          adminProfile: {
            create: {
              organizationName: profileData.organizationName,
              organizationType: profileData.organizationType,
            },
          },
        }),
      },
      include: {
        studentProfile: true,
        employerProfile: true,
        adminProfile: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Error during onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}

// GET - Check if user needs onboarding
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session?.user) {
      return NextResponse.json({ needsOnboarding: true });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub },
      include: {
        studentProfile: true,
        employerProfile: true,
        adminProfile: true,
      },
    });

    return NextResponse.json({
      needsOnboarding: !user,
      user,
    });
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return NextResponse.json(
      { error: 'Failed to check onboarding status' },
      { status: 500 }
    );
  }
}
