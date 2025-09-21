/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        'chart-grid': 'hsl(var(--chart-grid))',
        'chart-candle-up': 'hsl(var(--chart-candle-up))',
        'chart-candle-down': 'hsl(var(--chart-candle-down))',
        'bid-background': 'hsl(var(--bid-background))',
        'ask-background': 'hsl(var(--ask-background))',
        'mid-price': 'hsl(var(--mid-price))',
        'trading-header': 'hsl(var(--trading-header))',
        'trading-panel': 'hsl(var(--trading-panel))',
        'trading-border': 'hsl(var(--trading-border))',
        'trading-hover': 'hsl(var(--trading-hover))',
        'crypto-green': 'hsl(var(--crypto-green))',
        'crypto-red': 'hsl(var(--crypto-red))',
        'crypto-amber': 'hsl(var(--crypto-amber))',
        'crypto-blue': 'hsl(var(--crypto-blue))',
      },
    },
  },
  plugins: [],
}
