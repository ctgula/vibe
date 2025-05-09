'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">404 – Not Found</h1>
        <p className="text-gray-400">This page doesn't exist. Or maybe it vanished 🫠</p>
        <Link
          href="/"
          className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl transition-all"
        >
          Take me home
        </Link>
      </div>
    </div>
  );
}
