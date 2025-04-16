'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { AlertCircle, X } from "lucide-react"
import { Check } from "lucide-react"

type Toast = {
  id: number
  message: string
  type: "success" | "error" | "info"
}

type ToastContextType = {
  toasts: Toast[]
  showToast: (message: string, type?: "success" | "error" | "info") => void
  removeToast: (id: number) => void
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now()
    setToasts((prev) => [...prev, { id, message, type }])

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 5000)
  }

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  const getIcon = (type: "success" | "error" | "info") => {
    switch (type) {
      case "success":
        return <Check className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      case "info":
        return <AlertCircle className="h-4 w-4" />
    }
  }

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <div 
        className="fixed bottom-4 right-4 z-50 space-y-2"
        style={{ 
          willChange: 'transform',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          touchAction: 'manipulation',
          perspective: '1000px'
        }}
      >
        <AnimatePresence mode="sync">
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 30,
                mass: 0.8
              }}
              style={{ 
                willChange: 'transform',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                userSelect: 'none',
                touchAction: 'pan-y'
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.9}
              onDragEnd={(e, info) => {
                if (Math.abs(info.offset.y) > 50) {
                  removeToast(toast.id);
                }
              }}
              className="flex items-center gap-2 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg border border-white/10"
              draggable={false}
            >
              <span className={toast.type === "success" ? "text-emerald-400" : toast.type === "error" ? "text-red-400" : "text-blue-400"}>
                {getIcon(toast.type)}
              </span>
              {toast.message}
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 hover:opacity-70 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
