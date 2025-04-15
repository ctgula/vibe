"use client";

import { Toaster as SonnerToaster } from "sonner";

// You can customize the toaster props here if needed
// See: https://sonner.emilkowal.ski/docs/toast
export function Toaster() {
  return <SonnerToaster richColors position="top-right" />;
}
