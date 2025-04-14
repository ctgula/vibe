"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const access_token = searchParams.get('access_token');
    const type = searchParams.get('type');

    if (type === 'recovery' && access_token) {
      supabase.auth.setSession({ access_token, refresh_token: '' });
    }
  }, [searchParams]);

  const handleReset = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return alert(error.message);
    setSuccess(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A] text-white">
      <div className="w-full max-w-md px-6 py-10 bg-[#2B2B2B] rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6">🔐 Reset Your Password</h1>
        {success ? (
          <div>
            <p className="text-green-400 mb-4">✅ Password updated!</p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-purple-600 hover:bg-purple-700 transition px-4 py-2 rounded"
            >
              Back to Vibe
            </button>
          </div>
        ) : (
          <>
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full mb-4 p-3 rounded bg-[#1A1A1A] border border-gray-700 focus:outline-none"
            />
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700 transition px-4 py-2 rounded"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
