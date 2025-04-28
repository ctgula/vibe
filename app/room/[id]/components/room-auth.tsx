'use client';

import { RequireAuth } from '@/components/auth/RequireAuth';

export default function RoomAuth({ children }: { children: React.ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
