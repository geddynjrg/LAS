// app/(auth)/ecitizen/callback/page.tsx
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

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const email = searchParams.get('email');
        const uid = searchParams.get('uid');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        console.log('Processing callback with:', {
          code,
          error,
          errorDescription,
          state,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          email,
          uid,
        });

        // Check for errors first
        if (error) {
          let errorMsg = `eCitizen authentication failed: ${errorDescription || error}`;
          
          // Specific error messages
          if (error === 'access_denied') {
            errorMsg = 'Access denied by eCitizen. The credentials provided were invalid.';
          } else if (error === 'invalid_request') {
            errorMsg = 'Invalid request to eCitizen. Please try again.';
          }
          
          throw new Error(errorMsg);
        }

        const storedState = sessionStorage.getItem('ecitizen_state');
        if (state && storedState !== state) {
          throw new Error('Security error: State mismatch. Possible CSRF attack.');
        }

        if (!accessToken || !refreshToken) {
          throw new Error('Authentication incomplete. Please try again.');
        }

        // Get callback URL from sessionStorage
        const callbackUrl = sessionStorage.getItem('ecitizen_callback') || '/dashboard';

        // Store tokens
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        
        if (email) {
          localStorage.setItem('user_email', email);
        }
        
        if (uid) {
          localStorage.setItem('user_id', uid);
        }

        // Clear session storage
        sessionStorage.removeItem('ecitizen_state');
        sessionStorage.removeItem('ecitizen_callback');

        setStatus('success');
        setMessage('Authentication successful! Redirecting...');

        // Redirect to original callback URL or dashboard
        setTimeout(() => {
          router.push(callbackUrl);
        }, 1500);

      } catch (error) {
        console.error('eCitizen callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
        
        // Clear session storage on error
        sessionStorage.removeItem('ecitizen_state');
        sessionStorage.removeItem('ecitizen_callback');
        
        // Redirect to login page after delay
        setTimeout(() => {
          router.push('/login');
        }, 5000);
      }
    };

    const handleMockAuthentication = async () => {
      try {
        // Call your Drupal API to create/get a test user
        const drupalUrl = process.env.NEXT_PUBLIC_DRUPAL_URL || 'http://uwezo.ddev.site';
        const response = await fetch(`${drupalUrl}/api/v1/user/ecitizen-login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: 'test.user@ecitizen.go.ke',
            ecitizen_data: {
              id: 'mock_ecitizen_id',
              name: 'Test User',
              email: 'test.user@ecitizen.go.ke',
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          
          // Store tokens
          localStorage.setItem('access_token', data.data.access_token);
          localStorage.setItem('refresh_token', data.data.refresh_token);
          
          if (data.data.user) {
            localStorage.setItem('user_email', data.data.user.email);
            localStorage.setItem('user_id', data.data.user.uid);
          }

          setStatus('success');
          setMessage('Mock authentication successful! Redirecting...');

          const callbackUrl = sessionStorage.getItem('ecitizen_callback') || '/dashboard';
          setTimeout(() => {
            router.push(callbackUrl);
          }, 1000);
        } else {
          throw new Error('Mock authentication failed');
        }
      } catch (error) {
        throw new Error('Failed to create test user: ' + (error instanceof Error ? error.message : String(error)));
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <Container className="max-w-md py-16">
      <div className="text-center space-y-6">
        {status === 'loading' && (
          <>
            <div className="flex justify-center">
              <div className="animate-spin h-12 w-12 border-4 border-[#15b14d] border-t-transparent rounded-full"></div>
            </div>
            <h1 className="text-xl font-semibold">Completing eCitizen Authentication</h1>
            <p className="text-gray-600">Please wait while we verify your identity...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center text-[#15b14d]">
              <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold">Success!</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <Alert variant="error">
              <h2 className="font-semibold mb-2">Authentication Failed</h2>
              <p className="mb-2">{message}</p>
              <p className="mt-4 text-sm">Redirecting to login page...</p>
            </Alert>
          </>
        )}
      </div>
    </Container>
  );
}