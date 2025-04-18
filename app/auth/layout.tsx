import AuthHeader from './components/auth-header';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-zinc-900 to-black p-4">
      <AuthHeader />
      
      {children}
      
      <div className="mt-8 text-zinc-500 text-sm text-center">
        <p> {new Date().getFullYear()} Vibe. All rights reserved.</p>
      </div>
    </div>
  );
}
