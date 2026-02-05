import { getSession } from '@/lib/session';
import { getLocale } from 'next-intl/server';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import createClient, { type FetchResponse } from 'openapi-fetch';
import type { z } from 'zod';

export const api = createClient<any>({
  baseUrl: process.env.API_URL,
  fetch: (input: RequestInfo | URL, init?: RequestInit) => {
    // Bypass SSL certificate validation in development
    if (process.env.NODE_ENV === 'development') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
    return fetch(input, init);
  },
});

api.use({
  async onRequest({ request }) {
    const [headersList, session] = await Promise.all([headers(), getSession()]);

    if (!request.headers.has('Content-Type')) {
      request.headers.set('Content-Type', 'application/json');
    }

    if (!request.headers.has('X-Path')) {
      request.headers.set('X-Path', headersList.get('x-path') || '');
    }

    if (!request.headers.has('X-Language')) {
      request.headers.set('X-Language', (await getLocale()) || '');
    }

    // ADD API KEY HERE
    if (process.env.EXTERNAL_API_KEY) {
      request.headers.set('X-API-Key', process.env.EXTERNAL_API_KEY);
    }

    if (session?.trim()) {
      // ← safer check
      request.headers.set('authorization', `Bearer ${session.trim()}`);
    } else {
      // kill all sessions and send to login
      console.warn(
        '[API middleware] No valid session → sending request without auth',
      );
    }

    return request;
  },

  async onResponse({ response }) {
    // if the response is 401, we need to clear the session and redirect to login page
    console.log('[API] Response:', {
      status: response.status,
      statusText: response.statusText,
    });

    if (response.status === 401) {
      console.error('[API] 401 Unauthorized - check authentication headers');
    }

    return response;
  },
});

export function validate<
  TRes extends FetchResponse<any, any, any>,
  TSchema extends z.Schema,
>(res: TRes, schema: TSchema) {
  // return error if response is not ok
  if (res.error) {
    console.warn('[API] Error:', res.response.status, res.error);
    throw new Error(res.error?.message || '[API] Unknown Error');
  }

  const validation = schema.safeParse(res.data);

  // return response even if validation fails, but log out the errors
  if (!validation.success) {
    console.warn(
      `[API] Response Schema Error (${res.response.url}):`,
      validation.error.toString(),
      res.data,
    );
  }

  return res.data as z.infer<TSchema>;
}
