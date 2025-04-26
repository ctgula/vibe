'use client';

// This file is imported in layout.tsx to properly handle favicon
export const Favicon = () => (
  <>
    <link rel="icon" href="/favicon.ico" sizes="any" />
    <link rel="icon" href="/icons/icon-32x32.png" type="image/png" sizes="32x32" />
    <link rel="icon" href="/icons/icon-16x16.png" type="image/png" sizes="16x16" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
  </>
);
