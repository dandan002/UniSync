import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';

// GET - Get admin analytics and statistics
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Get overall counts
    const [
      totalStudents,
      totalEmployers,
      totalJobPostings,
      totalEvents,
      totalApplications,
    ] = await Promise.all([
      prisma.studentProfile.count(),
      prisma.employerProfile.count(),
      prisma.jobPosting.count(),
      prisma.event.count(),
      prisma.application.count(),
    ]);

    // Get applications by status
    const applicationsByStatus = await prisma.application.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
      ...(Object.keys(dateFilter).length > 0 && {
        where: {
          appliedAt: dateFilter,
        },
      }),
    });

    // Get jobs by type
    const jobsByType = await prisma.jobPosting.groupBy({
      by: ['jobType'],
      _count: {
        jobType: true,
      },
      where: {
        isActive: true,
      },
    });

    // Get events by type
    const eventsByType = await prisma.event.groupBy({
      by: ['eventType'],
      _count: {
        eventType: true,
      },
      where: {
        isActive: true,
      },
    });

    // Get top companies by applications
    const topCompaniesByApplications = await prisma.jobPosting.findMany({
      include: {
        employerProfile: {
          select: {
            companyName: true,
            companyLogo: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        applications: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // Get top companies by job postings
    const topCompaniesByJobs = await prisma.employerProfile.findMany({
      include: {
        _count: {
          select: {
            jobPostings: true,
          },
        },
      },
      orderBy: {
        jobPostings: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // Get student distribution by university
    const studentsByUniversity = await prisma.studentProfile.groupBy({
      by: ['university'],
      _count: {
        university: true,
      },
      orderBy: {
        _count: {
          university: 'desc',
        },
      },
      take: 10,
    });

    // Get student distribution by major
    const studentsByMajor = await prisma.studentProfile.groupBy({
      by: ['major'],
      _count: {
        major: true,
      },
      orderBy: {
        _count: {
          major: 'desc',
        },
      },
      take: 10,
    });

    // Get student distribution by graduation year
    const studentsByGradYear = await prisma.studentProfile.groupBy({
      by: ['graduationYear'],
      _count: {
        graduationYear: true,
      },
      orderBy: {
        graduationYear: 'asc',
      },
    });

    // Get application trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const applicationTrends = await prisma.$queryRaw`
      SELECT DATE(applied_at) as date, COUNT(*) as count
      FROM "Application"
      WHERE applied_at >= ${thirtyDaysAgo}
      GROUP BY DATE(applied_at)
      ORDER BY date ASC
    `;

    // Get event registration trends (last 30 days)
    const eventRegistrationTrends = await prisma.$queryRaw`
      SELECT DATE(registered_at) as date, COUNT(*) as count
      FROM "EventRegistration"
      WHERE registered_at >= ${thirtyDaysAgo}
      GROUP BY DATE(registered_at)
      ORDER BY date ASC
    `;

    // Get most popular jobs (by applications)
    const mostPopularJobs = await prisma.jobPosting.findMany({
      include: {
        employerProfile: {
          select: {
            companyName: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        applications: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    // Get most popular events (by registrations)
    const mostPopularEvents = await prisma.event.findMany({
      include: {
        employerProfile: {
          select: {
            companyName: true,
          },
        },
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: {
        registrations: {
          _count: 'desc',
        },
      },
      take: 10,
    });

    return NextResponse.json({
      overview: {
        totalStudents,
        totalEmployers,
        totalJobPostings,
        totalEvents,
        totalApplications,
      },
      applications: {
        byStatus: applicationsByStatus,
        trends: applicationTrends,
      },
      jobs: {
        byType: jobsByType,
        mostPopular: mostPopularJobs,
      },
      events: {
        byType: eventsByType,
        mostPopular: mostPopularEvents,
        registrationTrends: eventRegistrationTrends,
      },
      students: {
        byUniversity: studentsByUniversity,
        byMajor: studentsByMajor,
        byGradYear: studentsByGradYear,
      },
      employers: {
        topByApplications: topCompaniesByApplications,
        topByJobs: topCompaniesByJobs,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
