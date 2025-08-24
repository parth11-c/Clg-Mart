import React, { useState } from "react";
import { View, Button, Image, ActivityIndicator, Alert, StyleSheet, TouchableOpacity, Text } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";

interface ImageUploadProps {
  onUploadComplete?: (url: string) => void;
  bucket?: string;
  path?: string;
  showPreview?: boolean;
  buttonStyle?: "default" | "modern";
  listingId?: string; // For listing images
  isProfile?: boolean; // For profile avatar
}

export default function ImageUpload({
  onUploadComplete,
  bucket = "avatars",
  path = "uploads",
  showPreview = true,
  buttonStyle = "default",
  listingId,
  isProfile = false,
}: ImageUploadProps) {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Step 1: Pick image from gallery
  const pickImage = async () => {
    try {
      // Request permission if needed
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: isProfile ? [1, 1] : [4, 3],
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        if (buttonStyle === "modern") {
          // Auto upload when using modern style
          uploadImage(result.assets[0].uri);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Step 2: Upload image to Supabase storage
  const uploadImage = async (uri?: string) => {
    try {
      const imageToUpload = uri || imageUri;
      if (!imageToUpload) {
        Alert.alert("Please select an image first!");
        return;
      }
      setUploading(true);

      // Get current user for path organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user && (isProfile || listingId)) {
        Alert.alert("Error", "You must be logged in to upload images");
        setUploading(false);
        return null;
      }

      // Generate a unique file name
      const fileExt = imageToUpload.split(".").pop()?.toLowerCase() || 'jpg';
      let fileName;
      let filePath;

      if (isProfile) {
        // For profile avatars
        fileName = `${user?.id}/${Date.now()}.${fileExt}`;
        filePath = fileName;
      } else if (listingId) {
        // For listing images
        fileName = `${listingId}/${Date.now()}.${fileExt}`;
        filePath = fileName;
      } else {
        // Generic uploads
        fileName = `${Date.now()}.${fileExt}`;
        filePath = `${path}/${fileName}`;
      }

      // Convert to blob
      const response = await fetch(imageToUpload);
      const blob = await response.blob();

      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;
      
      // If this is a listing image, save to listing_images table
      if (listingId) {
        const { error: insertError } = await supabase
          .from('listing_images')
          .insert([{ listing_id: listingId, file_path: publicUrl }]);
        
        if (insertError) {
          console.error('Error saving image URL to database:', insertError);
          Alert.alert("Warning", "Image uploaded but not linked to listing");
        }
      }
      
      // If this is a profile image, update the profile
      if (isProfile && user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('Error updating profile with avatar URL:', updateError);
        }
      }
      
      // Call the callback with the URL if provided
      if (onUploadComplete) {
        onUploadComplete(publicUrl);
      }

      if (buttonStyle === "default") {
        Alert.alert("Success!", "Image uploaded successfully");
      }
      console.log("Public URL:", publicUrl);
      return publicUrl;
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Upload failed!", error.message || "An error occurred during upload");
      return null;
    } finally {
      setUploading(false);
    }
  };

  if (buttonStyle === "modern") {
    return (
      <View style={styles.modernContainer}>
        <TouchableOpacity 
          style={styles.modernButton} 
          onPress={pickImage}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.modernButtonIcon}>📷</Text>
              <Text style={styles.modernButtonText}>
                {imageUri ? "Change Image" : "Select Image"}
              </Text>
            </>
          )}
        </TouchableOpacity>
        
        {showPreview && imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.modernPreview}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Button title="Pick Image" onPress={pickImage} />
      
      {showPreview && imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={styles.preview}
        />
      )}
      
      {uploading ? (
        <ActivityIndicator size="large" color="#0000ff" style={styles.loader} />
      ) : (
        <Button 
          title="Upload Image" 
          onPress={() => uploadImage()} 
          disabled={!imageUri}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  preview: {
    width: 200,
    height: 200,
    marginVertical: 15,
    borderRadius: 10,
  },
  loader: {
    marginVertical: 15,
  },
  modernContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  modernButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  modernButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  modernButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  modernPreview: {
    width: 250,
    height: 250,
    borderRadius: 12,
    marginBottom: 15,
  }
});