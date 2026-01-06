import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer, getCurrentUser } from '@/lib/auth';
import { JobType } from '@prisma/client';

// GET - List all active job postings (with optional filtering for students)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const jobType = searchParams.get('jobType') as JobType | null;
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const user = await getCurrentUser();

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (jobType) {
      where.jobType = jobType;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { employerProfile: { companyName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // If user is a student, filter by targeting criteria
    if (user?.role === 'STUDENT' && user.studentProfile) {
      const profile = user.studentProfile;

      // This is a simplified targeting logic
      // In production, you'd want more sophisticated matching
      where.AND = [
        {
          OR: [
            { targetUniversities: { contains: profile.university || '' } },
            { targetUniversities: null },
          ],
        },
        {
          OR: [
            { targetMajors: { contains: profile.major || '' } },
            { targetMajors: null },
          ],
        },
        {
          OR: [
            { targetGradYears: { contains: profile.graduationYear?.toString() || '' } },
            { targetGradYears: null },
          ],
        },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.jobPosting.findMany({
        where,
        include: {
          employerProfile: {
            select: {
              companyName: true,
              companyLogo: true,
              industry: true,
            },
          },
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.jobPosting.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// POST - Create a new job posting (employer only)
export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await requireEmployer();

    const body = await request.json();
    const {
      title,
      description,
      requirements,
      jobType,
      location,
      salary,
      externalUrl,
      targetKeywords,
      targetUniversities,
      targetMajors,
      targetGradYears,
      deadline,
    } = body;

    if (!title || !description || !jobType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const job = await prisma.jobPosting.create({
      data: {
        title,
        description,
        requirements,
        jobType,
        location,
        salary,
        externalUrl,
        targetKeywords,
        targetUniversities,
        targetMajors,
        targetGradYears,
        deadline: deadline ? new Date(deadline) : null,
        employerProfileId: profile.id,
      },
      include: {
        employerProfile: {
          select: {
            companyName: true,
            companyLogo: true,
          },
        },
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create job posting' },
      { status: 500 }
    );
  }
}
