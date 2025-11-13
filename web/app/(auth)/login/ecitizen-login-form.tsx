'use client';

import {
  type ECitizenLogin,
  ecitizenLoginSchema,
} from '@/app/(auth)/login/login-schema';
import { Alert } from '@workspace/ui/components/alert';
import { type FormAction, useForm } from '@workspace/ui/hooks/use-form';
import { useTranslations } from 'next-intl';
import { type FC, useState } from 'react';

export interface ECitizenLoginFormProps {
  action: FormAction<ECitizenLogin>;
}

export const ECitizenLoginForm: FC<ECitizenLoginFormProps> = ({ action }) => {
  const t = useTranslations('LoginPage');
  const [state, formAction, isPending] = useForm(action, ecitizenLoginSchema);
  const [error, setError] = useState('');

  const generateRandomString = (length: number): string => {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    array.forEach((c) => (result += charset[c % charset.length]));
    return result;
  };

  const base64urlencode = (str: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(str)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const pkceChallengeFromVerifier = async (
    verifier: string,
  ): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return base64urlencode(digest);
  };

  const handleECitizenLogin = async () => {
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);
    const state = generateRandomString(32);
    setError('');

    try {
      // Store code verifier on your server
      await fetch('https://majuu.uwezo.go.ke/index.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code_verifier: codeVerifier, state }),
      });

      // Store code verifier locally for the callback
      localStorage.setItem(`pkce_${state}`, codeVerifier);

      // Redirect to eCitizen OAuth
      const authUrl = `https://accounts.ecitizen.go.ke/oauth/authorize?response_type=code&client_id=b30d441b886d8a1cd539e007bc5a3f40&redirect_uri=https%3A%2F%2Fmajuu.uwezo.go.ke&scope=openid%20profile%20email&code_challenge=${encodeURIComponent(codeChallenge)}&code_challenge_method=S256&state=${encodeURIComponent(state)}`;
      window.location.href = authUrl;
    } catch (err) {
      console.error('Failed to store code_verifier:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}

      {state.message && (
        <Alert variant={state.success ? 'success' : 'error'} className="mb-4">
          {state.message}
        </Alert>
      )}

      <button
        type="button"
        onClick={handleECitizenLogin}
        disabled={isPending}
        className="phx-submit-loading:opacity-75 text-sm font-semibold leading-6 flex w-full justify-center rounded-full border border-transparent py-2 px-4 font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15b14d] focus:ring-offset-2 disabled:opacity-75 transition-colors duration-200 bg-[#15b14d] hover:bg-[#0e7e36]"
        title="Sign in with eCitizen"
      >
        {isPending ? 'Signing in...' : 'Sign in With eCitizen'}
      </button>

      <p className="text-center text-sm text-gray-600">
        Secure government authentication
      </p>

      <input type="hidden" name="loginType" value="ecitizen" />
    </div>
  );
};
