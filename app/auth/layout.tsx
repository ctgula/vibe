'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black p-4">
      <div className="mb-8">
        <Link href="/" passHref>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center"
          >
            <div className="bg-gradient-to-r from-indigo-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center">
              <LogIn className="w-6 h-6 text-white" />
            </div>
            <h1 className="ml-3 text-3xl font-bold text-white">Vibe</h1>
          </motion.div>
        </Link>
      </div>
      
      {children}
      
      <div className="mt-8 text-zinc-500 text-sm text-center">
        <p>© {new Date().getFullYear()} Vibe. All rights reserved.</p>
      </div>
    </div>
  );
}
