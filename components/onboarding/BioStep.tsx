'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';

interface BioStepProps {
  bio: string;
  onUpdate: (bio: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function BioStep({ bio, onUpdate, onNext, onBack }: BioStepProps) {
  const [value, setValue] = useState(bio);
  const maxLength = 160;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(value);
    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Tell us about yourself</h2>
        <p className="text-zinc-400">Add a short bio to help people get to know you</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
              placeholder="Write a short bio..."
              rows={4}
              className="w-full p-3 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
            />
            <div className="absolute bottom-2 right-2 text-xs text-zinc-500">
              {value.length}/{maxLength}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onBack}
            className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
          >
            Continue
          </motion.button>
        </div>
        
        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setValue('');
              onNext();
            }}
            className="text-sm text-zinc-500 hover:text-zinc-400 transition-colors"
          >
            Skip for now
          </button>
        </div>
      </form>
    </motion.div>
  );
}
