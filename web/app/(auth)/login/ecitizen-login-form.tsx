// app/(auth)/login/ecitizen-login-form.tsx
'use client';

import { Alert } from '@workspace/ui/components/alert';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export const ECitizenLoginForm = () => {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const base64UrlEncode = (str: string): string => {
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };


  const generateRandomString = (length: number): string => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    array.forEach((c) => (result += charset[c % charset.length]));
    return result;
  };

  const sha256 = async (plain: string): Promise<ArrayBuffer> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(plain);
    return await window.crypto.subtle.digest('SHA-256', data);
  };

  const handleECitizenLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Generate PKCE code_verifier and code_challenge
      const codeVerifier = generateRandomString(64);
      const state = generateRandomString(32);
      
      // Calculate code_challenge
      const hashed = await sha256(codeVerifier);
      const hashArray = Array.from(new Uint8Array(hashed));
      const hashString = String.fromCharCode.apply(null, hashArray);
      const codeChallenge = base64UrlEncode(hashString);


      // Get callback URL
      const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

      console.log('Generated PKCE:', {
        codeVerifier: codeVerifier.substring(0, 10) + '...',
        codeChallenge: codeChallenge.substring(0, 10) + '...',
        state,
        callbackUrl
      });

      // Store PKCE verifier and state in Drupal via API
      const drupalUrl = process.env.NEXT_PUBLIC_DRUPAL_URL || 'http://uwezo.ddev.site';
      
      // First, check if we can make a CORS request
      // console.log('Testing CORS connection to Drupal...');
      
      // const storeResponse = await fetch(`${drupalUrl}/api/v1/ecitizen/store-pkce`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Accept': 'application/json',
      //   },
      //   body: JSON.stringify({
      //     code_verifier: codeVerifier,
      //     state: state,
      //     callback_url: callbackUrl,
      //   }),
      //   credentials: 'include', // Important for cookies/session
      // });

      // if (!storeResponse.ok) {
      //   const errorText = await storeResponse.text();
      //   console.error('Store PKCE failed:', {
      //     status: storeResponse.status,
      //     statusText: storeResponse.statusText,
      //     error: errorText
      //   });
        
      //   if (storeResponse.status === 0) {
      //     throw new Error('Network error: Cannot connect to Drupal. Check CORS configuration.');
      //   }
        
      //   try {
      //     const errorData = JSON.parse(errorText);
      //     throw new Error(errorData.error || 'Failed to initialize authentication session');
      //   } catch {
      //     throw new Error(`Server error: ${storeResponse.status} ${storeResponse.statusText}`);
      //   }
      // }

      // const result = await storeResponse.json();
      // console.log('PKCE stored successfully:', result);

      // Store state in sessionStorage for verification
      sessionStorage.setItem('ecitizen_state', state);
      sessionStorage.setItem('ecitizen_callback', callbackUrl);

      // Build authorization URL with PKCE parameters
      const authUrl = `${drupalUrl}/api/oauth/ecitizen?` + new URLSearchParams({
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        callback: callbackUrl,
      });

      console.log('Redirecting to Drupal OAuth handler:', {
        url: authUrl,
        state: state,
        hasCodeChallenge: !!codeChallenge,
      });

      // Redirect to Drupal OAuth handler
      window.location.href = authUrl;

    } 
    catch (err) {
      console.error('eCitizen login error:', err);
      
      // User-friendly error messages
      let errorMessage = err instanceof Error ? err.message : 'Failed to start authentication. Please try again.';
      
      if (errorMessage.includes('CORS') || errorMessage.includes('Network error')) {
        errorMessage = 'Cannot connect to authentication server. Please ensure the server is running and CORS is configured.';
      } else if (errorMessage.includes('CSRF')) {
        errorMessage = 'Security token missing. Please refresh the page and try again.';
      }
      
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="error" className="mb-4">
          <p className="font-medium">Authentication Error</p>
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          Secure government authentication via eCitizen
        </p>
        
        <button
          type="button"
          onClick={handleECitizenLogin}
          disabled={isLoading}
          className="inline-flex items-center justify-center w-full px-6 py-3 text-sm font-semibold text-white bg-[#15b14d] rounded-full hover:bg-[#0e7e36] focus:outline-none focus:ring-2 focus:ring-[#15b14d] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Connecting to eCitizen...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Sign in with eCitizen
            </>
          )}
        </button>
        
        <div className="mt-3 text-xs text-gray-500 space-y-1">
          <p>You will be redirected to the official eCitizen portal</p>
          <p className="text-[10px]">Using Drupal OAuth endpoint</p>
          <p className="text-[10px]">Drupal URL: {process.env.NEXT_PUBLIC_DRUPAL_URL || 'Not configured'}</p>
        </div>
      </div>
    </div>
  );
};