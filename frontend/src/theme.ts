/**
 * PixelFlow Theme Configuration
 * Consistent colors across the entire application
 */

export const theme = {
  // Primary brand colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',  // Main blue
    600: '#2563eb',  // Darker blue
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Secondary accent colors
  secondary: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',  // Main purple
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  
  // Background colors
  background: {
    light: {
      primary: '#ffffff',      // Cards, panels
      secondary: '#f8fafc',    // Page background
      tertiary: '#f1f5f9',     // Subtle backgrounds
      hover: '#f1f5f9',        // Hover states
    },
    dark: {
      primary: '#18181b',      // Cards, panels (zinc-900)
      secondary: '#09090b',    // Page background (zinc-950)
      tertiary: '#27272a',     // Subtle backgrounds (zinc-800)
      hover: '#27272a',        // Hover states
    },
  },
  
  // Text colors
  text: {
    light: {
      primary: '#0f172a',      // Main text (slate-900)
      secondary: '#475569',    // Secondary text (slate-600)
      tertiary: '#94a3b8',     // Muted text (slate-400)
    },
    dark: {
      primary: '#f8fafc',      // Main text (slate-50)
      secondary: '#cbd5e1',    // Secondary text (slate-300)
      tertiary: '#64748b',     // Muted text (slate-500)
    },
  },
  
  // Border colors
  border: {
    light: '#e2e8f0',          // slate-200
    dark: '#334155',           // slate-700
  },
  
  // Status colors (same in both modes)
  status: {
    success: {
      light: '#10b981',        // green-500
      dark: '#34d399',         // green-400
      bg: {
        light: '#d1fae5',      // green-100
        dark: '#064e3b',       // green-900
      },
    },
    error: {
      light: '#ef4444',        // red-500
      dark: '#f87171',         // red-400
      bg: {
        light: '#fee2e2',      // red-100
        dark: '#7f1d1d',       // red-900
      },
    },
    warning: {
      light: '#f59e0b',        // amber-500
      dark: '#fbbf24',         // amber-400
      bg: {
        light: '#fef3c7',      // amber-100
        dark: '#78350f',       // amber-900
      },
    },
    info: {
      light: '#3b82f6',        // blue-500
      dark: '#60a5fa',         // blue-400
      bg: {
        light: '#dbeafe',      // blue-100
        dark: '#1e3a8a',       // blue-900
      },
    },
  },
  
  // Gradient backgrounds
  gradients: {
    light: {
      page: 'from-slate-50 via-blue-50 to-indigo-50',
      hero: 'from-blue-600 to-indigo-600',
      card: 'from-white to-slate-50',
    },
    dark: {
      page: 'from-zinc-950 via-zinc-900 to-zinc-950',
      hero: 'from-blue-500 to-indigo-500',
      card: 'from-zinc-900 to-zinc-800',
    },
  },
  
  // Shadow styles
  shadows: {
    light: {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
    },
    dark: {
      sm: 'shadow-sm shadow-black/20',
      md: 'shadow-md shadow-black/30',
      lg: 'shadow-lg shadow-black/40',
      xl: 'shadow-xl shadow-black/50',
    },
  },
};

/**
 * Helper function to get theme-aware classes
 */
export const getThemeClasses = (isDark: boolean) => ({
  // Page backgrounds
  pageBg: isDark 
    ? 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950' 
    : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50',
  
  // Card backgrounds
  cardBg: isDark ? 'bg-zinc-900' : 'bg-white',
  cardBorder: isDark ? 'border-zinc-800' : 'border-slate-200',
  cardHover: isDark ? 'hover:bg-zinc-800' : 'hover:bg-slate-50',
  
  // Panel backgrounds (sidebars, headers)
  panelBg: isDark ? 'bg-zinc-900/95' : 'bg-white',
  panelBorder: isDark ? 'border-zinc-800' : 'border-slate-200',
  
  // Text colors
  textPrimary: isDark ? 'text-slate-50' : 'text-slate-900',
  textSecondary: isDark ? 'text-slate-300' : 'text-slate-600',
  textTertiary: isDark ? 'text-slate-500' : 'text-slate-400',
  
  // Interactive elements
  buttonPrimary: isDark
    ? 'bg-blue-600 hover:bg-blue-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white',
  
  buttonSecondary: isDark
    ? 'bg-zinc-800 hover:bg-zinc-700 text-slate-200 border border-zinc-700'
    : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200',
  
  buttonGhost: isDark
    ? 'text-slate-300 hover:bg-zinc-800'
    : 'text-slate-600 hover:bg-slate-100',
  
  // Input elements
  input: isDark
    ? 'bg-zinc-800 border-zinc-700 text-slate-100 focus:border-blue-500'
    : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500',
  
  // Accent backgrounds
  accentBg: isDark ? 'bg-blue-900/20' : 'bg-blue-50',
  accentBorder: isDark ? 'border-blue-800' : 'border-blue-200',
  accentText: isDark ? 'text-blue-400' : 'text-blue-700',
});

export default theme;
