import { Viewport } from 'next';
import { ReactNode } from 'react';

// Define metadata with the correct viewport config
export const metadata = {
  title: "Check Your Email - Vibe",
  description: "Please check your email for a confirmation link",
};

// Move themeColor to viewport export (correct location)
export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function CheckEmailLayout({ children }: { children: ReactNode }) {
  return children;
}
