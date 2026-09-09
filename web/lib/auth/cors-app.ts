import { NextResponse } from 'next/server';

const ALLOWED = new Set([
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') || '';
  const allow =
    ALLOWED.has(origin) ||
    origin.endsWith('.uwezo.go.ke') ||
    origin.includes('localhost')
      ? origin
      : '';
  if (!allow) return {};
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    Vary: 'Origin',
  };
}

export function withCors(request: Request, response: NextResponse) {
  const headers = corsHeaders(request);
  for (const [k, v] of Object.entries(headers)) {
    response.headers.set(k, v);
  }
  return response;
}

export function optionsCors(request: Request) {
  return withCors(request, new NextResponse(null, { status: 204 }));
}
