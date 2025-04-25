// This is a server component - no "use client" directive
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Loading component for the Suspense fallback
const LoadingFallback = () => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto"></div>
      <p className="mt-4 text-zinc-400">Loading form...</p>
    </div>
  </div>
);

// Dynamically import the form component with no SSR
const UpdatePasswordForm = dynamic(() => import('@/components/auth/UpdatePasswordForm'), {
  ssr: false,
  loading: () => <LoadingFallback />
});

// Server component that renders the client component
export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <UpdatePasswordForm />
    </Suspense>
  );
}
