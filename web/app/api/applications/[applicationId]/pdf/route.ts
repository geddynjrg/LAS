import {
  downloadApplicationPdf,
  warmApplicationPdfCache,
} from '@/lib/api/application/pdf';
import { getCurrentUser } from '@/lib/data/application';
import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

interface RouteParams {
  params: Promise<{ applicationId: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { applicationId } = await params;
    const { searchParams } = new URL(request.url);

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

    if (searchParams.get('warmup') === '1') {
      await warmApplicationPdfCache(applicationId);
      return NextResponse.json({ ok: true });
    }

    const pdfBlob = await downloadApplicationPdf(applicationId);
    const pdfBuffer = await pdfBlob.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Application-${applicationId}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error('[PDF] Download failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to download application PDF',
      },
      { status: 502 },
    );
  }
}
