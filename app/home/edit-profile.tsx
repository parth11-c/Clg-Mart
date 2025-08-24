import React, { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
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
} from '../../lib/responsive';

interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
}

export default function EditProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to edit your profile');
        router.back();
        return;
      }

      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else {
        setProfile(data);
        if (data) {
          setUsername(data.username || '');
          setBio(data.bio || '');
          setAvatarUrl(data.avatar_url || null);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (imageUri: string) => {
    setUploading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const ext = imageUri.split('.').pop();
      const fileName = `avatars/${user.id}/${Date.now()}.${ext}`;

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Error', 'Failed to upload image');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      Alert.alert('Error', 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    Alert.alert(
      'Remove Avatar',
      'Are you sure you want to remove your profile picture?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setAvatarUrl(null);
          }
        }
      ]
    );
  };

  const saveProfile = async () => {
    if (!username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to save your profile');
        return;
      }

      const { error } = await supabase
        .from('public_profiles')
        .upsert({
          id: user.id,
          username: username.trim(),
          bio: bio.trim() || null,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving profile:', error);
        Alert.alert('Error', 'Failed to save profile');
        return;
      }

      Alert.alert(
        'Success!',
        'Your profile has been updated successfully.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaWrapper style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaWrapper>
    );
  }

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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Edit Profile</Text>
          </View>

          <View style={styles.form}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <Text style={styles.sectionTitle}>Profile Picture</Text>
              <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {username.charAt(0).toUpperCase() || '👤'}
                    </Text>
                  </View>
                )}
                {uploading && (
                  <View style={styles.uploadingOverlay}>
                    <ActivityIndicator size="small" color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.avatarHint}>Tap to change photo</Text>
              {avatarUrl && (
                <TouchableOpacity style={styles.removeAvatarButton} onPress={removeAvatar}>
                  <Text style={styles.removeAvatarText}>Remove Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Username */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your username"
                value={username}
                onChangeText={setUsername}
                placeholderTextColor="#666"
                maxLength={30}
              />
            </View>

            {/* Bio */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about yourself..."
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#666"
                maxLength={200}
              />
              <Text style={styles.charCount}>{bio.length}/200</Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.button, saving && styles.buttonDisabled]}
              onPress={saveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.buttonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: responsiveValue(fontSizes.md, 16),
    marginTop: responsiveValue(12, 16),
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: responsiveValue(16, 20),
    paddingVertical: responsiveValue(16, 20),
    minHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: responsiveValue(24, 30),
  },
  backButton: {
    marginRight: responsiveValue(12, 15),
    paddingVertical: responsiveValue(4, 6),
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: responsiveValue(fontSizes.md, 16),
  },
  title: {
    fontSize: responsiveValue(fontSizes.xl, 24),
    fontWeight: '600',
    color: '#ffffff',
  },
  form: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: responsiveValue(24, 30),
  },
  sectionTitle: {
    fontSize: responsiveValue(fontSizes.md, 16),
    fontWeight: '500',
    color: '#cccccc',
    marginBottom: responsiveValue(12, 16),
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: responsiveValue(6, 8),
  },
  avatar: {
    width: responsiveValue(80, 100),
    height: responsiveValue(80, 100),
    borderRadius: responsiveValue(40, 50),
  },
  avatarPlaceholder: {
    width: responsiveValue(80, 100),
    height: responsiveValue(80, 100),
    borderRadius: responsiveValue(40, 50),
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: responsiveValue(32, 40),
    color: '#ffffff',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: responsiveValue(40, 50),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarHint: {
    fontSize: responsiveValue(fontSizes.xs, 12),
    color: '#888888',
  },
  removeAvatarButton: {
    marginTop: responsiveValue(6, 8),
    paddingVertical: responsiveValue(6, 8),
    paddingHorizontal: responsiveValue(12, 16),
    backgroundColor: '#ff4444',
    borderRadius: responsiveValue(4, 6),
    alignItems: 'center',
    ...shadows.small,
  },
  removeAvatarText: {
    color: '#ffffff',
    fontSize: responsiveValue(fontSizes.sm, 14),
    fontWeight: '500',
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
  textArea: {
    height: responsiveValue(80, 100),
    paddingTop: inputDimensions.height / 2,
  },
  charCount: {
    fontSize: responsiveValue(fontSizes.xs, 12),
    color: '#888888',
    textAlign: 'right',
    marginTop: responsiveValue(2, 4),
  },
  button: {
    backgroundColor: '#ffffff',
    borderRadius: buttonDimensions.borderRadius,
    paddingVertical: buttonDimensions.height / 2,
    alignItems: 'center',
    marginTop: responsiveValue(16, 20),
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
});
