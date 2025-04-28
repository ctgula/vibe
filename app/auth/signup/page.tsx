// app/auth/signup/page.tsx
// This is a client component
'use client';

import { SignUpForm } from '@/components/auth/SimpleSignUpForm';

// Server component that renders the client component
export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-zinc-900">
      <SignUpForm />
    </div>
  );
}
