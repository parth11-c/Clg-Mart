# Responsive Design System

This document outlines the comprehensive responsive design system implemented across the ClgMart app to ensure optimal user experience across all device sizes, orientations, and notches.

## Overview

The responsive design system provides:
- **Device Detection**: Automatic detection of iOS/Android, tablet/mobile, and screen sizes
- **Safe Area Handling**: Proper handling of notches, status bars, and safe areas
- **Responsive Dimensions**: Adaptive spacing, fonts, and component sizes
- **Orientation Support**: Landscape and portrait mode optimization
- **Consistent Patterns**: Standardized responsive design patterns

## Core Files

### 1. `lib/responsive.ts`
The main responsive utilities file containing:
- Device type detection functions
- Responsive breakpoints and spacing scales
- Font size scales
- Component dimension configurations
- Shadow and elevation presets

### 2. `components/SafeAreaWrapper.tsx`
A wrapper component that handles safe areas consistently across devices.

## Device Detection

```typescript
import { isIOS, isAndroid, isTablet, isSmallDevice, isLargeDevice } from '../lib/responsive';

// Usage examples
if (isIOS) {
  // iOS-specific logic
}

if (isTablet) {
  // Tablet-specific layout
}

if (isSmallDevice) {
  // Small screen optimizations
}
```

## Responsive Values

### Basic Responsive Values
```typescript
import { responsiveValue } from '../lib/responsive';

// Mobile vs Tablet values
const padding = responsiveValue(16, 24); // 16 for mobile, 24 for tablet
const fontSize = responsiveValue(14, 18); // 14 for mobile, 18 for tablet
```

### Responsive Arrays
```typescript
import { responsiveArray } from '../lib/responsive';

// Small, Medium, Large device values
const spacing = responsiveArray([8, 16, 24]); // 8, 16, or 24 based on device
```

## Spacing System

```typescript
import { spacing, responsivePadding } from '../lib/responsive';

// Standard spacing scale
const margin = spacing.md; // 16px

// Responsive padding
const containerPadding = responsivePadding.lg; // Adaptive based on device
```

## Font Sizes

```typescript
import { fontSizes } from '../lib/responsive';

// Responsive font sizes
const titleSize = fontSizes.display; // 32px on small, 48px on large
const bodySize = fontSizes.md; // 14px on small, 16px on large
```

## Component Dimensions

### Buttons
```typescript
import { buttonDimensions } from '../lib/responsive';

const buttonStyle = {
  height: buttonDimensions.height, // 44px on small, 48px on large
  paddingHorizontal: buttonDimensions.paddingHorizontal,
  borderRadius: buttonDimensions.borderRadius,
};
```

### Inputs
```typescript
import { inputDimensions } from '../lib/responsive';

const inputStyle = {
  height: inputDimensions.height,
  paddingHorizontal: inputDimensions.paddingHorizontal,
  borderRadius: inputDimensions.borderRadius,
  fontSize: inputDimensions.fontSize,
};
```

### Cards
```typescript
import { cardDimensions } from '../lib/responsive';

const cardStyle = {
  borderRadius: cardDimensions.borderRadius,
  padding: cardDimensions.padding,
  margin: cardDimensions.margin,
};
```

## Shadows and Elevation

```typescript
import { shadows } from '../lib/responsive';

// Small shadow for subtle elevation
const subtleShadow = shadows.small;

// Medium shadow for cards
const cardShadow = shadows.medium;

// Large shadow for modals
const modalShadow = shadows.large;
```

## Safe Area Handling

### Using SafeAreaWrapper
```typescript
import SafeAreaWrapper from '../components/SafeAreaWrapper';

export default function MyScreen() {
  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        {/* Your content */}
      </View>
    </SafeAreaWrapper>
  );
}
```

### Custom Safe Area Control
```typescript
import SafeAreaWrapper from '../components/SafeAreaWrapper';

export default function MyScreen() {
  return (
    <SafeAreaWrapper 
      top={true}      // Include top safe area
      bottom={false}  // Exclude bottom safe area
      left={true}     // Include left safe area
      right={true}    // Include right safe area
    >
      <View style={styles.container}>
        {/* Your content */}
      </View>
    </SafeAreaWrapper>
  );
}
```

## Keyboard Handling

```typescript
import { keyboardAvoidingBehavior } from '../lib/responsive';

import { KeyboardAvoidingView } from 'react-native';

export default function MyForm() {
  return (
    <KeyboardAvoidingView behavior={keyboardAvoidingBehavior}>
      {/* Your form content */}
    </KeyboardAvoidingView>
  );
}
```

## Grid System

```typescript
import { gridConfig } from '../lib/responsive';

const gridStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: gridConfig.gap,
  padding: gridConfig.padding,
};

// Grid columns automatically adjust based on device
// Mobile: 2 columns, Tablet: 3 columns
```

## Image Dimensions

```typescript
import { imageDimensions } from '../lib/responsive';

const imageStyle = {
  width: imageDimensions.thumbnail,  // 60px on small, 80px on large
  height: imageDimensions.thumbnail,
};

const cardImageStyle = {
  width: imageDimensions.card,       // 160px on small, 200px on large
  height: imageDimensions.card,
};
```

## Best Practices

### 1. Always Use Responsive Values
```typescript
// ❌ Don't use hardcoded values
const styles = StyleSheet.create({
  container: {
    padding: 20,        // Hardcoded
    fontSize: 16,       // Hardcoded
  }
});

// ✅ Use responsive values
const styles = StyleSheet.create({
  container: {
    padding: responsiveValue(16, 20),
    fontSize: fontSizes.md,
  }
});
```

### 2. Use SafeAreaWrapper for All Screens
```typescript
// ❌ Don't skip safe area handling
export default function MyScreen() {
  return (
    <View style={styles.container}>
      {/* Content */}
    </View>
  );
}

// ✅ Always wrap with SafeAreaWrapper
export default function MyScreen() {
  return (
    <SafeAreaWrapper>
      <View style={styles.container}>
        {/* Content */}
      </View>
    </SafeAreaWrapper>
  );
}
```

### 3. Test on Multiple Devices
- Test on small phones (iPhone SE, small Android)
- Test on standard phones (iPhone 14, Pixel)
- Test on large phones (iPhone 14 Pro Max, large Android)
- Test on tablets (iPad, Android tablets)
- Test in both orientations

### 4. Use Consistent Spacing
```typescript
// ❌ Inconsistent spacing
const styles = StyleSheet.create({
  section: {
    marginBottom: 20,
    padding: 16,
  },
  card: {
    marginBottom: 24,  // Different from section
    padding: 20,        // Different from section
  }
});

// ✅ Consistent spacing using the system
const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.lg,  // Same as section
    padding: spacing.md,        // Same as section
  }
});
```

## Breakpoints

The system uses these breakpoints:
- **xs**: 320px (small phones)
- **sm**: 375px (standard phones)
- **md**: 414px (large phones)
- **lg**: 768px (tablets)
- **xl**: 1024px (large tablets)

## Performance Considerations

- Responsive values are calculated once at app startup
- No runtime calculations for responsive dimensions
- Safe area insets are cached and reused
- Minimal performance impact from responsive system

## Future Enhancements

- Dark/Light mode support
- Accessibility scaling
- Custom breakpoint definitions
- Animation-aware responsive changes
- Server-side responsive image optimization

## Troubleshooting

### Common Issues

1. **Safe areas not working**: Ensure SafeAreaProvider is at the root level
2. **Responsive values not updating**: Check that responsive.ts is imported correctly
3. **Layout breaking on small devices**: Use responsiveValue for critical dimensions
4. **Keyboard covering content**: Use KeyboardAvoidingView with keyboardAvoidingBehavior

### Debug Mode

Enable debug logging to see responsive values:
```typescript
// Add to your component for debugging
console.log('Device info:', {
  isIOS,
  isAndroid,
  isTablet,
  isSmallDevice,
  isLargeDevice,
  screenDimensions
});
```

## Examples

See the following files for complete responsive implementations:
- `app/index.tsx` - Welcome screen
- `app/auth.tsx` - Authentication screen
- `app/home/index.tsx` - Home screen
- `app/home/profile.tsx` - Profile screen
- `app/home/create-listing.tsx` - Create listing screen
- `components/ListingCard.tsx` - Listing card component
- `components/CategoryPicker.tsx` - Category picker
- `components/ConditionPicker.tsx` - Condition picker
