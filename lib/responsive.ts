import { Dimensions, Platform, StatusBar } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Device type detection
export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';
export const isTablet = screenWidth >= 768;
export const isSmallDevice = screenWidth < 375;
export const isLargeDevice = screenWidth > 414;

// Screen dimensions
export const screenDimensions = {
  width: screenWidth,
  height: screenHeight,
  isLandscape: screenWidth > screenHeight,
};

// Responsive breakpoints
export const breakpoints = {
  xs: 320,
  sm: 375,
  md: 414,
  lg: 768,
  xl: 1024,
};

// Responsive spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Responsive font sizes
export const fontSizes = {
  xs: isSmallDevice ? 10 : 12,
  sm: isSmallDevice ? 12 : 14,
  md: isSmallDevice ? 14 : 16,
  lg: isSmallDevice ? 16 : 18,
  xl: isSmallDevice ? 18 : 20,
  xxl: isSmallDevice ? 20 : 24,
  xxxl: isSmallDevice ? 24 : 32,
  display: isSmallDevice ? 32 : 48,
};

// Responsive padding/margin
export const responsivePadding = {
  xs: isSmallDevice ? spacing.xs : spacing.sm,
  sm: isSmallDevice ? spacing.sm : spacing.md,
  md: isSmallDevice ? spacing.md : spacing.lg,
  lg: isSmallDevice ? spacing.lg : spacing.xl,
  xl: isSmallDevice ? spacing.xl : spacing.xxl,
};

// Safe area handling
export const getSafeAreaInsets = () => {
  const statusBarHeight = StatusBar.currentHeight || 0;
  const topInset = isIOS ? 44 : statusBarHeight + 8;
  const bottomInset = isIOS ? 34 : 16;
  
  return {
    top: topInset,
    bottom: bottomInset,
    left: 0,
    right: 0,
  };
};

// Responsive card dimensions
export const cardDimensions = {
  borderRadius: isSmallDevice ? 8 : 12,
  padding: isSmallDevice ? spacing.md : spacing.lg,
  margin: isSmallDevice ? spacing.sm : spacing.md,
};

// Responsive button dimensions
export const buttonDimensions = {
  height: isSmallDevice ? 44 : 48,
  paddingHorizontal: isSmallDevice ? spacing.md : spacing.lg,
  borderRadius: isSmallDevice ? 8 : 12,
};

// Responsive input dimensions
export const inputDimensions = {
  height: isSmallDevice ? 44 : 48,
  paddingHorizontal: isSmallDevice ? spacing.md : spacing.lg,
  borderRadius: isSmallDevice ? 8 : 12,
  fontSize: fontSizes.md,
};

// Responsive image dimensions
export const imageDimensions = {
  thumbnail: isSmallDevice ? 60 : 80,
  card: isSmallDevice ? 160 : 200,
  profile: isSmallDevice ? 80 : 100,
};

// Responsive grid
export const gridConfig = {
  columns: isTablet ? 3 : 2,
  gap: isSmallDevice ? spacing.sm : spacing.md,
  padding: responsivePadding.md,
};

// Responsive navigation
export const navigationConfig = {
  headerHeight: isSmallDevice ? 56 : 64,
  tabBarHeight: isSmallDevice ? 80 : 88,
  backButtonSize: isSmallDevice ? 24 : 28,
};

// Responsive shadows
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Responsive utility functions
export const responsiveValue = <T>(mobile: T, tablet: T): T => {
  return isTablet ? tablet : mobile;
};

export const responsiveArray = <T>(values: T[]): T => {
  if (isSmallDevice) return values[0];
  if (isLargeDevice) return values[2];
  return values[1];
};

// Keyboard avoiding behavior
export const keyboardAvoidingBehavior = Platform.OS === 'ios' ? 'padding' : 'height';

// Status bar configuration
export const statusBarConfig = {
  style: 'light' as const,
  backgroundColor: 'transparent',
  translucent: true,
};
