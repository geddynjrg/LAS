import { sendApplicationEmail } from '@/lib/api/application/email';
import { getProfile } from '@/lib/api/profile';
import { getCurrentUser } from '@/lib/data/application';
import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ applicationId: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { applicationId } = await params;

    const application = await prisma.application.findUnique({
      where: { applicationId },
      select: { userId: true },
    });

    if (!application || application.userId !== user.id) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
    };

    const profile = await getProfile();
    const recipient = body.email?.trim() || profile.data?.email;

    if (!recipient) {
      return NextResponse.json(
        {
          success: false,
          error: 'No email address available for this account',
        },
        { status: 400 },
      );
    }

    await sendApplicationEmail(applicationId, { email: recipient });

    return NextResponse.json({
      success: true,
      message: `Application sent to ${recipient}`,
    });
  } catch (error) {
    console.error('[EMAIL] Send failed:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to send application email',
      },
      { status: 502 },
    );
  }
}
