import { handlePesaflowIpn } from '@/lib/payments/pesaflow-ipn';
import { NextRequest, NextResponse } from 'next/server';

async function parseBody(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return (await request.json().catch(() => ({}))) as Record<string, unknown>;
  }

  if (
    contentType.includes('application/x-www-form-urlencoded') ||
    contentType.includes('multipart/form-data')
  ) {
    const form = await request.formData();
    const body: Record<string, unknown> = {};
    form.forEach((value, key) => {
      body[key] = typeof value === 'string' ? value : value.name;
    });
    return body;
  }

  return {};
}

export async function POST(request: NextRequest) {
  const callbackSecret = process.env.PESAFLOW_CALLBACK_SECRET?.trim();
  if (callbackSecret) {
    const authHeader = request.headers.get('authorization');
    const apiKeyHeader = request.headers.get('x-api-key');
    const authorized =
      authHeader === `Bearer ${callbackSecret}` ||
      apiKeyHeader === callbackSecret;

    if (!authorized) {
      return NextResponse.json(
        { query_status: 'unauthorized', success: false },
        { status: 401 },
      );
    }
  }

  const body = await parseBody(request);

  console.log('[Pesaflow IPN] Received notification:', JSON.stringify(body));

  const result = await handlePesaflowIpn(body);

  if (!result.success) {
    console.warn('[Pesaflow IPN] Processing failed:', result.error);
    return NextResponse.json(
      {
        success: false,
        message: result.error ?? 'Failed to process payment notification',
      },
      { status: result.error?.includes('Unknown bill') ? 404 : 500 },
    );
  }

  return NextResponse.json({
    success: true,
    message: result.alreadyProcessed
      ? 'Payment already processed'
      : 'Payment processed successfully',
    application_id: result.applicationId,
    bill_ref: result.billRefNumber,
  });
}

/** Health check / manual GET should not mark payments complete without verification. */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Pesaflow IPN endpoint is active. Use POST for payment notifications.',
  });
}
