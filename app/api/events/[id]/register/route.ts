import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudent } from '@/lib/auth';

// POST - Register for an event (student only)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, profile } = await requireStudent();

    // Check if event exists and is active
    const event = await prisma.event.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            registrations: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.isActive) {
      return NextResponse.json(
        { error: 'Event is no longer active' },
        { status: 400 }
      );
    }

    // Check capacity
    if (event.capacity && event._count.registrations >= event.capacity) {
      return NextResponse.json(
        { error: 'Event is at full capacity' },
        { status: 400 }
      );
    }

    // Check if already registered
    const existingRegistration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_studentProfileId: {
          eventId: params.id,
          studentProfileId: profile.id,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: 'Already registered for this event' },
        { status: 400 }
      );
    }

    // Create registration
    const registration = await prisma.eventRegistration.create({
      data: {
        eventId: params.id,
        studentProfileId: profile.id,
      },
      include: {
        event: {
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

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error('Error registering for event:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to register for event' },
      { status: 500 }
    );
  }
}

// DELETE - Unregister from an event (student only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, profile } = await requireStudent();

    const registration = await prisma.eventRegistration.findUnique({
      where: {
        eventId_studentProfileId: {
          eventId: params.id,
          studentProfileId: profile.id,
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    await prisma.eventRegistration.delete({
      where: {
        id: registration.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unregistering from event:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to unregister from event' },
      { status: 500 }
    );
  }
}
