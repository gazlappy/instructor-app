/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

/**
 * "Signpost" design system: the language of the British road.
 * Asphalt grounds, white sign-plate cards, motorway blue, and
 * primary-route green for driving tests.
 */
export const Colors = {
  light: {
    text: '#16181D',
    background: '#EFF1F3', // light asphalt
    backgroundElement: '#FFFFFF', // sign plates
    backgroundSelected: '#E1E5EA',
    textSecondary: '#5A616D',
    tint: '#0057B8', // motorway blue
    tintBorder: '#CFE3FF', // pale sign border
    onTint: '#FFFFFF',
    success: '#00703C', // primary-route green
    danger: '#C1121C', // sign red
    roadLine: '#D5D9DE',
    roadDash: '#FFFFFF',
  },
  dark: {
    text: '#ECEFF2',
    background: '#121417', // night tarmac
    backgroundElement: '#1C1F24',
    backgroundSelected: '#2A2E35',
    textSecondary: '#9AA1AC',
    tint: '#4D9FFF',
    tintBorder: '#1E3A5F',
    onTint: '#FFFFFF',
    success: '#2FA36B',
    danger: '#E5484D',
    roadLine: '#272B31',
    roadDash: '#5A616D',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

/** Clearance for the bottom tab bar (native system tabs, or the web pill bar). */
export const BottomTabInset = Platform.select({ ios: 50, android: 80, web: 84 }) ?? 0;
export const MaxContentWidth = 800;
