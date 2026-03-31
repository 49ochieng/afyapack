/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
    './src/app/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        background:  'hsl(var(--background))',
        surface:     'hsl(var(--surface))',
        foreground:  'hsl(var(--foreground))',

        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          light:      'hsl(var(--primary-light))',
          mid:        'hsl(var(--primary-mid))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border:  'hsl(var(--border))',
        input:   'hsl(var(--input))',
        ring:    'hsl(var(--ring))',
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },

        // Navigation panel
        nav: {
          DEFAULT: 'hsl(var(--nav))',
          surface: 'hsl(var(--nav-surface))',
          border:  'hsl(var(--nav-border))',
          text:    'hsl(var(--nav-text))',
          active:  'hsl(var(--nav-text-active))',
        },

        sidebar: 'hsl(var(--sidebar))',
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        lg:   'var(--radius)',
        md:   'calc(var(--radius) - 3px)',
        sm:   'calc(var(--radius) - 6px)',
      },

      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        '2xs': ['0.65rem',  { lineHeight: '1rem' }],
        'xs':  ['0.75rem',  { lineHeight: '1.125rem' }],
        'sm':  ['0.875rem', { lineHeight: '1.375rem' }],
      },

      boxShadow: {
        'card':  '0 1px 4px rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06)',
        'panel': '0 8px 24px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)',
        'chat-user': '0 2px 8px rgba(22,163,148,0.3)',
        'chat-ai':   '0 2px 8px rgba(0,0,0,0.06)',
        'inset-sm':  'inset 0 1px 2px rgba(0,0,0,0.06)',
      },

      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.5' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-left': {
          from: { opacity: '0', transform: 'translateX(12px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
      },

      animation: {
        'pulse-soft': 'pulse-soft 2.5s ease-in-out infinite',
        'fade-in':    'fade-in 0.35s ease-out both',
        'fade-up':    'fade-up 0.4s ease-out both',
        'slide-left': 'slide-left 0.3s ease-out both',
        'scale-in':   'scale-in 0.2s ease-out both',
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
