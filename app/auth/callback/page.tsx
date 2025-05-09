'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthCallbackRouter() {
  const router  = useRouter();
  const params  = useSearchParams();
  const type    = params.get('type');          // signup | magiclink | recovery | invite

  useEffect(() => {
    if (!type) return;

    switch (type) {
      case 'recovery':                         // password-reset flow
        // Use window.location for direct navigation to avoid Next.js routing type issues
        window.location.href = `/reset-password${location.search}`;
        break;
      default:                                // signup, magiclink, invite
        // Use window.location for direct navigation to avoid Next.js routing type issues
        window.location.href = `/auth/confirm${location.search}`;
    }
  }, [type, router]);

  return null;                                // (optional) spinner or skeleton
}
