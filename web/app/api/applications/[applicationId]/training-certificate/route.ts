import { getCurrentUser } from '@/lib/data/application';
import { fetchTrainingCertificate } from '@/lib/lms/training-certificate';
import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ applicationId: string }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { applicationId } = await params;

    const application = await prisma.application.findUnique({
      where: { applicationId },
      select: { userId: true },
    });

    if (!application || application.userId !== user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const lmsResponse = await fetchTrainingCertificate(applicationId);
    if (!lmsResponse) {
      return NextResponse.json(
        { error: 'Training certificate service unavailable' },
        { status: 503 },
      );
    }

    if (!lmsResponse.ok) {
      return NextResponse.json(
        { error: 'Training certificate not found' },
        { status: lmsResponse.status === 404 ? 404 : 502 },
      );
    }

    const pdfBuffer = await lmsResponse.arrayBuffer();
    const filename =
      lmsResponse.headers
        .get('content-disposition')
        ?.match(/filename="?([^"]+)"?/)?.[1] ??
      `training-certificate-${applicationId}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('Training certificate download failed', error);
    return NextResponse.json(
      { error: 'Failed to download training certificate' },
      { status: 500 },
    );
  }
}
