import { DefaultTheme } from 'react-native-paper';

// Define custom colors 
const northlandColors = {
  primary: '#007AFF', // Keep default blue as primary for now
  accent: '#555555',  // Slightly lighter gray for accent/secondary elements
  background: '#F5F5F5', // Light gray background
  surface: '#FFFFFF', // Keep card/surface background white
  text: '#1C1C1E', // Slightly darker text for better contrast on light gray?
  placeholder: '#888888',
  disabled: '#CCCCCC',
  error: '#B00020',
  // Add more as needed: onPrimary, onSurface, etc.
};

export const theme = {
  ...DefaultTheme, // Start with the default theme
  colors: {
    ...DefaultTheme.colors, // Inherit default colors
    // Override with custom colors
    primary: northlandColors.primary,
    accent: northlandColors.accent, // Note: 'accent' might be deprecated in favor of secondary/tertiary in newer Paper versions
    background: northlandColors.background,
    surface: northlandColors.surface,
    text: northlandColors.text,
    placeholder: northlandColors.placeholder,
    disabled: northlandColors.disabled,
    error: northlandColors.error,
    // You might need to define onSurface, onPrimary etc. if you change background/primary significantly
    // Example: onSurface: northlandColors.text, 
  },
  // You can also customize fonts, roundness, etc. here
  // roundness: 4, 
  // fonts: configureFonts({ ... }), 
};

// Type definition for your custom theme (optional but good practice)
export type AppTheme = typeof theme;
