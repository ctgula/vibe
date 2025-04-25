import { Viewport } from 'next';
import { ReactNode } from 'react';

// Define metadata with the correct viewport config
export const metadata = {
  title: "Admin Dashboard - Vibe",
  description: "Manage your Vibe application settings",
};

// Move themeColor to viewport export (correct location)
export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return children;
}
