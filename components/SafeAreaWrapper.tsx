import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { responsiveValue, spacing } from '../lib/responsive';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
  padding?: boolean;
}

export default function SafeAreaWrapper({
  children,
  style,
  top = true,
  bottom = true,
  left = true,
  right = true,
  padding = true,
}: SafeAreaWrapperProps) {
  const insets = useSafeAreaInsets();

  const safeAreaStyle: ViewStyle = {
    paddingTop: top ? (insets.top > 0 ? insets.top : spacing.md) : 0,
    paddingBottom: bottom ? (insets.bottom > 0 ? insets.bottom : spacing.md) : 0,
    paddingLeft: left ? (insets.left > 0 ? insets.left : spacing.md) : 0,
    paddingRight: right ? (insets.right > 0 ? insets.right : spacing.md) : 0,
  };

  return (
    <View style={[styles.container, safeAreaStyle, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
