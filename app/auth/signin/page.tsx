// app/auth/signin/page.tsx
// This is a server component (no "use client" directive)
import dynamic from 'next/dynamic';

// Dynamically import the form component with no SSR
const SignInForm = dynamic(() => import('@/components/auth/SignInForm'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto"></div>
        <p className="mt-4 text-zinc-400">Loading sign in form...</p>
      </div>
    </div>
  ),
});

// Server component that renders the client component
export default function SignInPage() {
  return <SignInForm />;
}
