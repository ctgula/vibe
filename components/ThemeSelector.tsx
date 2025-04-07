'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, X, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeSelector() {
  const { themeColor, setThemeColor } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themeColors = [
    { name: 'Blue', value: '#38bdf8' },
    { name: 'Purple', value: '#a78bfa' },
    { name: 'Pink', value: '#f472b6' },
    { name: 'Green', value: '#4ade80' },
    { name: 'Orange', value: '#fb923c' },
    { name: 'Red', value: '#f87171' },
  ];

  const handleColorSelect = async (color: string) => {
    await setThemeColor(color);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-zinc-800 transition-colors relative"
        aria-label="Change theme color"
      >
        <Palette className="w-5 h-5 text-zinc-400" />
        <div 
          className="absolute bottom-0.5 right-0.5 w-2.5 h-2.5 rounded-full border border-zinc-700"
          style={{ backgroundColor: themeColor }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Color picker */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              transition={{ type: 'spring', damping: 20 }}
              className="absolute right-0 top-full mt-2 z-50 p-3 rounded-lg bg-zinc-900 border border-zinc-700 shadow-xl w-64"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-medium text-zinc-300">Theme Color</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-full hover:bg-zinc-800 transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {themeColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorSelect(color.value)}
                    className="relative aspect-square rounded-md overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/50"
                  >
                    <div 
                      className="absolute inset-0" 
                      style={{ backgroundColor: color.value }}
                    />
                    
                    {themeColor === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Check className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
