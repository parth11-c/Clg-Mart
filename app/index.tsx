import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { Link } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { 
  fontSizes, 
  spacing, 
  responsivePadding, 
  buttonDimensions, 
  shadows,
  isTablet,
  isSmallDevice,
  responsiveValue 
} from '../lib/responsive';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function WelcomePage() {
  return (
    <SafeAreaWrapper style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.background}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>ClgMart</Text>
            <Text style={styles.tagline}>College Marketplace</Text>
          </View>
          
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Buy, sell, and trade with your college community
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <Link href="/auth" asChild>
              <TouchableOpacity style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Get Started</Text>
              </TouchableOpacity>
            </Link>
            
            <Text style={styles.loginPrompt}>
              Already have an account?{' '}
              <Link href="/auth" asChild>
                <Text style={styles.loginLink}>Sign In</Text>
              </Link>
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveValue(20, 40),
    paddingVertical: responsiveValue(20, 40),
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: isTablet ? 600 : '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: responsiveValue(40, 60),
  },
  logo: {
    fontSize: responsiveValue(fontSizes.display, 48),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: responsiveValue(6, 8),
    letterSpacing: -1,
    textAlign: 'center',
  },
  tagline: {
    fontSize: responsiveValue(fontSizes.md, 18),
    color: '#888888',
    fontWeight: '400',
    textAlign: 'center',
  },
  descriptionContainer: {
    marginBottom: responsiveValue(60, 80),
    paddingHorizontal: responsiveValue(10, 20),
  },
  description: {
    fontSize: responsiveValue(fontSizes.lg, 20),
    color: '#cccccc',
    textAlign: 'center',
    lineHeight: responsiveValue(24, 28),
    fontWeight: '300',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: responsiveValue(10, 20),
  },
  primaryButton: {
    backgroundColor: '#ffffff',
    paddingVertical: buttonDimensions.height / 2,
    paddingHorizontal: buttonDimensions.paddingHorizontal,
    borderRadius: buttonDimensions.borderRadius,
    alignItems: 'center',
    width: '100%',
    marginBottom: responsiveValue(20, 24),
    ...shadows.medium,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: responsiveValue(fontSizes.lg, 18),
    fontWeight: '600',
  },
  loginPrompt: {
    fontSize: responsiveValue(fontSizes.md, 16),
    color: '#888888',
    textAlign: 'center',
    lineHeight: responsiveValue(20, 22),
  },
  loginLink: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
