import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireStudent } from '@/lib/auth';
import { generateLatexResume, compileLatexToPdfViaApi, ResumeData } from '@/lib/latex';

// POST - Generate resume PDF from profile data
export async function POST(request: NextRequest) {
  try {
    const { user, profile } = await requireStudent();

    const body = await request.json();
    const { customData } = body;

    // Fetch complete profile data
    const fullProfile = await prisma.studentProfile.findUnique({
      where: { id: profile.id },
      include: {
        user: true,
        experiences: {
          orderBy: { startDate: 'desc' },
        },
        education: {
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!fullProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Build resume data
    const resumeData: ResumeData = customData || {
      personalInfo: {
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        email: user.email,
        phone: fullProfile.phone || undefined,
        location: fullProfile.university || undefined,
        linkedin: fullProfile.linkedinUrl || undefined,
        website: fullProfile.portfolioUrl || undefined,
      },
      education: fullProfile.education.map((edu) => ({
        institution: edu.institution,
        degree: edu.degree,
        field: edu.field || undefined,
        startDate: edu.startDate.toISOString(),
        endDate: edu.endDate?.toISOString(),
        gpa: edu.gpa || undefined,
      })),
      experience: fullProfile.experiences.map((exp) => ({
        title: exp.title,
        company: exp.company,
        location: exp.location || undefined,
        startDate: exp.startDate.toISOString(),
        endDate: exp.endDate?.toISOString(),
        current: exp.current,
        description: exp.description || undefined,
      })),
      skills: fullProfile.skills ? fullProfile.skills.split(',').map(s => s.trim()) : [],
    };

    // Generate LaTeX
    const latexContent = generateLatexResume(resumeData);

    // Compile to PDF
    const result = await compileLatexToPdfViaApi(latexContent);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate PDF' },
        { status: 500 }
      );
    }

    // Store resume data and URL
    await prisma.resumeData.upsert({
      where: { studentProfileId: profile.id },
      create: {
        studentProfileId: profile.id,
        templateData: JSON.stringify(resumeData),
        pdfUrl: result.pdfUrl,
      },
      update: {
        templateData: JSON.stringify(resumeData),
        pdfUrl: result.pdfUrl,
      },
    });

    // Update profile with resume URL
    await prisma.studentProfile.update({
      where: { id: profile.id },
      data: {
        resumeUrl: result.pdfUrl,
        resumeUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      pdfUrl: result.pdfUrl,
      latexContent,
    });
  } catch (error) {
    console.error('Error generating resume:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    );
  }
}

// GET - Get current resume data
export async function GET(request: NextRequest) {
  try {
    const { user, profile } = await requireStudent();

    const resumeData = await prisma.resumeData.findUnique({
      where: { studentProfileId: profile.id },
    });

    if (!resumeData) {
      return NextResponse.json(
        { error: 'No resume data found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      templateData: JSON.parse(resumeData.templateData),
      pdfUrl: resumeData.pdfUrl,
      updatedAt: resumeData.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching resume data:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(
      { error: 'Failed to fetch resume data' },
      { status: 500 }
    );
  }
}
