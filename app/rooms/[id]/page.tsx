'use client';

// This is a redirector file that ensures compatibility with both /room/[id] and /rooms/[id] routes
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RoomsRedirector({ params }: { params: { id: string } }) {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the canonical route
    router.replace(`/room/${params.id}`);
  }, [params.id, router]);
  
  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mx-auto mb-4"></div>
        <p className="text-white text-center">Redirecting to room...</p>
      </div>
    </div>
  );
}
