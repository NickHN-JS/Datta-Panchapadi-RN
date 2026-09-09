import { vars } from 'nativewind';
import type { Theme } from '../context/ReaderContext';

/**
 * Material 3 tonal palettes ported from the web app's index.css
 * (.theme-light / .theme-dark / .theme-papyrus custom properties).
 * Colors are stored as "R G B" triplets so Tailwind's
 * rgb(var(--x) / <alpha-value>) pattern can apply opacity.
 */
export const themeVars: Record<Theme, ReturnType<typeof vars>> = {
    light: vars({
        '--md-primary': '140 29 24',
        '--md-on-primary': '255 255 255',
        '--md-primary-container': '255 218 214',
        '--md-on-primary-container': '65 0 2',
        '--md-background': '253 248 245',
        '--md-on-background': '34 26 21',
        '--md-surface': '253 250 246',
        '--md-on-surface': '44 37 32',
        '--md-surface-container': '247 237 228',
        '--md-on-surface-variant': '83 67 58',
        '--md-outline': '140 29 24',
        '--color-gold': '197 168 128',
    }),
    dark: vars({
        '--md-primary': '255 180 171',
        '--md-on-primary': '105 0 5',
        '--md-primary-container': '147 0 10',
        '--md-on-primary-container': '255 218 214',
        '--md-background': '20 17 15',
        '--md-on-background': '240 223 216',
        '--md-surface': '34 28 26',
        '--md-on-surface': '229 222 201',
        '--md-surface-container': '43 35 32',
        '--md-on-surface-variant': '216 194 183',
        '--md-outline': '255 180 171',
        '--color-gold': '212 175 55',
    }),
    papyrus: vars({
        '--md-primary': '118 90 0',
        '--md-on-primary': '255 255 255',
        '--md-primary-container': '255 224 129',
        '--md-on-primary-container': '36 26 0',
        '--md-background': '235 220 185',
        '--md-on-background': '69 60 40',
        '--md-surface': '243 233 200',
        '--md-on-surface': '74 59 42',
        '--md-surface-container': '225 207 171',
        '--md-on-surface-variant': '80 69 49',
        '--md-outline': '118 90 0',
        '--color-gold': '179 143 70',
    }),
};

/** Gradient stops for screen backgrounds (used with expo-linear-gradient),
 * matching the web app's --bg-app CSS gradients per theme. */
export const themeGradient: Record<Theme, [string, string]> = {
    light: ['#fdf8f5', '#f7ede4'],
    dark: ['#14110f', '#0d0a08'],
    papyrus: ['#f3e9c8', '#ebdcb9'],
};
