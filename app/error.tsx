'use client';

import { useEffect, useState } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<null | any>(null);

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error);
    
    // Collect browser and environment information for diagnostics
    setDiagnosticInfo({
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      errorDigest: error.digest,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      // TypeScript doesn't recognize performance.memory, so we need to use type assertions
      memory: (performance as any).memory ? {
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize
      } : 'Not available'
    });
    
    // Try to check if API routes are working
    const checkApiHealth = async () => {
      try {
        const response = await fetch('/api/minimal');
        const healthData = await response.json();
        setDiagnosticInfo((prev: any) => ({ ...prev, apiHealth: healthData }));
      } catch (healthError) {
        setDiagnosticInfo((prev: any) => ({ 
          ...prev, 
          apiHealth: { status: 'error', error: String(healthError) } 
        }));
      }
    };
    
    checkApiHealth();
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-white">
      <div className="max-w-md w-full p-6 rounded-2xl bg-zinc-900/70 border border-zinc-700/30 shadow-xl text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-zinc-400 mb-6">
          {error?.message || 'An unexpected error has occurred.'}
        </p>
        <div className="flex justify-center gap-4 mb-6">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-medium transition-colors"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium transition-colors"
          >
            Go Home
          </a>
        </div>
        
        <div className="mt-8 text-left">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            {showDetails ? 'Hide' : 'Show'} Error Details
          </button>
          
          {showDetails && diagnosticInfo && (
            <div className="mt-4 p-4 bg-zinc-950 rounded-lg border border-zinc-800 overflow-auto">
              <h3 className="text-sm font-semibold mb-2">Error Information</h3>
              <pre className="text-xs text-zinc-400 overflow-x-auto">
                {JSON.stringify(diagnosticInfo, null, 2)}
              </pre>
              
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2">Diagnostic Links</h3>
                <div className="flex flex-col gap-2 text-xs">
                  <a 
                    href="/api/minimal" 
                    target="_blank" 
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Check Minimal API
                  </a>
                  <a 
                    href="/api/health" 
                    target="_blank" 
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Check Health API
                  </a>
                  <a 
                    href="/api/catchall" 
                    target="_blank" 
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Check Catchall API
                  </a>
                  <a 
                    href="/emergency-debug" 
                    target="_blank" 
                    className="text-blue-400 hover:text-blue-300"
                  >
                    Emergency Debug
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
