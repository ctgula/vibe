'use client';

import { SimpleAuthProvider } from "@/contexts/SimpleAuthProvider";
import { Toaster } from "@/components/ui/toaster";

export function SimpleProviders({ children }: { children: React.ReactNode }) {
  return (
    <SimpleAuthProvider>
      {children}
      <Toaster />
    </SimpleAuthProvider>
  );
}
