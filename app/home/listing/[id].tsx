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
        .from('listings_feed')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching listing:', error);
        Alert.alert('Error', 'Failed to load listing');
        return;
      }

      setListing(data);
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
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView style={styles.scrollView}>
        {/* Images */}
        <View style={styles.imageContainer}>
          {listing.listing_images && listing.listing_images.length > 0 ? (
            <Image 
              source={{ uri: listing.listing_images[0].file_path }} 
              style={styles.mainImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Text style={styles.placeholderText}>📷</Text>
              <Text style={styles.placeholderSubtext}>No image available</Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{listing.title || 'Untitled Listing'}</Text>
          <Text style={styles.price}>${listing.price?.toFixed(2) || '0.00'}</Text>
          
          <View style={styles.metaContainer}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Category</Text>
              <Text style={styles.metaValue}>{listing.category?.name || 'Unknown'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Condition</Text>
              <Text style={styles.metaValue}>{getConditionLabel(listing.condition || 'unknown')}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Listed</Text>
              <Text style={styles.metaValue}>{formatDate(listing.created_at)}</Text>
            </View>
          </View>

          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.description}>{listing.description || 'No description available'}</Text>
          </View>

          {/* Seller Info */}
          <View style={styles.sellerContainer}>
            <Text style={styles.sellerTitle}>Seller</Text>
            <View style={styles.sellerInfo}>
              {listing.seller?.avatar_url ? (
                <Image source={{ uri: listing.seller.avatar_url }} style={styles.sellerAvatar} />
              ) : (
                <View style={styles.sellerAvatarPlaceholder}>
                  <Text style={styles.sellerAvatarText}>
                    {listing.seller?.username?.charAt(0)?.toUpperCase() || '👤'}
                  </Text>
                </View>
              )}
              <View style={styles.sellerDetails}>
                <Text style={styles.sellerName}>{listing.seller?.username || 'Unknown Seller'}</Text>
                <Text style={styles.sellerStatus}>Active seller</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {!isOwner ? (
          <>
            <TouchableOpacity style={styles.messageButton} onPress={handleMessageSeller}>
              <Text style={styles.messageButtonText}>💬 Message Seller</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
              <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.ownerActions}>
            <Text style={styles.ownerText}>This is your listing</Text>
          </View>
        )}
      </View>
    </View>
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
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    height: 300,
    backgroundColor: '#1a1a1a',
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
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
  metaContainer: {
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaLabel: {
    fontSize: 14,
    color: '#888888',
  },
  metaValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 24,
  },
  sellerContainer: {
    marginBottom: 24,
  },
  sellerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 12,
  },
  sellerInfo: {
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
  sellerDetails: {
    flex: 1,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  sellerStatus: {
    fontSize: 14,
    color: '#888888',
  },
  actionContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#0a0a0a',
  },
  messageButton: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  messageButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  buyButton: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  ownerActions: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  ownerText: {
    color: '#888888',
    fontSize: 16,
    fontStyle: 'italic',
  },
});
