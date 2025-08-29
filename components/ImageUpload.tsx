import React, { useState } from "react";
import { View, Button, Image, ActivityIndicator, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from "../lib/supabase"; // adjust import as needed

interface ImageUploaderProps {
  listingId?: string;
  isProfile?: boolean;
  onUploadComplete?: (url: string) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  listingId,
  isProfile,
  onUploadComplete,
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Step 1: Pick image and immediately return URI
  const pickImage = async (): Promise<string | null> => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      return uri;
    }
    return null;
  };

  // Helper function to convert image to JPEG if needed
  const ensureJpegFormat = async (uri: string): Promise<string> => {
    try {
      // Convert to JPEG and resize to reasonable dimensions
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1920, height: 1920 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipResult.uri;
    } catch (error) {
      console.warn('Image conversion failed:', error);
      return uri; // Return original if conversion fails
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

      // Ensure user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Error", "You must be logged in to upload images");
        setUploading(false);
        return;
      }

      // Convert image to JPEG if it's not already
      const processedUri = await ensureJpegFormat(imageToUpload);
      
      // Get the blob and detect its real MIME type
      const response = await fetch(processedUri, { cache: "no-store" });
      const blob = await response.blob();
      
      // Use the actual MIME type from the blob
      const fileName = `${Date.now()}.jpg`;
      const filePath = isProfile
        ? `${user.id}/${fileName}`
        : listingId
        ? `${listingId}/${fileName}`
        : `misc/${fileName}`;

      // Upload with correct content type
      const { error: uploadError } = await supabase.storage
        .from(isProfile ? "avatars" : "listing-images")
        .upload(filePath, blob, {
          contentType: blob.type || 'image/jpeg',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from(isProfile ? "listing-images" : "listing-images")
        .getPublicUrl(filePath);

      const publicUrl = data.publicUrl;

      // Save path in DB
      if (listingId) {
        const { error } = await supabase.from("listing_images").insert({
          listing_id: listingId,
          file_path: publicUrl,
          created_at: new Date().toISOString()
        });
        if (error) throw error;
      } else if (isProfile) {
        const { error } = await supabase
          .from("profiles")
          .update({ avatar_url: publicUrl })
          .eq("id", user.id);
        if (error) throw error;
      }

      if (onUploadComplete) onUploadComplete(publicUrl);

      Alert.alert("Success!", "Image uploaded successfully");
      return publicUrl;
    } catch (err: any) {
      console.error("Upload error:", err);
      Alert.alert("Upload failed!", err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Step 3: Pick + upload
  const pickAndUploadImage = async () => {
    const uri = await pickImage();
    if (uri) {
      await uploadImage(uri);
    }
  };

  return (
    <View style={{ alignItems: "center", marginVertical: 20 }}>
      {imageUri && (
        <Image
          source={{ uri: imageUri }}
          style={{
            width: 200,
            height: 200,
            borderRadius: 10,
            marginBottom: 10,
          }}
        />
      )}
      {uploading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <>
          <Button title="Pick Image" onPress={pickImage} />
          <View style={{ height: 10 }} />
          <Button title="Upload Image" onPress={() => uploadImage()} />
          <View style={{ height: 10 }} />
          <Button title="Pick & Upload" onPress={pickAndUploadImage} />
        </>
      )}
    </View>
  );
};

export default ImageUploader;
