/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark olive palette
        'olive': {
          'page': '#111412',      // Page background
          'card': '#1A1D1B',      // Card backgrounds
          'lead': '#1E211F',      // Lead card (emphasized)
          'sidebar': '#151815',   // Right sidebar
          'nav': '#0E100F',       // Left nav (darkest)
          'border': 'rgba(255,255,255,0.06)',
          'border-hover': 'rgba(255,255,255,0.12)',
          'primary': '#E8E6E3',   // Primary text (warm white)
          'secondary': '#9B9990', // Secondary text
          'tertiary': '#7A7870',  // Tertiary/data text
          'muted': '#5A5850',     // Muted text
        },
        // Status colors
        'status': {
          'green': '#10B981',
          'green-muted': 'rgba(16, 185, 129, 0.15)',
          'amber': '#F59E0B',
          'amber-muted': 'rgba(245, 158, 11, 0.15)',
          'red': '#EF4444',
          'red-muted': 'rgba(239, 68, 68, 0.15)',
        },
        // Legacy bmb colors (for compatibility during migration)
        'bmb': {
          'black': '#0A0A0C',
          'dark': '#141416',
          'elevated': '#1C1C1E',
          'border': '#2A2A2E',
          'success': '#10B981',
          'warning': '#F59E0B',
          'danger': '#EF4444',
          'primary': '#F5F5F7',
          'secondary': '#8E8E93',
          'accent': '#64748B',
        }
      },
      fontFamily: {
        'sans': ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'display': ['Space Grotesk', 'SF Pro Display', 'sans-serif'],
        'body': ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        'mono': ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
      },
      fontSize: {
        // Custom sizes
        '2xs': '0.625rem',
        // Display typography (Space Grotesk)
        'display-status': ['38px', { lineHeight: '1.1', fontWeight: '600' }],
        'display-lead': ['22px', { lineHeight: '1.2', fontWeight: '600' }],
        'display-secondary': ['18px', { lineHeight: '1.3', fontWeight: '500' }],
        // Body typography (DM Sans)
        'body-outcome': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-card': ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-small': ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        // Data typography (JetBrains Mono)
        'data-lg': ['18px', { lineHeight: '1.2', fontWeight: '500' }],
        'data-md': ['14px', { lineHeight: '1.2', fontWeight: '500' }],
        'data-sm': ['11px', { lineHeight: '1.2', fontWeight: '500' }],
        // Standard sizes
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '3.75rem',
      },
      spacing: {
        // Layout spacing
        'nav': '70px',          // Left nav width
        'sidebar': '35%',       // Right sidebar width
        'main': '60%',          // Main feed width
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
        'fade-in': 'fade-in 0.5s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'glow-red': 'glow-red 2s ease-in-out infinite',
        'glow-amber': 'glow-amber 3s ease-in-out infinite',
        'threat-pulse': 'threat-pulse 3s ease-in-out infinite',
        'ring-fill': 'ring-fill 1.2s ease-out forwards',
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(100, 116, 139, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(100, 116, 139, 0.5)' },
        },
        'glow-red': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(239, 68, 68, 0.15)' },
          '50%': { boxShadow: '0 0 40px rgba(239, 68, 68, 0.3)' },
        },
        'glow-amber': {
          '0%, 100%': { boxShadow: '0 0 15px rgba(245, 158, 11, 0.1)' },
          '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.2)' },
        },
        'threat-pulse': {
          '0%, 100%': { opacity: 1, backgroundPosition: '0% 50%' },
          '50%': { opacity: 0.95, backgroundPosition: '100% 50%' },
        },
        'ring-fill': {
          '0%': { strokeDashoffset: 'var(--ring-circumference)' },
          '100%': { strokeDashoffset: 'var(--ring-offset)' },
        },
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(100, 116, 139, 0.2)',
        'glow': '0 0 20px rgba(100, 116, 139, 0.3)',
        'glow-lg': '0 0 30px rgba(100, 116, 139, 0.4)',
        'glow-red': '0 0 30px rgba(239, 68, 68, 0.2)',
        'glow-red-lg': '0 0 50px rgba(239, 68, 68, 0.3)',
        'glow-amber': '0 0 25px rgba(245, 158, 11, 0.15)',
        'glow-green': '0 0 25px rgba(16, 185, 129, 0.15)',
        'inner-glow': 'inset 0 0 20px rgba(100, 116, 139, 0.05)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'glass-lg': '0 12px 48px rgba(0, 0, 0, 0.4)',
        // Card shadows
        'card': '0 4px 24px rgba(0, 0, 0, 0.2)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'lead-card': '0 8px 40px rgba(0, 0, 0, 0.35)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'grid-pattern': `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23262626' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        'threat-gradient': 'linear-gradient(135deg, rgba(127,29,29,0.6) 0%, rgba(153,27,27,0.4) 50%, rgba(127,29,29,0.6) 100%)',
        'amber-gradient': 'linear-gradient(135deg, rgba(120,53,15,0.4) 0%, rgba(146,64,14,0.3) 50%, rgba(120,53,15,0.4) 100%)',
        // Olive gradients
        'olive-gradient': 'linear-gradient(180deg, #151815 0%, #111412 100%)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
