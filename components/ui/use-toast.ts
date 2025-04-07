'use client'

import { useContext } from 'react';
import { ToastContext } from './toast-provider';

export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  // Return a simplified interface that matches what we use in the Profile component
  return {
    toast: ({ title, description, variant = 'default' }: { 
      title?: string;
      description?: string;
      variant?: 'default' | 'destructive';
    }) => {
      const message = description || title || '';
      const type = variant === 'destructive' ? 'error' : 'success';
      context.showToast(message, type);
    }
  };
};
