// app/(auth)/ecitizen/callback/page.tsx
'use client';

import { createSession } from '@/lib/session';
import {
  IconAlertCircle,
  IconArrowRight,
  IconCircleCheckFilled,
  IconLoader2,
} from '@tabler/icons-react';
import { Alert } from '@workspace/ui/components/alert';
import { Button } from '@workspace/ui/components/button';
import { Container } from '@workspace/ui/components/container';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

// app/(auth)/ecitizen/callback/page.tsx

export default function ECitizenCallbackPage() {
  const router = useRouter(); 
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = {
          accessToken: searchParams.get('access_token'),
          refreshToken: searchParams.get('refresh_token'),
          error: searchParams.get('error'),
          errorDescription: searchParams.get('error_description'),
          callbackUrl: searchParams.get('callback_url') || '/dashboard',
        };

        if (params.error) {
          throw new Error(
            params.error === 'access_denied'
              ? 'Access denied. Please check your eCitizen credentials.'
              : params.errorDescription || 'Authentication failed',
          );
        }

        if (!params.accessToken || !params.refreshToken) {
          throw new Error('Missing session tokens. Please log in again.');
        }

        // Initialize session
        await createSession({
          accessToken: params.accessToken,
          refreshToken: params.refreshToken,
        });

        setStatus('success');
        setMessage('Securely signed in. Taking you to your dashboard...');

        setTimeout(() => router.push(params.callbackUrl), 1500);
      } catch (error: any) {
        setStatus('error');
        setMessage(
          error instanceof Error ? error.message : 'Authentication failed',
        );

        // Redirect to login page after delay
        setTimeout(() => {
          router.push('/login');
        }, 5000);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return (
    <Container className="flex min-h-[60vh] items-center justify-center max-w-md">
      <div className="w-full text-center space-y-8 animate-in fade-in zoom-in duration-300">
        {status === 'loading' && (
          <div className="space-y-4">
            <div className="relative flex justify-center">
              <IconLoader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Verifying Identity
              </h1>
              <p className="text-muted-foreground text-sm">
                Finalizing your secure connection with eCitizen...
              </p>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <IconCircleCheckFilled className="h-16 w-16 text-green-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Welcome Back!
              </h1>
              <p className="text-muted-foreground">{message}</p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6">
            <Alert variant="error" className="text-left">
              <IconAlertCircle className="h-5 w-5" />
              <div className="font-semibold">Authentication Error</div>
              <div>{message}</div>
            </Alert>

            <div className="flex flex-col gap-3">
              <Button onClick={() => router.push('/login')} className="w-full">
                Try Logging In Again
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="w-full text-xs"
              >
                Back to Home
              </Button>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
