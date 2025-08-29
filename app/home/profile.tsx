import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { 
  fontSizes, 
  spacing, 
  responsivePadding, 
  buttonDimensions, 
  shadows,
  isTablet,
  isSmallDevice,
  responsiveValue 
} from '../../lib/responsive';

interface User {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export default function ProfileTab() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    fetchProfile();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        throw error;
      }
      
      if (user) {
        setUser({
          id: user.id,
          email: user.email || '',
        });
      } else {
        router.replace('/');
      }
    } catch (error: any) {
      console.error('Error checking user:', error);
      router.replace('/');
    }
  };

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.auth.signOut();
              if (error) {
                console.error('Sign out error:', error);
                throw error;
              }
              router.replace('/');
            } catch (error: any) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (!user || loading) {
    return (
      <SafeAreaWrapper style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Info */}
        <View style={styles.section}>
          <View style={styles.userCard}>
            <View style={styles.avatarPlaceholder}>
              {profile?.avatar_url ? (
                <Text style={styles.avatarText}>👤</Text>
              ) : (
                <Text style={styles.avatarText}>
                  {profile?.username?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </Text>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {profile?.username || 'Student'}
              </Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              {profile?.bio && (
                <Text style={styles.userBio}>{profile.bio}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity 
              style={styles.settingCard}
              onPress={() => router.push('/home/edit-profile')}
            >
              <Text style={styles.settingIcon}>👤</Text>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Edit Profile</Text>
                <Text style={styles.settingSubtitle}>Update your information</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingCard}>
              <Text style={styles.settingIcon}>🔒</Text>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Privacy</Text>
                <Text style={styles.settingSubtitle}>Manage your privacy settings</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingCard}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingSubtitle}>Configure notification preferences</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* My Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Activity</Text>
          <View style={styles.activityGrid}>
            <TouchableOpacity style={styles.activityCard}>
              <Text style={styles.activityIcon}>📦</Text>
              <Text style={styles.activityTitle}>My Listings</Text>
              <Text style={styles.activityCount}>5 items</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.activityCard}>
              <Text style={styles.activityIcon}>❤️</Text>
              <Text style={styles.activityTitle}>Favorites</Text>
              <Text style={styles.activityCount}>12 items</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.activityCard}>
              <Text style={styles.activityIcon}>📊</Text>
              <Text style={styles.activityTitle}>Analytics</Text>
              <Text style={styles.activityCount}>View stats</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.activityCard}>
              <Text style={styles.activityIcon}>📝</Text>
              <Text style={styles.activityTitle}>Reviews</Text>
              <Text style={styles.activityCount}>8 reviews</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Support & Legal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Legal</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingCard}>
              <Text style={styles.settingIcon}>❓</Text>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Help & Support</Text>
                <Text style={styles.settingSubtitle}>Get help with the app</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingCard}>
              <Text style={styles.settingIcon}>📄</Text>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Terms of Service</Text>
                <Text style={styles.settingSubtitle}>Read our terms</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingCard}>
              <Text style={styles.settingIcon}>🔒</Text>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Privacy Policy</Text>
                <Text style={styles.settingSubtitle}>Read our privacy policy</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    fontSize: responsiveValue(fontSizes.md, 16),
    color: '#888888',
  },
  header: {
    paddingHorizontal: responsiveValue(20, 24),
    paddingTop: responsiveValue(20, 24),
    paddingBottom: responsiveValue(20, 24),
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  title: {
    fontSize: responsiveValue(fontSizes.xl, 24),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: responsiveValue(2, 4),
  },
  subtitle: {
    fontSize: responsiveValue(fontSizes.md, 16),
    color: '#888888',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: responsiveValue(20, 24),
  },
  section: {
    paddingHorizontal: responsiveValue(20, 24),
    paddingVertical: responsiveValue(20, 24),
  },
  userCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: responsiveValue(10, 12),
    padding: responsiveValue(16, 20),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    ...shadows.small,
  },
  avatarPlaceholder: {
    width: responsiveValue(50, 60),
    height: responsiveValue(50, 60),
    backgroundColor: '#333333',
    borderRadius: responsiveValue(25, 30),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveValue(12, 16),
  },
  avatarText: {
    fontSize: responsiveValue(20, 24),
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: responsiveValue(fontSizes.lg, 18),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: responsiveValue(2, 4),
  },
  userEmail: {
    fontSize: responsiveValue(fontSizes.sm, 14),
    color: '#888888',
  },
  userBio: {
    fontSize: responsiveValue(fontSizes.xs, 12),
    color: '#cccccc',
    marginTop: responsiveValue(2, 4),
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: responsiveValue(fontSizes.lg, 18),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: responsiveValue(12, 16),
  },
  settingsList: {
    gap: responsiveValue(10, 12),
  },
  settingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: responsiveValue(10, 12),
    padding: responsiveValue(12, 16),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    ...shadows.small,
  },
  settingIcon: {
    fontSize: responsiveValue(18, 20),
    marginRight: responsiveValue(10, 12),
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: responsiveValue(fontSizes.md, 16),
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: responsiveValue(1, 2),
  },
  settingSubtitle: {
    fontSize: responsiveValue(fontSizes.xs, 12),
    color: '#888888',
  },
  settingArrow: {
    fontSize: responsiveValue(16, 18),
    color: '#888888',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  activityCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: responsiveValue(10, 12),
    padding: responsiveValue(12, 16),
    width: '48%',
    alignItems: 'center',
    marginBottom: responsiveValue(10, 12),
    borderWidth: 1,
    borderColor: '#333333',
    ...shadows.small,
  },
  activityIcon: {
    fontSize: responsiveValue(20, 24),
    marginBottom: responsiveValue(6, 8),
  },
  activityTitle: {
    fontSize: responsiveValue(fontSizes.sm, 14),
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: responsiveValue(2, 4),
  },
  activityCount: {
    fontSize: responsiveValue(fontSizes.xs, 12),
    color: '#888888',
  },
  signOutButton: {
    backgroundColor: '#ff3b30',
    borderRadius: responsiveValue(10, 12),
    paddingVertical: buttonDimensions.height / 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ff3b30',
    ...shadows.medium,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: responsiveValue(fontSizes.md, 16),
    fontWeight: '600',
  },
});
