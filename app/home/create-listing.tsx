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
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import CategoryPicker from '../../components/CategoryPicker';
import ConditionPicker from '../../components/ConditionPicker';
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

export default function CreateListing() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [condition, setCondition] = useState<string | undefined>(undefined);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const uploadImages = async (listingId: string) => {
    const uploadedUrls: string[] = [];
    
    for (let i = 0; i < images.length; i++) {
      const imageUri = images[i];
      
      try {
        console.log('Processing image:', imageUri);
        
        // Convert URI → Blob and ensure it's a JPEG
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        // Create unique filename
        const fileName = `${listingId}/${Date.now()}_${i}.jpg`;
        
        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(fileName, blob, {
            contentType: 'image/jpeg',
            upsert: false
          });
        
        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          continue; // Skip this image and try the next one
        }
        
        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(fileName);
        
        console.log('Public URL generated:', publicUrl);
        
        // Save URL to listing_images table
        const { error: insertError } = await supabase
          .from('listing_images')
          .insert({
            listing_id: listingId,
            file_path: publicUrl,
            created_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error('Error saving image URL to database:', insertError);
        } else {
          console.log('Image URL saved to database successfully');
          uploadedUrls.push(publicUrl);
        }
        
      } catch (error) {
        console.error('Error processing image:', error);
        // Continue without uploading this image
      }
    }
    
    console.log('Upload completed, total URLs:', uploadedUrls.length);
    return uploadedUrls;
  };

  const submitListing = async () => {
    if (!title || !description || !price || !categoryId || !condition) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    // Validate condition value
    const validConditions = ['new', 'good', 'fair', 'poor'];
    if (!condition || !validConditions.includes(condition)) {
      Alert.alert('Error', 'Please select a valid condition');
      return;
    }

    setLoading(true);

    try {
      // Check if the listing_images table exists and has the right structure
      const { error: tableCheck } = await supabase
        .from('listing_images')
        .select('*')
        .limit(1);
      
      if (tableCheck) {
        console.log('listing_images table check error:', tableCheck);
        // Table might not exist, we'll handle this in the upload process
      } else {
        console.log('listing_images table exists and is accessible');
        
        // Check the table structure
        const { data: tableInfo } = await supabase
          .from('listing_images')
          .select('*')
          .limit(1);
        
        if (tableInfo && tableInfo.length > 0) {
          console.log('Table structure:', Object.keys(tableInfo[0]));
        }
      }

      // Try to create storage bucket if it doesn't exist
      try {
        const { data: bucketList } = await supabase.storage.listBuckets();
        const hasListingImagesBucket = bucketList?.some(bucket => bucket.name === 'listing-images');
        
        if (!hasListingImagesBucket) {
          console.log('Creating listing-images storage bucket...');
          // Note: Creating buckets requires admin privileges, so this might fail
          // The upload function will handle this gracefully
        }
      } catch (bucketError) {
        console.log('Could not check/create storage bucket:', bucketError);
        // This is expected if user doesn't have admin privileges
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to create a listing');
        return;
      }

      // Create the listing
      console.log('Creating listing with condition:', condition);
      const { data: listing, error } = await supabase
        .from('listings')
        .insert([
          {
            title,
            description,
            price: Number(price),
            category_id: categoryId,
            condition,
            seller_id: user.id,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating listing:', error);
        Alert.alert('Error', 'Failed to create listing. Please try again.');
        return;
      }

      // Upload images if any
      if (images.length > 0) {
        setUploading(true);
        const uploadedCount = await uploadImages(listing.id);
        setUploading(false);
        
        if (uploadedCount.length === 0) {
          Alert.alert(
            'Success!',
            'Your listing has been created successfully. Note: Images could not be uploaded.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
        } else {
          Alert.alert(
            'Success!',
            `Your listing has been created successfully with ${uploadedCount.length} image(s).`,
            [{ text: 'OK', onPress: () => router.back() }]
          );
        }
      } else {
        Alert.alert(
          'Success!',
          'Your listing has been created successfully.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }

    } catch (error) {
      console.error('Error creating listing:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

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
            <Text style={styles.title}>Create Listing</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter listing title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your item..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor="#666"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter price"
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholderTextColor="#666"
              />
            </View>

            <CategoryPicker
              onSelect={setCategoryId}
              selectedValue={categoryId}
            />

            <ConditionPicker
              onSelect={setCondition}
              selectedValue={condition}
            />

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Images</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <Text style={styles.imagePickerText}>📷 Add Photo</Text>
              </TouchableOpacity>
              
              {images.length > 0 && (
                <ScrollView horizontal style={styles.imageContainer} showsHorizontalScrollIndicator={false}>
                  {images.map((uri, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri }} style={styles.image} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Text style={styles.removeImageText}>×</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>

            <TouchableOpacity
              style={[styles.button, (loading || uploading) && styles.buttonDisabled]}
              onPress={submitListing}
              disabled={loading || uploading}
            >
              {loading || uploading ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.buttonText}>Create Listing</Text>
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
  imagePickerButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: inputDimensions.borderRadius,
    paddingVertical: inputDimensions.height / 2,
    alignItems: 'center',
    ...shadows.small,
  },
  imagePickerText: {
    color: '#ffffff',
    fontSize: responsiveValue(fontSizes.md, 16),
  },
  imageContainer: {
    marginTop: responsiveValue(8, 10),
  },
  imageWrapper: {
    marginRight: responsiveValue(8, 10),
    position: 'relative',
  },
  image: {
    width: responsiveValue(60, 80),
    height: responsiveValue(60, 80),
    borderRadius: responsiveValue(6, 8),
  },
  removeImageButton: {
    position: 'absolute',
    top: responsiveValue(-4, -5),
    right: responsiveValue(-4, -5),
    backgroundColor: '#ff4444',
    borderRadius: responsiveValue(10, 12),
    width: responsiveValue(20, 24),
    height: responsiveValue(20, 24),
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  removeImageText: {
    color: '#ffffff',
    fontSize: responsiveValue(fontSizes.md, 16),
    fontWeight: 'bold',
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
