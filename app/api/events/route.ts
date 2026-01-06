import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireEmployer, getCurrentUser } from '@/lib/auth';
import { EventType } from '@prisma/client';

// GET - List all active events
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get('eventType') as EventType | null;
    const upcoming = searchParams.get('upcoming') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    if (eventType) {
      where.eventType = eventType;
    }

    if (upcoming) {
      where.startTime = {
        gte: new Date(),
      };
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          employerProfile: {
            select: {
              companyName: true,
              companyLogo: true,
            },
          },
          _count: {
            select: {
              registrations: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST - Create a new event (employer only)
export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await requireEmployer();

    const body = await request.json();
    const {
      title,
      description,
      eventType,
      location,
      virtualLink,
      startTime,
      endTime,
      capacity,
    } = body;

    if (!title || !eventType || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        title,
        description,
        eventType,
        location,
        virtualLink,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        capacity: capacity ? parseInt(capacity) : null,
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

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
