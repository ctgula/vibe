'use client'

import { Toaster as SonnerToaster } from 'sonner'

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SonnerToaster 
        position="top-right" 
        richColors 
        expand={false}
        closeButton
        duration={4000}
        className="!bg-black/90 !text-white !border !border-white/10 !rounded-lg !shadow-2xl !backdrop-blur-xl"
        toastOptions={{
          className: 'group',
          classNames: {
            toast: '!bg-black/90 !text-white !border !border-white/10 !rounded-lg !shadow-2xl !backdrop-blur-xl',
            title: '!text-white !font-medium',
            description: '!text-white/80',
            actionButton: '!bg-white/10 !text-white !rounded-md hover:!bg-white/20',
            cancelButton: '!bg-white/10 !text-white !rounded-md hover:!bg-white/20',
            closeButton: '!bg-white/10 !text-white !rounded-full !p-1 !opacity-0 group-hover:!opacity-100 hover:!bg-white/20',
          },
        }}
      />
      {children}
    </>
  )
}
