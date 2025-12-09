// app/(auth)/login/ecitizen-login-form.tsx
'use client';

import { Alert } from '@workspace/ui/components/alert';
import { SubmitButton } from '@workspace/ui/components/form';
import { useTranslations } from 'next-intl';
import { type FC, useEffect, useState } from 'react';

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

// app/(auth)/login/ecitizen-login-form.tsx

interface ECitizenLoginFormProps {
  redirectTo?: string;
}

export const ECitizenLoginForm: FC<ECitizenLoginFormProps> = ({
  redirectTo = '/dashboard',
}) => {
  const t = useTranslations('LoginPage');
  const [isProcessingCallback, setIsProcessingCallback] = useState(false);
  const [hasInitiatedOAuth, setHasInitiatedOAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // PKCE helpers
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

  // Handle eCitizen callback (when PHP redirects back)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // Success messages
    const successMsg = params.get('ecitizen_success');
    // Error messages
    const errorMsg = params.get('ecitizen_error');

    if (successMsg) {
      // Show toast or alert (you can replace with your toast system)
      alert(decodeURIComponent(successMsg));
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
      // Redirect to dashboard
      window.location.href = redirectTo;
      return;
    }

    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [redirectTo]);

  const handleECitizenLogin = async () => {
    setError(null);
    setHasInitiatedOAuth(true);

    try {
      const codeVerifier = generateRandomString(128);
      const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);
      const state = generateRandomString(32);

      // Store verifier in PHP session
      const storeRes = await fetch('http://localhost:8000', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code_verifier: codeVerifier, state }),
      });

      if (!storeRes.ok) {
        throw new Error('Failed to connect to authentication server');
      }

      // Also store locally as backup (not needed anymore, but safe)
      localStorage.setItem(`pkce_${state}`, codeVerifier);

      // Redirect to eCitizen
      const authUrl = new URL(
        'https://accounts.ecitizen.go.ke/oauth/authorize',
      );
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append(
        'client_id',
        'b30d441b886d8a1cd539e007bc5a3f40',
      );
      authUrl.searchParams.append('redirect_uri', 'http://localhost:8000');
      authUrl.searchParams.append('scope', 'openid profile email');
      authUrl.searchParams.append('code_challenge', codeChallenge);
      authUrl.searchParams.append('code_challenge_method', 'S256');
      authUrl.searchParams.append('state', state);

      window.location.href = authUrl.toString();
    } catch (err) {
      console.error('eCitizen login failed:', err);
      setError('Failed to start eCitizen login. Please try again.');
      setHasInitiatedOAuth(false);
    }
  };

  // Loading state during callback
  if (isProcessingCallback) {
    return (
      <div className="space-y-6 text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="text-lg">Completing eCitizen login...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && <Alert variant="error">{error}</Alert>}

      {/* Success messages come from URL, handled in useEffect */}

      {/* eCitizen Button */}
      <SubmitButton
        type="button"
        onClick={handleECitizenLogin}
        disabled={hasInitiatedOAuth}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-[#15b14d] hover:bg-[#0e8c3a] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#15b14d] disabled:opacity-70 disabled:cursor-not-allowed transition"
      >
        {hasInitiatedOAuth ? (
          <div className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Redirecting to eCitizen...</span>
          </div>
        ) : (
          'Sign in with eCitizen'
        )}
      </SubmitButton>

      <p className="text-center text-sm text-gray-600 mt-4">
        Secure login via Kenya Government Portal
      </p>
    </div>
  );
};
