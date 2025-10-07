import { getProfile } from '@/lib/api/profile';
import { getCurrentUser } from '@/lib/data/application';
import { prisma } from '@/lib/db/prisma';
import { getSession } from '@/lib/session';
import { promises as fs } from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
const DRUPAL_API_URL = process.env.API_URL || 'http://uwezo.ddev.site';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string; filename: string }> },
) {
  try {
    const { applicationId, filename } = await params;

    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user profile to check roles
    const userProfile = await getProfile();
    if (!userProfile?.data) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin/reviewer
    const isAdmin = userProfile.data.roles?.some(
      (role: string) =>
        role.toLowerCase() === 'admin' ||
        role.toLowerCase() === 'administrator' ||
        role.toLowerCase() === 'reviewer',
    );

    // If not admin, check if user owns the application
    if (!isAdmin && applicationId !== 'misc') {
      const application = await prisma.application.findUnique({
        where: { applicationId: applicationId },
        select: { userId: true },
      });

      if (!application) {
        return NextResponse.json(
          { error: 'Application not found' },
          { status: 404 },
        );
      }

      // Check if user owns this application by comparing user IDs
      const currentUser = await getCurrentUser();

      if (application.userId !== currentUser.id) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }

    // Try to read file from local Next.js storage first
    const filePath = path.join(UPLOAD_DIR, applicationId, filename);

    try {
      await fs.access(filePath);
      // File exists in local storage - serve it
      const fileBuffer = await fs.readFile(filePath);

      const ext = path.extname(filename).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.bmp': 'image/bmp',
        '.svg': 'image/svg+xml',
      };

      const contentType = contentTypeMap[ext] || 'application/octet-stream';

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `inline; filename="${filename}"`,
          'Cache-Control': 'private, max-age=3600',
        },
      });
    } catch {
      // File not in local storage - try to fetch from Drupal
      const drupalUrl = `${DRUPAL_API_URL}/api/v1/files/${applicationId}/${filename}`;

      // Get JWT token from session for Drupal authentication
      const jwtToken = session;
      if (!jwtToken) {
        return NextResponse.json(
          { error: 'Authentication token not found' },
          { status: 401 },
        );
      }

      try {
        const drupalResponse = await fetch(drupalUrl, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });

        if (!drupalResponse.ok) {
          if (drupalResponse.status === 404 || drupalResponse.status === 403) {
            return NextResponse.json(
              { error: 'File not found' },
              { status: 404 },
            );
          }
          throw new Error(`Drupal API error: ${drupalResponse.status}`);
        }

        // Proxy the file response from Drupal
        const buffer = await drupalResponse.arrayBuffer();
        const contentType =
          drupalResponse.headers.get('Content-Type') ||
          'application/octet-stream';

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `inline; filename="${filename}"`,
            'Cache-Control': 'private, max-age=3600',
          },
        });
      } catch (drupalError) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
