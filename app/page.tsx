'use client';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to Vibe 🎧</h1>
        <p className="text-gray-400 mb-6">Connect through live audio rooms</p>
        <div className="flex justify-center gap-4">
          <a href="/directory" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors">
            Browse Rooms
          </a>
          <a href="/onboarding" className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium transition-colors">
            Get Started
          </a>
        </div>
      </div>
    </div>
  );
}
