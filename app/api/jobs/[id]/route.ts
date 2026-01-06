import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer, getCurrentUser } from '@/lib/auth';

// GET - Get a single job posting
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await prisma.jobPosting.findUnique({
      where: { id: params.id },
      include: {
        employerProfile: {
          select: {
            companyName: true,
            companyLogo: true,
            companyWebsite: true,
            industry: true,
            description: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job' },
      { status: 500 }
    );
  }
}

// PATCH - Update a job posting (employer only, own jobs)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, profile } = await requireEmployer();

    // Verify ownership
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: params.id },
    });

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (existingJob.employerProfileId !== profile.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own job postings' },
        { status: 403 }
      );
    }

    const body = await request.json();

    const job = await prisma.jobPosting.update({
      where: { id: params.id },
      data: {
        ...body,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
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

    return NextResponse.json(job);
  } catch (error) {
    console.error('Error updating job:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to update job posting' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a job posting (employer only, own jobs)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, profile } = await requireEmployer();

    // Verify ownership
    const existingJob = await prisma.jobPosting.findUnique({
      where: { id: params.id },
    });

    if (!existingJob) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (existingJob.employerProfileId !== profile.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own job postings' },
        { status: 403 }
      );
    }

    await prisma.jobPosting.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to delete job posting' },
      { status: 500 }
    );
  }
}
