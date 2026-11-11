/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'bg-void': 'var(--bg-void)',
        'bg-hud': 'var(--bg-hud)',
        'bg-card': 'var(--bg-card)',
        'bg-card-sub': 'var(--bg-card-sub)',
        'neon-red': '#ff2a4b',
        'neon-yellow': '#ffb703',
        'neon-cyan': '#00f3ff',
        'neon-green': '#22c55e',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        headline: ['Space Grotesk', 'sans-serif'],
        body: ['Plus Jakarta Sans', 'Geist', 'sans-serif'],
        mono: ['JetBrains Mono', 'Space Mono', 'monospace'],
        'mono-cyber': ['JetBrains Mono', 'Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

