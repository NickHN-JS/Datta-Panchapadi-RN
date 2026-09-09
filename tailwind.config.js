/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--md-primary) / <alpha-value>)',
        'on-primary': 'rgb(var(--md-on-primary) / <alpha-value>)',
        'primary-container': 'rgb(var(--md-primary-container) / <alpha-value>)',
        'on-primary-container': 'rgb(var(--md-on-primary-container) / <alpha-value>)',
        background: 'rgb(var(--md-background) / <alpha-value>)',
        'on-background': 'rgb(var(--md-on-background) / <alpha-value>)',
        surface: 'rgb(var(--md-surface) / <alpha-value>)',
        'on-surface': 'rgb(var(--md-on-surface) / <alpha-value>)',
        'surface-container': 'rgb(var(--md-surface-container) / <alpha-value>)',
        'on-surface-variant': 'rgb(var(--md-on-surface-variant) / <alpha-value>)',
        outline: 'rgb(var(--md-outline) / <alpha-value>)',
        ink: 'rgb(var(--md-on-surface) / <alpha-value>)',
        gold: 'rgb(var(--color-gold) / <alpha-value>)',
      },
      fontFamily: {
        serif: ['Martel_400Regular'],
        'serif-bold': ['Martel_700Bold'],
        'serif-black': ['Martel_900Black'],
        sans: ['Poppins_400Regular'],
        'sans-medium': ['Poppins_500Medium'],
        'sans-bold': ['Poppins_700Bold'],
        slab: ['YatraOne_400Regular'],
        cinzel: ['Cinzel_700Bold'],
      },
    },
  },
  plugins: [],
};
