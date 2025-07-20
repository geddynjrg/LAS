// Configuration constants that work in both server and client contexts

export function getApiUrl() {
  // On the server, use NEXT_API_URL
  if (typeof window === 'undefined') {
    const serverUrl = process.env.NEXT_API_URL;
    if (!serverUrl) {
      console.error('[Config] NEXT_API_URL not found in server environment:', process.env);
      throw new Error('NEXT_API_URL environment variable is required');
    }
    return serverUrl.replace(/\/$/, ''); // Remove trailing slash
  }
  
  // On the client, try NEXT_PUBLIC_API_URL first, then fallback to relative
  const clientUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!clientUrl) {
    console.error('[Config] NEXT_PUBLIC_API_URL not found in client environment');
    return window.location.origin;
  }
  return clientUrl.replace(/\/$/, ''); // Remove trailing slash
}

export function getApiEndpoints() {
  const apiUrl = getApiUrl();
  return {
    OTP_REQUEST: `${apiUrl}/api/auth/otp/request`,
    OTP_VERIFY: `${apiUrl}/api/auth/otp/verify`,
  } as const;
}