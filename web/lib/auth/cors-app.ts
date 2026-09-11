import { NextResponse } from 'next/server';

const ALLOWED = new Set([
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8080',
]);

function isAppOrigin(origin: string) {
  return (
    ALLOWED.has(origin) ||
    origin.endsWith('.uwezo.go.ke') ||
    origin.includes('localhost') ||
    origin.startsWith('capacitor:') ||
    origin.startsWith('ionic:')
  );
}

export function corsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('origin') || '';
  const allow = !origin ? '*' : isAppOrigin(origin) ? origin : '';
  if (!allow) return {};
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Credentials': allow === '*' ? 'false' : 'true',
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
