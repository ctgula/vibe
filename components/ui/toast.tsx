"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, AlertCircle, X } from "lucide-react"

interface ToastProps {
  message: string
  type: "success" | "error" | "info"
  duration?: number
  onClose: () => void
}

export function Toast({ message, type, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Apply haptic feedback based on toast type
  useEffect(() => {
    if (window.navigator && window.navigator.vibrate) {
      switch (type) {
        case "success":
          window.navigator.vibrate([3, 10, 3])
          break
        case "error":
          window.navigator.vibrate([10, 5, 10, 5, 10])
          break
        case "info":
          window.navigator.vibrate(3)
          break
      }
    }
  }, [type])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow exit animation to complete
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case "success":
        return <Check className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
      case "info":
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getBgColor = () => {
    switch (type) {
      case "success":
        return "bg-green-500/90 backdrop-blur-sm"
      case "error":
        return "bg-red-500/90 backdrop-blur-sm"
      case "info":
        return "bg-blue-500/90 backdrop-blur-sm"
    }
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed bottom-20 left-1/2 z-50 transform -translate-x-1/2 px-4 w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        >
          <div
            className={`rounded-lg shadow-lg flex items-center p-4 ${getBgColor()}`}
            style={{
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            }}
          >
            <div className={`flex-shrink-0 mr-3 p-1 rounded-full ${type === "success" ? "bg-green-100" : type === "error" ? "bg-red-100" : "bg-blue-100"}`}>
              {getIcon()}
            </div>
            <div className="flex-1 mr-2">
              <p className="text-white text-sm font-medium">{message}</p>
            </div>
            <button
              onClick={() => {
                setIsVisible(false)
                setTimeout(onClose, 300)
              }}
              className="flex-shrink-0 rounded-full p-1 hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Global toast context
import { createContext, useContext, ReactNode } from "react"

type ToastContextType = {
  showToast: (message: string, type: "success" | "error" | "info", duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: "success" | "error" | "info"; duration?: number }>>([])
  const [lastId, setLastId] = useState(0)

  const showToast = (message: string, type: "success" | "error" | "info", duration?: number) => {
    const id = lastId + 1
    setLastId(id)
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="relative z-50">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
