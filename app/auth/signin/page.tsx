// app/auth/signin/page.tsx
'use client';

import { SignInForm } from '@/components/auth/SimpleSignInForm';

// Server component that renders the client component
export default function SignInPage() {
  return (
    <div className="min-h-screen bg-zinc-900">
      <SignInForm />
    </div>
  );
}
