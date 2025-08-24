import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  FlatList,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import ListingCard from '../../components/ListingCard';
import SafeAreaWrapper from '../../components/SafeAreaWrapper';
import { 
  fontSizes, 
  spacing, 
  responsivePadding, 
  buttonDimensions, 
  shadows,
  isTablet,
  isSmallDevice,
  responsiveValue,
  navigationConfig
} from '../../lib/responsive';

interface User {
  id: string;
  email: string;
}

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  created_at: string;
  seller: {
    username: string;
    avatar_url?: string;
  };
  category: {
    name: string;
  };
  listing_images?: {
    url: string;
  }[];
}

export default function HomeTab() {
  const [user, setUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    fetchListings();
    const cleanup = setupRealtimeSubscription();
    
    return cleanup;
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

  const fetchListings = async () => {
    try {
      // Try to fetch from listings table directly with images
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          seller:public_profiles!listings_seller_id_fkey (
            username,
            avatar_url
          ),
          category:categories (
            name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching listings:', error);
        // Fallback to listings_feed if direct query fails
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('listings_feed')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
        } else {
          console.log('Using fallback data:', fallbackData);
          setListings(fallbackData || []);
        }
      } else {
        console.log('Fetched listings:', data);
        
        // Fetch images for each listing separately
        const listingsWithImages = await Promise.all(
          (data || []).map(async (listing) => {
            try {
              const { data: images } = await supabase
                .from('listing_images')
                .select('file_path')
                .eq('listing_id', listing.id);
              
              return {
                ...listing,
                listing_images: images?.map(img => ({ file_path: img.file_path })) || []
              };
            } catch (imageError) {
              console.log('Error fetching images for listing:', listing.id, imageError);
              return {
                ...listing,
                listing_images: []
              };
            }
          })
        );
        
        console.log('Listings with images:', listingsWithImages);
        setListings(listingsWithImages);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('listings_feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'listings' },
        (payload) => {
          // Fetch updated listings when new ones are added
          fetchListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([checkUser(), fetchListings()]);
    setRefreshing(false);
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
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>ClgMart</Text>
          <Text style={styles.subtitle}>Buy and sell stuff</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/home/create-listing')}
          >
            <Text style={styles.createButtonText}>Sell+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Simple Listings */}
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListingCard
            listing={{
              ...item,
              // Convert listing_images from { url: string }[] to { file_path: string }[]
              listing_images: item.listing_images
                ? item.listing_images.map((img: any) => ({
                    file_path: img.url,
                  }))
                : [],
            }}
          />
        )}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No listings yet</Text>
            <Text style={styles.emptySubtext}>Create your first listing to get started</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: responsiveValue(16, 20),
    paddingTop: responsiveValue(20, 24),
    paddingBottom: responsiveValue(16, 24),
    backgroundColor: '#0a0a0a',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  createButton: {
    backgroundColor: '#ffffff',
    width: responsiveValue(70, 80),
    height: responsiveValue(40, 44),
    borderRadius: responsiveValue(20, 22),
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
    marginTop: responsiveValue(6, 8),
  },
  createButtonText: {
    color: '#000000',
    fontSize: responsiveValue(fontSizes.md, 16),
    fontWeight: '600',
  },
  greeting: {
    fontSize: responsiveValue(fontSizes.xxxl, 32),
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: responsiveValue(2, 4),
  },
  subtitle: {
    fontSize: responsiveValue(fontSizes.md, 16),
    color: '#888888',
    fontWeight: '400',
  },
  sellText: {
    fontSize: responsiveValue(fontSizes.sm, 14),
    color: '#ffffff',
    opacity: 0.7,
    fontWeight: '500',
    marginBottom: responsiveValue(6, 8),
    textAlign: 'right',
  },
  listContainer: {
    paddingHorizontal: responsiveValue(16, 20),
    paddingTop: responsiveValue(8, 10),
    paddingBottom: responsiveValue(20, 24),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: responsiveValue(80, 100),
    paddingHorizontal: responsiveValue(20, 40),
  },
  emptyText: {
    fontSize: responsiveValue(fontSizes.lg, 18),
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: responsiveValue(6, 8),
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: responsiveValue(fontSizes.sm, 14),
    color: '#888888',
    textAlign: 'center',
    lineHeight: responsiveValue(18, 20),
  },
  section: {
    paddingHorizontal: responsiveValue(20, 24),
    paddingVertical: responsiveValue(20, 24),
  },
  sectionTitle: {
    fontSize: responsiveValue(fontSizes.lg, 18),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: responsiveValue(12, 16),
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: responsiveValue(10, 12),
    padding: responsiveValue(16, 20),
    width: '48%',
    alignItems: 'center',
    marginBottom: responsiveValue(10, 12),
    borderWidth: 1,
    borderColor: '#333333',
    ...shadows.small,
  },
  actionIcon: {
    fontSize: responsiveValue(20, 24),
    marginBottom: responsiveValue(6, 8),
  },
  actionTitle: {
    fontSize: responsiveValue(fontSizes.sm, 14),
    fontWeight: '500',
    color: '#ffffff',
  },
  recentItems: {
    gap: responsiveValue(10, 12),
  },
  itemCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: responsiveValue(10, 12),
    padding: responsiveValue(12, 16),
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#333333',
    ...shadows.small,
  },
  itemImagePlaceholder: {
    width: responsiveValue(40, 48),
    height: responsiveValue(40, 48),
    backgroundColor: '#333333',
    borderRadius: responsiveValue(6, 8),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveValue(10, 12),
  },
  itemImageText: {
    fontSize: responsiveValue(16, 20),
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: responsiveValue(fontSizes.md, 16),
    fontWeight: '500',
    color: '#ffffff',
    marginBottom: responsiveValue(2, 4),
  },
  itemPrice: {
    fontSize: responsiveValue(fontSizes.md, 16),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: responsiveValue(1, 2),
  },
  itemLocation: {
    fontSize: responsiveValue(fontSizes.xs, 12),
    color: '#888888',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: responsiveValue(10, 12),
    padding: responsiveValue(12, 16),
    flex: 1,
    alignItems: 'center',
    marginHorizontal: responsiveValue(2, 4),
    borderWidth: 1,
    borderColor: '#333333',
    ...shadows.small,
  },
  statNumber: {
    fontSize: responsiveValue(fontSizes.lg, 20),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: responsiveValue(2, 4),
  },
  statLabel: {
    fontSize: responsiveValue(fontSizes.xs, 12),
    color: '#888888',
  },
});
