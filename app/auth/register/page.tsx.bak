"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <div className="flex-1 flex flex-col p-6">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
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
            <span>Back</span>
          </Link>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Create an account</h1>
          <p className="text-white/60">Join the conversation</p>
        </motion.div>
        
        <SignUpForm />
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-white/60">
            Already have an account?{" "}
            <Link 
              href="/auth/login" 
              className="text-indigo-400 hover:text-indigo-300 font-medium"
              onClick={() => {
                // Add haptic feedback
                if (window.navigator && window.navigator.vibrate) {
                  window.navigator.vibrate(3);
                }
              }}
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
