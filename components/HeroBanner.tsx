'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

export function HeroBanner() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-black text-white flex items-center justify-center px-4">
      {/* Background video with gradient overlay */}
      <div className="absolute inset-0 -z-10">
        <video
          className="object-cover w-full h-full"
          src="/videos/hero.mp4"
          poster="/screenshots/home-screen.png"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="max-w-3xl text-center space-y-6"
      >
        <h1 className="text-[7vw] sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">
          Welcome to Vibe
        </h1>
        <p className="text-[2.5vw] sm:text-xl text-zinc-300">
          Next generation audio collaboration
        </p>
        <Link href="/onboarding" prefetch>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-6 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-full text-lg font-semibold transition"
            style={{ willChange: 'transform' }}
          >
            Get Started
          </motion.button>
        </Link>
      </motion.div>
    </section>
  )
}
