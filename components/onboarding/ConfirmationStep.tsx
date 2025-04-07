'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowLeft, Loader2, Sparkles } from 'lucide-react';

interface ConfirmationStepProps {
  profile: {
    username: string;
    avatar_url: string;
    bio: string;
    theme_color: string;
    is_guest?: boolean;
  };
  loading: boolean;
  error: string | null;
  onSave: () => void;
  onBack: () => void;
}

export function ConfirmationStep({ profile, loading, error, onSave, onBack }: ConfirmationStepProps) {
  // Format color nicely for display
  const formatColorDisplay = (color: string) => {
    // If it's a hex color, keep it, otherwise convert to a readable format
    return color.startsWith('#') ? color.toUpperCase() : color;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="text-center mb-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.5, 
            type: "spring", 
            stiffness: 300, 
            damping: 20 
          }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-600/30 backdrop-blur-sm flex items-center justify-center mx-auto mb-5"
        >
          <CheckCircle className="w-10 h-10 text-green-400" />
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Almost done!
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-zinc-400"
        >
          Review your profile before finishing
        </motion.p>
      </div>
      
      <motion.div 
        className="space-y-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        <motion.div 
          className="p-4 rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 backdrop-blur-sm shadow-lg"
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center gap-4">
            <motion.div 
              className="w-20 h-20 rounded-full overflow-hidden bg-zinc-800 flex-shrink-0 ring-2 ring-zinc-700/50"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.username} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-500/30 to-purple-600/30 text-2xl font-bold text-white">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
            </motion.div>
            
            <div className="flex-1">
              <div className="flex items-center">
                <h3 className="text-xl font-bold text-white mr-2">{profile.username}</h3>
                {profile.is_guest && (
                  <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded-full border border-zinc-700/50">
                    Guest
                  </span>
                )}
              </div>
              {profile.bio ? (
                <p className="text-zinc-300 mt-1 line-clamp-2">{profile.bio}</p>
              ) : (
                <p className="text-zinc-500 italic mt-1 text-sm">No bio provided</p>
              )}
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          className="p-4 rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/70 to-zinc-900/70 backdrop-blur-sm"
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" }}
          transition={{ duration: 0.2 }}
        >
          <div className="text-sm text-zinc-400 mb-3">Theme Color</div>
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-8 h-8 rounded-full ring-2 ring-white/10" 
              style={{ backgroundColor: profile.theme_color }}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
            />
            <div className="text-white font-mono">{formatColorDisplay(profile.theme_color)}</div>
          </div>
        </motion.div>
        
        <motion.div 
          className="p-4 rounded-xl border border-zinc-700/50 bg-gradient-to-br from-zinc-800/70 to-zinc-900/50 backdrop-blur-sm"
          whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)" }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between">
            <div className="text-sm text-zinc-400">Guest Account</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-zinc-300 text-sm">Enabled</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            You can upgrade to a full account later by linking your email or social profile
          </p>
        </motion.div>
      </motion.div>
      
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
            className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
          >
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-red-500">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.02, backgroundColor: "rgba(63, 63, 70, 0.8)" }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-3.5 px-4 bg-zinc-800 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          type="button"
          onClick={onSave}
          disabled={loading}
          className="flex-1 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              Complete Setup
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
