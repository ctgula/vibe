'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function DebugSupabasePage() {
  const [supabaseUrl, setSupabaseUrl] = useState<string>('');
  const [anonKeyPrefix, setAnonKeyPrefix] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Safe way to access NEXT_PUBLIC env vars in client components
    setSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL || 'Not found');
    
    // Only show prefix for security
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    setAnonKeyPrefix(anonKey.substring(0, 10) + '...');
  }, []);

  const testDirectClient = async () => {
    setIsLoading(true);
    try {
      // Using direct client with explicit values
      const directClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      
      const { data, error } = await directClient.auth.getSession();
      
      if (error) {
        setTestResult(`Direct client error: ${JSON.stringify(error)}`);
      } else {
        setTestResult(`Direct client success! Session: ${data.session ? 'Active' : 'None'}`);
      }
    } catch (err: any) {
      setTestResult(`Exception: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testHelperClient = async () => {
    setIsLoading(true);
    try {
      // Using the helper client
      const helperClient = createClientComponentClient();
      
      const { data, error } = await helperClient.auth.getSession();
      
      if (error) {
        setTestResult(`Helper client error: ${JSON.stringify(error)}`);
      } else {
        setTestResult(`Helper client success! Session: ${data.session ? 'Active' : 'None'}`);
      }
    } catch (err: any) {
      setTestResult(`Exception: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordTest = async () => {
    setIsLoading(true);
    const testEmail = 'test@example.com'; // Use a test email
    
    try {
      // Using direct client with explicit values
      const directClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );
      
      const { error } = await directClient.auth.resetPasswordForEmail(testEmail, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      
      if (error) {
        setTestResult(`Reset password error: ${JSON.stringify(error)}`);
      } else {
        setTestResult(`Reset password API call succeeded (no actual email sent to ${testEmail})`);
      }
    } catch (err: any) {
      setTestResult(`Exception: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Supabase Debug Page</h1>
      
      <div className="bg-gray-100 p-4 rounded mb-4">
        <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
        <p><strong>NEXT_PUBLIC_SUPABASE_URL:</strong> {supabaseUrl}</p>
        <p><strong>NEXT_PUBLIC_SUPABASE_ANON_KEY prefix:</strong> {anonKeyPrefix}</p>
      </div>
      
      <div className="space-y-4">
        <button 
          onClick={testDirectClient}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
        >
          Test Direct Client
        </button>
        
        <button 
          onClick={testHelperClient}
          disabled={isLoading}
          className="px-4 py-2 bg-green-500 text-white rounded mr-2"
        >
          Test Helper Client
        </button>
        
        <button 
          onClick={resetPasswordTest}
          disabled={isLoading}
          className="px-4 py-2 bg-purple-500 text-white rounded"
        >
          Test Reset Password API
        </button>
      </div>
      
      {isLoading && <p className="mt-4">Loading...</p>}
      
      {testResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded overflow-auto">
          <pre>{testResult}</pre>
        </div>
      )}
    </div>
  );
}
