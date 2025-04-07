'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  withText?: boolean;
  className?: string;
  linkClassName?: string;
  asLink?: boolean;
}

export function Logo({ 
  size = 'md', 
  withText = true, 
  className = '',
  linkClassName = '',
  asLink = true 
}: LogoProps) {
  const router = useRouter();
  
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12'
  };
  
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl'
  };
  
  const logoContent = (
    <motion.div
      className={`flex items-center gap-2 ${className}`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={`relative aspect-square ${sizeClasses[size]}`}>
        <img src="/logo.png" alt="Vibe Logo" className="h-full w-full" />
      </div>
      {withText && (
        <span className={`font-bold ${textSizes[size]}`}>
          Vibe
        </span>
      )}
    </motion.div>
  );
  
  return asLink ? (
    <Link href="/" className={`no-underline ${linkClassName}`}>
      {logoContent}
    </Link>
  ) : (
    logoContent
  );
}
