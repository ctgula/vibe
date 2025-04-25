"use client";

import { Suspense } from 'react';
import ResetPasswordForm from '@/components/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A] text-white">
        <div className="w-full max-w-md px-6 py-10 bg-[#2B2B2B] rounded-2xl shadow-lg text-center">
          <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading reset password form...</p>
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
