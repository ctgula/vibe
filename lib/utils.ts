import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Utility function to conditionally join class names together.
 * 
 * @param inputs Class names to join
 * @returns Joined class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Lazy loads an image to improve performance
 * @param imageUrl URL of the image to load
 * @returns Promise that resolves when the image is loaded
 */
export function lazyLoadImage(imageUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
}

/**
 * Checks if the app is running as a PWA (in standalone mode)
 * @returns boolean indicating if the app is in standalone mode
 */
export function isRunningAsPWA(): boolean {
  if (typeof window !== 'undefined') {
    return window.matchMedia('(display-mode: standalone)').matches || 
           (window.navigator as any).standalone === true;
  }
  return false;
}

/**
 * Checks if the device is a mobile device
 * @returns boolean indicating if the device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window !== 'undefined') {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      window.navigator.userAgent
    );
  }
  return false;
}

/**
 * Generates a creative guest name
 * @returns A creative guest name
 */
export function generateCreativeGuestName(): string {
  const adjectives = [
    "Vibrant", "Cosmic", "Dreamy", "Electric", "Funky", "Groovy", "Hazy", 
    "Jazzy", "Lush", "Mellow", "Neon", "Psychedelic", "Retro", "Smooth", 
    "Wavy", "Zen", "Astral", "Blissful", "Chill", "Dazzling"
  ];
  
  const nouns = [
    "Wave", "Beat", "Rhythm", "Melody", "Harmony", "Echo", "Pulse", 
    "Vibe", "Flow", "Groove", "Tune", "Chord", "Note", "Sound", 
    "Tempo", "Bass", "Synth", "Jam", "Mix", "Loop"
  ];
  
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 100);
  
  return `${randomAdjective}${randomNoun}${randomNumber}`;
}

/**
 * Generates a unique avatar URL using DiceBear API
 * @param seed Seed for the avatar generation
 * @returns URL for the avatar
 */
export function generateAvatarUrl(seed?: string): string {
  const styles = [
    "adventurer", "adventurer-neutral", "avataaars", "avataaars-neutral",
    "big-ears", "big-ears-neutral", "bottts", "bottts-neutral",
    "pixel-art", "pixel-art-neutral", "fun-emoji"
  ];
  
  const randomStyle = styles[Math.floor(Math.random() * styles.length)];
  const actualSeed = seed || Math.random().toString(36).substring(2, 10);
  
  return `https://api.dicebear.com/6.x/${randomStyle}/svg?seed=${actualSeed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
}
