// lib/api/services/ecitizen.ts
import {
  ECitizenTokenResponseSchema,
  StorePkceRequestSchema,
  StorePkceResponseSchema,
} from '@/app/(auth)/login/ecitizen-login-schema';
import { api, validate } from '@/lib/api/utils';

export class ECitizenService {
  private static baseUrl =
    process.env.NEXT_PUBLIC_ADMIN_DOMAIN || 'http://uwezo.ddev.site';

  /**
   * Store PKCE verifier on the server
   */
  static async storePkceVerifier(data: {
    state: string;
    code_verifier: string;
    callback_url: string;
  }) {
    const res = await api.POST('/api/oauth/ecitizen', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        callback_url: data.callback_url,
        code_verifier: data.code_verifier,
        state: data.state,
      }),
    });

    if (!res.response.ok) {
      const status = res.response.status;
      const errorMessages: Record<number, string> = {
        400: 'Invalid PKCE data. Please try again.',
        401: 'Un-authorised request',
        403: 'Security check failed (CSRF). Please clear your cache.',
        413: 'Request too large. Please refresh the page.',
        500: 'Backend server error. Please check Drupal watchdog logs.',
      };

      throw new Error(
        errorMessages[status] || `Auth Error: ${res.response.statusText}`,
      );
    }

    return validate(res, StorePkceResponseSchema);
  }

  /**
   * Handle eCitizen callback (GET request with code and state)
   * This is usually handled by redirect, but you can use this for testing
   */
  static async handleCallback(params: {
    code: string;
    state: string;
    redirect_uri?: string;
  }) {
    // This would normally be a redirect, but for API testing:
    const res = await api.POST('/api/oauth/ecitizen', {
      baseUrl: this.baseUrl,
      body: {
        ...params,
        // Drupal endpoint expects POST with code and code_verifier
        // But code_verifier should be retrieved from session storage
      },
    });

    return validate(res, ECitizenTokenResponseSchema);
  }

  /**
   * Generate eCitizen authorization URL
   */
  static generateAuthUrl(params: {
    state: string;
    code_challenge: string;
    callbackUrl?: string;
  }): string {
    const clientId =
      process.env.NEXT_PUBLIC_ECITIZEN_CLIENT_ID ||
      'b30d441b886d8a1cd539e007bc5a3f40';
    const redirectUri = encodeURIComponent(
      `${this.baseUrl}/api/oauth/ecitizen`,
    );

    const authParams = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: params.state,
      code_challenge: params.code_challenge,
      code_challenge_method: 'S256',
      ...(params.callbackUrl && { callbackUrl: params.callbackUrl }),
    });

    return `https://accounts.ecitizen.go.ke/oauth/authorize?${authParams.toString()}`;
  }
}
