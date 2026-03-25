// Default colors - these can be overridden by company branding
export const colors = {
  // Primary - will be replaced by company.baseColor
  primary: '#5D2417',
  primaryLight: '#7D4437',
  primaryDark: '#3D1407',

  // Neutral
  white: '#FFFFFF',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  border: '#E0E0E0',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#666666',
  textMuted: '#999999',
  textOnPrimary: '#FFFFFF',

  // Status
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
}

// Generate color variants from a base color
export const generateColorPalette = (baseColor: string) => {
  return {
    ...colors,
    primary: baseColor,
    // Simple lightening/darkening - could be improved with proper color manipulation
    primaryLight: baseColor,
    primaryDark: baseColor,
  }
}
