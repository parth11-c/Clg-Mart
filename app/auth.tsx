import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../lib/supabase';
import SafeAreaWrapper from '../components/SafeAreaWrapper';
import { 
  fontSizes, 
  spacing, 
  responsivePadding, 
  buttonDimensions, 
  inputDimensions,
  shadows,
  isTablet,
  isSmallDevice,
  responsiveValue,
  keyboardAvoidingBehavior
} from '../lib/responsive';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        
        if (error) {
          console.error('Sign up error:', error);
          throw error;
        }
        
        if (data?.user && !data?.session) {
          Alert.alert(
            'Success!', 
            'Account created successfully! Please check your email to verify your account before signing in.',
            [{ text: 'OK', onPress: () => setIsSignUp(false) }]
          );
        } else if (data?.session) {
          // User is automatically signed in
          router.replace('/home');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          console.error('Sign in error:', error);
          throw error;
        }
        
        if (data?.session) {
          router.replace('/home');
        } else {
          throw new Error('No session created after sign in');
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      let errorMessage = 'An unexpected error occurred. Please try again.';
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  return (
    <SafeAreaWrapper style={styles.container}>
      <StatusBar style="light" />
      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={keyboardAvoidingBehavior}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logo}>ClgMart</Text>
            <Text style={styles.title}>
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.subtitle}>
              {isSignUp 
                ? 'Join the college marketplace' 
                : 'Sign in to your account'
              }
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor="#666"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  placeholderTextColor="#666"
                />
                <TouchableOpacity 
                  style={styles.eyeButton} 
                  onPress={togglePasswordVisibility}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {isSignUp && (
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    placeholderTextColor="#666"
                  />
                  <TouchableOpacity 
                    style={styles.eyeButton} 
                    onPress={toggleConfirmPasswordVisibility}
                  >
                    <Text style={styles.eyeIcon}>{showConfirmPassword ? '👁️' : '👁️‍🗨️'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.buttonText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity onPress={() => setIsSignUp(!isSignUp)}>
              <Text style={styles.linkText}>
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </Text>
            </TouchableOpacity>
          </View>

          <Link href="/" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          </Link>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: responsiveValue(24, 32),
    paddingVertical: responsiveValue(20, 40),
    minHeight: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: responsiveValue(32, 48),
  },
  logo: {
    fontSize: responsiveValue(fontSizes.xxxl, 32),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: responsiveValue(16, 24),
    letterSpacing: -1,
    textAlign: 'center',
  },
  title: {
    fontSize: responsiveValue(fontSizes.xl, 24),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: responsiveValue(6, 8),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: responsiveValue(fontSizes.md, 16),
    color: '#888888',
    textAlign: 'center',
    lineHeight: responsiveValue(20, 22),
    paddingHorizontal: responsiveValue(10, 20),
  },
  form: {
    marginBottom: responsiveValue(24, 32),
  },
  inputContainer: {
    marginBottom: responsiveValue(16, 20),
  },
  inputLabel: {
    fontSize: responsiveValue(fontSizes.sm, 14),
    fontWeight: '500',
    color: '#cccccc',
    marginBottom: responsiveValue(6, 8),
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: inputDimensions.borderRadius,
    paddingHorizontal: inputDimensions.paddingHorizontal,
    paddingVertical: inputDimensions.height / 2,
    fontSize: inputDimensions.fontSize,
    color: '#ffffff',
    ...shadows.small,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: inputDimensions.borderRadius,
    ...shadows.small,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: inputDimensions.paddingHorizontal,
    paddingVertical: inputDimensions.height / 2,
    fontSize: inputDimensions.fontSize,
    color: '#ffffff',
  },
  eyeButton: {
    paddingHorizontal: responsiveValue(12, 16),
    paddingVertical: inputDimensions.height / 2,
  },
  eyeIcon: {
    fontSize: responsiveValue(16, 18),
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: buttonDimensions.borderRadius,
    paddingVertical: buttonDimensions.height / 2,
    alignItems: 'center',
    marginTop: responsiveValue(6, 8),
    ...shadows.medium,
  },
  buttonDisabled: {
    backgroundColor: '#333333',
  },
  buttonText: {
    color: '#000000',
    fontSize: responsiveValue(fontSizes.md, 16),
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsiveValue(24, 32),
    flexWrap: 'wrap',
  },
  footerText: {
    color: '#888888',
    fontSize: responsiveValue(fontSizes.sm, 14),
    textAlign: 'center',
  },
  linkText: {
    color: '#ffffff',
    fontSize: responsiveValue(fontSizes.sm, 14),
    fontWeight: '600',
    marginLeft: responsiveValue(2, 4),
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: responsiveValue(6, 8),
  },
  backButtonText: {
    color: '#888888',
    fontSize: responsiveValue(fontSizes.sm, 14),
  },
});

