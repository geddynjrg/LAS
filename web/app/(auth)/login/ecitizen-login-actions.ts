'use server';

import { ECitizenService } from '@/lib/api/ecitizen';

export async function storePkce(
  state: string,
  codeVerifier: string,
  callbackUrl: string,
) {
  try {
    // Store PKCE verifier on the server
    const result = await ECitizenService.storePkceVerifier({
      state,
      code_verifier: codeVerifier,
      callback_url: callbackUrl,
    });

    return { success: true, message: result.message, state: result.state };
  } catch (error) {
    console.error('Failed to store pkce verifier', error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to store pkce verifier',
    };
  }
}
