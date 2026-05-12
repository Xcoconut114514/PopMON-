module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'cursive'],
      },
      colors: {
        monad: {
          dark: '#200052',
          purple: '#836EF9',
          ice: '#A0C2F9',
          bg: '#0f0e17',
        },
        cyber: {
          pink: '#f72585',
          blue: '#4361ee',
          dark: '#1a1a2e',
        },
        arcade: { red: '#FF0000' },
        rarity: {
          common: '#9ca3af',
          uncommon: '#4ade80',
          rare: '#60a5fa',
          epic: '#a855f7',
          legendary: '#f59e0b',
        },
      },
      boxShadow: {
        pixel: '6px 6px 0px 0px rgba(0,0,0,1)',
        'pixel-sm': '3px 3px 0px 0px rgba(0,0,0,1)',
        'pixel-active': '2px 2px 0px 0px rgba(0,0,0,1)',
        neon: '0 0 10px rgba(131,110,249,0.5), 0 0 20px rgba(67,97,238,0.5)',
        'neon-gold': '0 0 10px rgba(245,158,11,0.7), 0 0 30px rgba(245,158,11,0.4)',
        'neon-purple': '0 0 15px rgba(131,110,249,0.8), 0 0 40px rgba(131,110,249,0.4)',
      },
      backgroundImage: {
        'grid-pattern':
          'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
      },
      keyframes: {
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        scanline: { '0%': { top: '0%' }, '100%': { top: '100%' } },
        'spin-slow': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
        scanline: 'scanline 3s linear infinite',
        'spin-slow': 'spin-slow 8s linear infinite',
      },
    },
  },
  plugins: [],
}
