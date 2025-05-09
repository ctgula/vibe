// app/auth/signin/page.tsx
'use client';

import { SignInForm } from '@/components/auth/SimpleSignInForm';

// Server component that renders the client component
export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-800 via-zinc-900 to-black">
      <SignInForm />
    </div>
  );
}
