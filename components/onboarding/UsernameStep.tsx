'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { User, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface UsernameStepProps {
  username: string;
  onUpdate: (username: string) => void;
  onNext: () => void;
}

export function UsernameStep({ username, onUpdate, onNext }: UsernameStepProps) {
  const [value, setValue] = useState(username);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const iconControls = useAnimation();
  const buttonControls = useAnimation();

  // Focus the input on component mount for better UX
  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 400);
  }, []);

  // Animated validation check
  useEffect(() => {
    const checkUsername = async () => {
      if (!value || value.length < 3) {
        setIsAvailable(false);
        return;
      }

      setIsChecking(true);
      setError(null);

      try {
        // Check if username exists
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', value)
          .single();

        // Small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));

        if (error && error.code === 'PGRST116') {
          // No match found, username is available
          setIsAvailable(true);
          iconControls.start({
            scale: [1, 1.2, 1],
            transition: { duration: 0.3, ease: "easeInOut" }
          });
        } else {
          // Username exists
          setIsAvailable(false);
          setError('This username is already taken');
          iconControls.start({
            x: [0, -5, 5, -5, 0],
            transition: { duration: 0.4 }
          });
        }
      } catch (err) {
        console.error('Error checking username:', err);
      } finally {
        setIsChecking(false);
      }
    };

    const debounce = setTimeout(() => {
      if (value && hasInteracted) {
        checkUsername();
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [value, iconControls, hasInteracted]);

  // Button animation when username becomes valid
  useEffect(() => {
    if (isAvailable && value && value.length >= 3 && !isChecking) {
      buttonControls.start({
        scale: [1, 1.03, 1],
        transition: { duration: 0.3 }
      });
    }
  }, [isAvailable, value, isChecking, buttonControls]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!value) {
      setError('Username is required');
      // Shake animation for error
      iconControls.start({
        x: [0, -5, 5, -5, 0],
        transition: { duration: 0.4 }
      });
      return;
    }
    
    if (value.length < 3) {
      setError('Username must be at least 3 characters');
      // Shake animation for error
      iconControls.start({
        x: [0, -5, 5, -5, 0],
        transition: { duration: 0.4 }
      });
      return;
    }
    
    if (!isAvailable) {
      // Shake animation for error
      iconControls.start({
        x: [0, -5, 5, -5, 0],
        transition: { duration: 0.4 }
      });
      return;
    }
    
    onUpdate(value);
    onNext();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    if (!hasInteracted) setHasInteracted(true);
    if (error) setError(null);
  };

  // Input animations
  const inputVariants = {
    focused: {
      boxShadow: "0 0 0 2px rgba(99, 102, 241, 0.3)",
      borderColor: "rgba(99, 102, 241, 0.8)",
      transition: { duration: 0.2 }
    },
    error: {
      boxShadow: "0 0 0 2px rgba(239, 68, 68, 0.3)",
      borderColor: "rgba(239, 68, 68, 0.8)",
      transition: { duration: 0.2 }
    },
    idle: {
      boxShadow: "0 0 0 0px transparent",
      borderColor: "rgba(63, 63, 70, 0.8)",
      transition: { duration: 0.2 }
    }
  };

  // Determine which input variant to use
  const getInputVariant = () => {
    if (error) return "error";
    if (isFocused) return "focused";
    return "idle";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            delay: 0.1,
            duration: 0.4, 
            type: "spring", 
            stiffness: 300, 
            damping: 20 
          }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-600/30 backdrop-blur-sm flex items-center justify-center mx-auto mb-5"
        >
          <User className="w-10 h-10 text-indigo-400" />
        </motion.div>
        <motion.h2 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Choose a username
        </motion.h2>
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-zinc-400"
        >
          This is how others will see you in rooms and chats
        </motion.p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <motion.div 
            className="relative"
            variants={inputVariants}
            animate={getInputVariant()}
          >
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Enter a username"
              className="w-full p-3.5 pl-4 pr-10 bg-zinc-800/50 border border-zinc-700 rounded-lg focus:outline-none text-white transition-all"
              autoComplete="off"
              spellCheck="false"
              autoFocus
            />
            <div className="absolute right-3 top-3.5">
              <AnimatePresence mode="wait">
                {isChecking && (
                  <motion.div
                    key="checking"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  </motion.div>
                )}
                {!isChecking && value && value.length >= 3 && (
                  <motion.div
                    key="validation-result"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={isAvailable ? 
                      { opacity: 1, scale: 1 } : 
                      { opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    custom={iconControls}
                  >
                    {isAvailable ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-2 text-sm text-red-500"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!isAvailable || isChecking || !value || value.length < 3}
          className={`
            w-full py-3.5 px-4 rounded-lg font-medium transition-all
            ${(!isAvailable || isChecking || !value || value.length < 3) 
              ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-700 text-white shadow-lg shadow-indigo-600/20'}
          `}
          custom={buttonControls}
        >
          Continue
        </motion.button>
      </form>
    </motion.div>
  );
}
