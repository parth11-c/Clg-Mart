import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import SafeAreaWrapper from '../../../components/SafeAreaWrapper';
import { fontSizes, responsiveValue } from '../../../lib/responsive';

export default function MessagesLayout() {
  return (
    <SafeAreaWrapper>
      <StatusBar style="light" />
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: '#000000' } 
      }} />
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
