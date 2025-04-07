'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

type ThemeColor = string;

interface ThemeContextType {
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => Promise<void>;
  applyThemeStyles: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeColor, setThemeColorState] = useState<ThemeColor>('#38bdf8');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      setIsLoading(true);
      
      try {
        // Try to get profile ID from localStorage
        const profileId = localStorage.getItem('guestProfileId');
        
        if (profileId) {
          // Fetch profile data to get theme color
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('theme_color')
            .eq('id', profileId)
            .single();
            
          if (!error && profileData?.theme_color) {
            setThemeColorState(profileData.theme_color);
          } else {
            // If no theme color in profile, try localStorage
            const savedTheme = localStorage.getItem('themeColor');
            if (savedTheme) {
              setThemeColorState(savedTheme);
            }
          }
        } else {
          // If no profile, try localStorage
          const savedTheme = localStorage.getItem('themeColor');
          if (savedTheme) {
            setThemeColorState(savedTheme);
          }
        }
      } catch (err) {
        console.error('Error loading theme:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTheme();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      applyThemeStyles();
    }
  }, [themeColor, isLoading]);

  const setThemeColor = async (color: ThemeColor) => {
    setThemeColorState(color);
    localStorage.setItem('themeColor', color);
    
    // Update theme in profile if available
    const profileId = localStorage.getItem('guestProfileId');
    if (profileId) {
      try {
        await supabase
          .from('profiles')
          .update({ theme_color: color })
          .eq('id', profileId);
      } catch (err) {
        console.error('Error updating theme in profile:', err);
      }
    }
  };

  const applyThemeStyles = () => {
    // Convert hex to RGB for CSS variables
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };

    const rgb = hexToRgb(themeColor);
    
    // Set CSS variables for theme color
    document.documentElement.style.setProperty('--theme-r', rgb.r.toString());
    document.documentElement.style.setProperty('--theme-g', rgb.g.toString());
    document.documentElement.style.setProperty('--theme-b', rgb.b.toString());
    document.documentElement.style.setProperty('--theme-color', themeColor);
    
    // Apply theme color to meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', themeColor);
    }
  };

  return (
    <ThemeContext.Provider value={{ themeColor, setThemeColor, applyThemeStyles }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
