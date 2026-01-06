import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudent, getCurrentUser } from '@/lib/auth';
import { sendApplicationConfirmationEmail } from '@/lib/email';

// GET - Get applications (for students - their own, for employers - to their jobs)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    let where: any = {};

    if (user.role === 'STUDENT' && user.studentProfile) {
      where.studentProfileId = user.studentProfile.id;
    } else if (user.role === 'EMPLOYER' && user.employerProfile) {
      where.jobPosting = {
        employerProfileId: user.employerProfile.id,
      };
    } else {
      return NextResponse.json({ error: 'Invalid user role' }, { status: 403 });
    }

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          jobPosting: {
            include: {
              employerProfile: {
                select: {
                  companyName: true,
                  companyLogo: true,
                },
              },
            },
          },
          studentProfile: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          appliedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

// POST - Submit an application (student only)
export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await requireStudent();

    const body = await request.json();
    const { jobPostingId, coverLetter, customResumeUrl } = body;

    if (!jobPostingId) {
      return NextResponse.json(
        { error: 'Job posting ID is required' },
        { status: 400 }
      );
    }

    // Check if job exists and is active
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobPostingId },
      include: {
        employerProfile: {
          select: {
            companyName: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (!job.isActive) {
      return NextResponse.json(
        { error: 'Job posting is no longer active' },
        { status: 400 }
      );
    }

    // Check if already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobPostingId_studentProfileId: {
          jobPostingId,
          studentProfileId: profile.id,
        },
      },
    });

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied to this job' },
        { status: 400 }
      );
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        jobPostingId,
        studentProfileId: profile.id,
        coverLetter,
        customResumeUrl,
      },
      include: {
        jobPosting: {
          include: {
            employerProfile: {
              select: {
                companyName: true,
              },
            },
          },
        },
      },
    });

    // Send confirmation email
    if (user.email && user.firstName) {
      await sendApplicationConfirmationEmail({
        email: user.email,
        studentName: user.firstName,
        jobTitle: job.title,
        companyName: job.employerProfile.companyName,
      });
    }

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error('Error creating application:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to submit application' },
      { status: 500 }
    );
  }
}
