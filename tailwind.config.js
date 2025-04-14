/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      // Add modern spacing for better mobile experience
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
        'dynamic-xs': 'clamp(0.5rem, 2vw, 0.75rem)',
        'dynamic-sm': 'clamp(0.75rem, 3vw, 1rem)',
        'dynamic-md': 'clamp(1rem, 4vw, 1.5rem)',
        'dynamic-lg': 'clamp(1.5rem, 5vw, 2rem)',
        'dynamic-xl': 'clamp(2rem, 6vw, 3rem)',
      },
      // Add modern font sizes that scale better on mobile
      fontSize: {
        'adaptive-xs': 'clamp(0.75rem, 2vw, 0.875rem)',
        'adaptive-sm': 'clamp(0.875rem, 2.5vw, 1rem)',
        'adaptive-base': 'clamp(1rem, 3vw, 1.125rem)',
        'adaptive-lg': 'clamp(1.125rem, 3.5vw, 1.25rem)',
        'adaptive-xl': 'clamp(1.25rem, 4vw, 1.5rem)',
        'adaptive-2xl': 'clamp(1.5rem, 5vw, 1.875rem)',
        'adaptive-3xl': 'clamp(1.875rem, 6vw, 2.25rem)',
      },
      // Add touch-friendly min heights for interactive elements
      minHeight: {
        'touch': '44px', // iOS minimum touch target
        'touch-lg': '54px',
      },
    },
  },
  plugins: [],
}
