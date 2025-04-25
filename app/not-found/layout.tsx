import { Viewport } from 'next';
import { ReactNode } from 'react';

// Define metadata with the correct viewport config
export const metadata = {
  title: "Page Not Found - Vibe",
  description: "The page you're looking for doesn't exist",
};

// Move themeColor to viewport export (correct location)
export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function NotFoundLayout({ children }: { children: ReactNode }) {
  return children;
}
