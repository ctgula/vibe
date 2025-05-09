// app/auth/signup/page.tsx
// This is a client component
'use client';

import { SignUpForm } from '@/components/auth/SimpleSignUpForm';

// Server component that renders the client component
export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-900 to-black">
      <SignUpForm />
    </div>
  );
}
