'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Palette, ArrowLeft, Check } from 'lucide-react';

interface ThemeStepProps {
  themeColor: string;
  onUpdate: (themeColor: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function ThemeStep({ themeColor, onUpdate, onNext, onBack }: ThemeStepProps) {
  const [selectedColor, setSelectedColor] = useState(themeColor);
  
  const themeColors = [
    { name: 'Blue', value: '#38bdf8' },
    { name: 'Purple', value: '#a78bfa' },
    { name: 'Pink', value: '#f472b6' },
    { name: 'Green', value: '#4ade80' },
    { name: 'Orange', value: '#fb923c' },
    { name: 'Red', value: '#f87171' },
  ];

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onUpdate(color);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
          <Palette className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Choose your theme</h2>
        <p className="text-zinc-400">Select a color theme for your experience</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-3 gap-3">
          {themeColors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => handleColorSelect(color.value)}
              className="relative aspect-square rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <div 
                className="absolute inset-0" 
                style={{ backgroundColor: color.value }}
              />
              
              {selectedColor === color.value && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <Check className="w-6 h-6 text-white" />
                </div>
              )}
            </button>
          ))}
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
            className="flex-1 py-3 px-4"
            style={{ 
              backgroundColor: selectedColor,
              color: 'white'
            }}
          >
            Continue
          </motion.button>
        </div>
      </form>
    </motion.div>
  );
}
