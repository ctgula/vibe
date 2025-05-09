'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: These hardcoded values are ONLY for testing and should be removed
// after debugging the connection issue
const HARDCODED_URL = 'https://ansqfdzcxwhqoloovotu.supabase.co';
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFuc3FmZHpjeHdocW9sb292b3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODk4NzUwODQsImV4cCI6MjAwNTQ1MTA4NH0.q_WscUO9kEQAfrr7YQgLjl-FSqEfRQjY2eCq1HfSPxM';

export default function AuthTestPage() {
  const [email, setEmail] = useState('test@example.com');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const testAuth = async () => {
    setIsLoading(true);
    setError('');
    setStatus('');
    
    try {
      // Create a direct client with hardcoded values
      const supabase = createClient(HARDCODED_URL, HARDCODED_KEY);
      
      setStatus('Created Supabase client with URL: ' + HARDCODED_URL);
      
      // Try to perform a simple auth operation
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create a new user
        }
      });
      
      if (error) {
        setError(JSON.stringify(error, null, 2));
        setStatus('Auth operation failed');
      } else {
        setStatus('Auth operation succeeded! Check logs for details.');
        console.log('Auth data:', data);
      }
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
      setStatus('Exception thrown during auth test');
    } finally {
      setIsLoading(false);
    }
  };
  
  const testEnvVars = () => {
    setIsLoading(true);
    setError('');
    setStatus('');
    
    try {
      // Test how environment variables are loaded in the browser
      const nextPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not found';
      const nextPublicKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
        'Found (starts with: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...)' : 
        'Not found';
      
      setStatus(`Environment variables in browser:
NEXT_PUBLIC_SUPABASE_URL: ${nextPublicUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY: ${nextPublicKey}`);
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Auth Direct Test</h1>
      <p className="mb-4 text-yellow-500">
        WARNING: This page uses hardcoded credentials for testing purposes only.
        Remove this page after debugging.
      </p>
      
      <div className="mb-4">
        <label className="block mb-2">Test Email</label>
        <input 
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded bg-zinc-800 text-white"
        />
      </div>
      
      <div className="flex space-x-4 mb-6">
        <button
          onClick={testAuth}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-600 text-white rounded"
        >
          {isLoading ? 'Testing...' : 'Test Direct Auth'}
        </button>
        
        <button
          onClick={testEnvVars}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Test Environment Variables
        </button>
      </div>
      
      {status && (
        <div className="p-4 bg-zinc-800 rounded mb-4">
          <h2 className="font-bold mb-2">Status:</h2>
          <pre className="whitespace-pre-wrap">{status}</pre>
        </div>
      )}
      
      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded">
          <h2 className="font-bold mb-2">Error:</h2>
          <pre className="whitespace-pre-wrap text-red-300">{error}</pre>
        </div>
      )}
    </div>
  );
}
