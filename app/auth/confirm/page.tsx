"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowLeft } from "lucide-react";

export default function ConfirmPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute top-6 left-6"
        >
          <Link 
            href="/" 
            className="flex items-center text-white/80 hover:text-white transition-colors"
            onClick={() => {
              // Add haptic feedback
              if (window.navigator && window.navigator.vibrate) {
                window.navigator.vibrate(3);
              }
            }}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span>Back to home</span>
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 200, 
            damping: 15,
            delay: 0.1 
          }}
          className="mb-8 bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-full"
        >
          <Check className="h-12 w-12 text-white" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-center max-w-md"
        >
          <h1 className="text-3xl font-bold mb-4">Check your email</h1>
          <p className="text-white/70 mb-6">
            We've sent a confirmation link to your email address. Please check your inbox and follow the link to verify your account.
          </p>
          
          <div className="mt-8 text-white/60 text-sm">
            <p>Didn't receive an email? Check your spam folder or</p>
            <Link 
              href="/auth/login" 
              className="text-indigo-400 hover:text-indigo-300 font-medium mt-2 inline-block"
              onClick={() => {
                // Add haptic feedback
                if (window.navigator && window.navigator.vibrate) {
                  window.navigator.vibrate(3);
                }
              }}
            >
              Return to login
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
