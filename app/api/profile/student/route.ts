import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudent } from '@/lib/auth';

// GET - Get student profile
export async function GET(request: NextRequest) {
  try {
    const { user, profile } = await requireStudent();

    const fullProfile = await prisma.studentProfile.findUnique({
      where: { id: profile.id },
      include: {
        experiences: {
          orderBy: { startDate: 'desc' },
        },
        education: {
          orderBy: { startDate: 'desc' },
        },
        resumeData: true,
      },
    });

    return NextResponse.json(fullProfile);
  } catch (error) {
    console.error('Error fetching profile:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH - Update student profile
export async function PATCH(request: NextRequest) {
  try {
    const { user, profile } = await requireStudent();

    const body = await request.json();
    const {
      phone,
      university,
      major,
      graduationYear,
      gpa,
      bio,
      linkedinUrl,
      portfolioUrl,
      skills,
      interests,
    } = body;

    const updatedProfile = await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        phone,
        university,
        major,
        graduationYear: graduationYear ? parseInt(graduationYear) : null,
        gpa: gpa ? parseFloat(gpa) : null,
        bio,
        linkedinUrl,
        portfolioUrl,
        skills,
        interests,
      },
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
