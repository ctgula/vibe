import { ReactNode } from 'react';

export function generateViewport() {
  return {
    themeColor: '#38bdf8',
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  }
}

export default function DirectoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
