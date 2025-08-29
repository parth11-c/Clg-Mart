import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { supabase } from '../../../lib/supabase';
import { messagingService } from '../../../lib/messagingService';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  created_at: string;
  seller: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  category: {
    name: string;
  };
  listing_images?: {
    file_path: string;
  }[];
}

const { width } = Dimensions.get('window');

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
    color: '#ffffff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#333333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  imageContainer: {
    height: width,
    backgroundColor: '#1a1a1a',
  },
  image: {
    width: width,
    height: width,
    resizeMode: 'cover',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: width,
    height: width,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 64,
    color: '#666666',
    marginBottom: 8,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#888888',
  },
  content: {
    padding: 20,
    backgroundColor: '#0a0a0a',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    lineHeight: 32,
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 24,
  },
  metadata: {
    marginBottom: 24,
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metadataLabel: {
    fontSize: 14,
    color: '#888888',
  },
  metadataValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 24,
    marginBottom: 24,
  },
  sellerInfo: {
    marginBottom: 24,
  },
  sellerProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  sellerAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sellerAvatarText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  messageButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
  },
  editButton: {
    backgroundColor: '#333333',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  }
});

const getConditionLabel = (condition: string) => {
  const conditions: { [key: string]: string } = {
    new: 'New',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
  };
  return conditions[condition] || condition;
};

export default function ListingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    if (id) {
      fetchListing();
      checkCurrentUser();
    }
  }, [id]);

  const fetchListing = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching listing:', error);
        // Fallback to listings_feed
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('listings_feed')
          .select('*')
          .eq('id', id)
          .single();

        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
          Alert.alert('Error', 'Failed to load listing');
          return;
        }
        
        setListing(fallbackData);
      } else {
        // Fetch additional data
        try {
          // Fetch images
          const { data: images } = await supabase
            .from('listing_images')
            .select('file_path')
            .eq('listing_id', data.id);

          // Fetch seller info
          const { data: seller } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .eq('id', data.seller_id)
            .single();

          // Fetch category info
          const { data: category } = await supabase
            .from('categories')
            .select('name')
            .eq('id', data.category_id)
            .single();
          
          const enrichedListing = {
            ...data,
            listing_images: images?.map(img => ({ file_path: img.file_path })) || [],
            seller: seller || { id: data.seller_id, username: 'Unknown User' },
            category: category || { name: 'Unknown Category' }
          };
          
          setListing(enrichedListing);
        } catch (additionalError) {
          console.log('Error fetching additional data, using basic listing:', additionalError);
          setListing({
            ...data,
            listing_images: [],
            seller: { id: data.seller_id, username: 'Unknown User' },
            category: { name: 'Unknown Category' }
          });
        }
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
      Alert.alert('Error', 'Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      // Check if user is owner after both user and listing are loaded
      if (user && listing) {
        setIsOwner(user.id === listing.seller?.id);
      }
    } catch (error) {
      console.error('Error checking current user:', error);
    }
  };

  // Update isOwner when listing changes
  useEffect(() => {
    if (currentUser && listing) {
      setIsOwner(currentUser.id === listing.seller?.id);
    }
  }, [currentUser, listing]);

  const handleMessageSeller = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to message the seller');
      return;
    }

    if (!listing || !listing.seller?.id) {
      Alert.alert('Error', 'Invalid listing data');
      return;
    }

    try {
      // Check if conversation already exists
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('*')
        .or(`buyer_id.eq.${currentUser.id},seller_id.eq.${currentUser.id}`)
        .or(`buyer_id.eq.${listing.seller.id},seller_id.eq.${listing.seller.id}`)
        .eq('listing_id', listing.id)
        .single();

      if (existingConversation) {
        router.push(`/home/messages/${existingConversation.id}`);
        return;
      }

      // Create new conversation
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert([
          {
            buyer_id: currentUser.id,
            seller_id: listing.seller.id,
            listing_id: listing.id,
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating conversation:', error);
        Alert.alert('Error', 'Failed to start conversation');
        return;
      }

      router.push(`/home/messages/${conversation.id}`);
    } catch (error) {
      console.error('Error handling message:', error);
      Alert.alert('Error', 'Failed to start conversation');
    }
  };

  const handleBuyNow = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to purchase this item');
      return;
    }

    if (!listing || !listing.seller?.id) {
      Alert.alert('Error', 'Invalid listing data');
      return;
    }

    Alert.alert(
      'Confirm Purchase',
      `Are you sure you want to buy "${listing.title}" for $${listing.price?.toFixed(2) || '0.00'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('transactions')
                .insert([
                  {
                    listing_id: listing.id,
                    buyer_id: currentUser.id,
                    seller_id: listing.seller.id,
                    amount: listing.price || 0,
                    status: 'completed',
                  }
                ]);

              if (error) {
                console.error('Error creating transaction:', error);
                Alert.alert('Error', 'Failed to complete purchase');
                return;
              }

              Alert.alert(
                'Success!',
                'Purchase completed successfully. Contact the seller to arrange pickup.',
                [{ text: 'OK', onPress: () => router.back() }]
              );
            } catch (error) {
              console.error('Error completing purchase:', error);
              Alert.alert('Error', 'Failed to complete purchase');
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleMessage = async () => {
    if (!currentUser || !listing) {
      Alert.alert('Error', 'You must be logged in to send messages');
      return;
    }

    if (isOwner) {
      Alert.alert('Error', 'You cannot message your own listing');
      return;
    }

    try {
      setMessaging(true);
      // Check for existing conversation
      // Check for existing conversation between buyer and seller for this listing
      const { data: existingConvs } = await supabase
        .from('conversations')
        .select('id')
        .eq('listing_id', listing.id)
        .eq('buyer_id', currentUser.id)
        .eq('seller_id', listing.seller.id);

      let conversationId;

      if (existingConvs && existingConvs.length > 0) {
        // Use existing conversation
        conversationId = existingConvs[0].id;
      } else {
        // Create new conversation
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert([
            {
              listing_id: listing.id,
              buyer_id: currentUser.id,
              seller_id: listing.seller.id
            }
          ])
          .select()
          .single();

        if (conversationError) {
          console.error('Error creating conversation:', conversationError);
          throw new Error('Failed to create conversation');
        }

        conversationId = newConversation.id;
      }

      if (conversationId) {
        router.push(`/home/messages/${conversationId}`);
      } else {
        Alert.alert('Error', 'Failed to start conversation');
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      Alert.alert('Error', 'Failed to start conversation');
    } finally {
      setMessaging(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading listing...</Text>
      </View>
    );
  }

  if (!listing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Listing not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Images */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.imageContainer}
      >
        {listing.listing_images && listing.listing_images.length > 0 ? (
          listing.listing_images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image.file_path }}
              style={styles.image}
              resizeMode="cover"
            />
          ))
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Image Available</Text>
          </View>
        )}
      </ScrollView>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>{listing.title}</Text>
        <Text style={styles.price}>${listing.price.toFixed(2)}</Text>
        
        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Category:</Text>
            <Text style={styles.metadataValue}>
              {listing.category?.name || 'Uncategorized'}
            </Text>
          </View>
          
          <View style={styles.metadataItem}>
            <Text style={styles.metadataLabel}>Condition:</Text>
            <Text style={styles.metadataValue}>
              {getConditionLabel(listing.condition)}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{listing.description}</Text>

        {/* Seller Info */}
        <View style={styles.sellerInfo}>
          <View style={styles.sellerProfile}>
            {listing.seller.avatar_url ? (
              <Image
                source={{ uri: listing.seller.avatar_url }}
                style={styles.sellerAvatar}
              />
            ) : (
              <View style={styles.sellerAvatarPlaceholder}>
                <Text style={styles.sellerAvatarText}>
                  {listing.seller.username.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <Text style={styles.sellerName}>{listing.seller.username}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {!isOwner && (
            <TouchableOpacity
              style={[styles.actionButton, styles.messageButton]}
              onPress={handleMessage}
              disabled={messaging}
            >
              {messaging ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.actionButtonText}>Message Seller</Text>
              )}
            </TouchableOpacity>
          )}
          
          {isOwner && (
            <TouchableOpacity
              style={[styles.actionButton, styles.editButton]}
              onPress={() => router.push(`/home/listing/edit/${listing.id}`)}
            >
              <Text style={styles.actionButtonText}>Edit Listing</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
