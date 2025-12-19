// web/app/auth/ecitizen/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert } from '@workspace/ui/components/alert';
import { Container } from '@workspace/ui/components/container';

export default function ECitizenCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [allParams, setAllParams] = useState<Record<string, string>>({});

  useEffect(() => {
    console.log('Callback page mounted');
    
    // Log all parameters
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    setAllParams(params);
    console.log('URL Parameters:', params);

    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        console.log('Processing callback with:', { code, state, error, errorDescription });

        // If there's an error from eCitizen
        if (error) {
          throw new Error(`eCitizen error: ${error} - ${errorDescription || 'Unknown error'}`);
        }

        // If missing code or state
        if (!code || !state) {
          console.error('Missing parameters:', { hasCode: !!code, hasState: !!state });
          throw new Error('Missing authorization code or state. eCitizen did not return expected parameters.');
        }

        // Retrieve PKCE data
        const pkceStr = sessionStorage.getItem('ecitizen_pkce');
        console.log('PKCE data from sessionStorage:', pkceStr);
        
        if (!pkceStr) {
          throw new Error('Authentication session expired. Please try again.');
        }

        const pkceData = JSON.parse(pkceStr);
        
        // Verify state
        if (state !== pkceData.state) {
          console.error('State mismatch:', { expected: pkceData.state, received: state });
          throw new Error('Invalid state parameter. Possible CSRF attack.');
        }

        // Clear the stored data
        sessionStorage.removeItem('ecitizen_pkce');

        console.log('Exchanging code for token via Drupal...');

        // Call Drupal OAuth endpoint
        const drupalUrl = process.env.NEXT_PUBLIC_DRUPAL_URL || 'http://uwezo.ddev.site';
        const response = await fetch(`${drupalUrl}/api/v1/user/ecitizen-oauth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            code_verifier: pkceData.verifier,
            redirect_uri: process.env.NEXT_PUBLIC_ECITIZEN_REDIRECT_URI,
          }),
        });

        console.log('Drupal response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Drupal API error:', errorText);
          
          let errorMessage = 'Authentication failed';
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log('Authentication successful:', data);
        
        // Store tokens
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        
        // Store user info
        if (data.data.user) {
          localStorage.setItem('user', JSON.stringify(data.data.user));
        }

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Redirect
        setTimeout(() => {
          router.push(pkceData.callbackUrl || '/dashboard');
        }, 1000);

      } catch (error) {
        console.error('Callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
        
        // Redirect to login page after delay
        setTimeout(() => {
          router.push('/login');
        }, 5000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <Container className="max-w-4xl py-16">
      <div className="space-y-6">
        {status === 'loading' && (
          <>
            <div className="flex justify-center">
              <svg className="animate-spin h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-center">Processing eCitizen Authentication</h1>
            
            <div className="bg-gray-50 p-4 rounded">
              <h2 className="font-medium mb-2">URL Parameters Received:</h2>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(allParams, null, 2)}
              </pre>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center text-green-500">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-center">Authentication Successful!</h1>
            <p className="text-gray-600 text-center">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <Alert variant="error">
              <h2 className="font-semibold mb-2">Authentication Failed</h2>
              <p className="mb-4">{message}</p>
              
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <h3 className="font-medium mb-2">Debug Information:</h3>
                <pre className="text-sm overflow-auto">
                  URL Parameters: {JSON.stringify(allParams, null, 2)}
                </pre>
              </div>
              
              <p className="mt-4 text-sm">Redirecting to login page in 5 seconds...</p>
            </Alert>
          </>
        )}
      </div>
    </Container>
  );
}