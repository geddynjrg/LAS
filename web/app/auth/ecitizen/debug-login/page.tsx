// web/app/auth/ecitizen/debug-login/page.tsx
'use client';

import { useState } from 'react';

export default function DebugLoginPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [authUrl, setAuthUrl] = useState('');

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const generateRandomString = (length: number): string => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    array.forEach((c) => (result += charset[c % charset.length]));
    return result;
  };

  const base64UrlEncode = (buffer: ArrayBuffer): string => {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const pkceChallengeFromVerifier = async (verifier: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(digest);
  };

  const testEcitizenLogin = async () => {
    addLog('Starting eCitizen OAuth test...');
    
    try {
      // Generate PKCE values
      const codeVerifier = generateRandomString(128);
      addLog(`Generated code_verifier (${codeVerifier.length} chars): ${codeVerifier.substring(0, 20)}...`);
      
      const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);
      addLog(`Generated code_challenge: ${codeChallenge}`);
      
      const state = generateRandomString(32);
      addLog(`Generated state: ${state}`);

      // Store for callback
      sessionStorage.setItem('ecitizen_pkce', JSON.stringify({
        verifier: codeVerifier,
        state,
        callbackUrl: '/dashboard',
      }));

      // Build eCitizen URL
      const clientId = process.env.NEXT_PUBLIC_ECITIZEN_CLIENT_ID || 'b30d441b886d8a1cd539e007bc5a3f40';
      const redirectUri = process.env.NEXT_PUBLIC_ECITIZEN_REDIRECT_URI || 'http://localhost:3000/auth/ecitizen/callback';
      
      addLog(`Client ID: ${clientId}`);
      addLog(`Redirect URI: ${redirectUri}`);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: state,
      });

      const url = `https://accounts.ecitizen.go.ke/oauth/authorize?${params}`;
      setAuthUrl(url);
      addLog(`Authorization URL: ${url.substring(0, 100)}...`);

      // Open in new tab for testing
      window.open(url, '_blank');
      addLog('Opened eCitizen in new tab');

    } catch (error) {
      addLog(`Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const testLocalCallback = () => {
    // Simulate a callback with dummy data
    const dummyCode = 'test_code_' + Math.random().toString(36).substring(7);
    const dummyState = 'test_state_' + Math.random().toString(36).substring(7);
    
    window.location.href = `/auth/ecitizen/callback?code=${dummyCode}&state=${dummyState}`;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">eCitizen OAuth Debug</h1>
      
      <div className="mb-8 space-y-4">
        <button
          onClick={testEcitizenLogin}
          className="bg-green-500 text-white px-6 py-3 rounded hover:bg-green-600 mr-4"
        >
          Test eCitizen Login
        </button>
        
        <button
          onClick={testLocalCallback}
          className="bg-blue-500 text-white px-6 py-3 rounded hover:bg-blue-600"
        >
          Test Callback (Dummy Data)
        </button>
      </div>

      {authUrl && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Authorization URL</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            <a href={authUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 break-all">
              {authUrl}
            </a>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
          {JSON.stringify({
            NEXT_PUBLIC_DRUPAL_URL: process.env.NEXT_PUBLIC_DRUPAL_URL,
            NEXT_PUBLIC_ECITIZEN_CLIENT_ID: process.env.NEXT_PUBLIC_ECITIZEN_CLIENT_ID,
            NEXT_PUBLIC_ECITIZEN_REDIRECT_URI: process.env.NEXT_PUBLIC_ECITIZEN_REDIRECT_URI,
          }, null, 2)}
        </pre>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Logs</h2>
        <div className="bg-black text-green-400 p-4 rounded h-96 overflow-auto font-mono text-sm">
          {logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}