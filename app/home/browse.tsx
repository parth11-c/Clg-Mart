import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { databaseSetup } from '../../lib/databaseSetup';
import { fixListingImages, fixCategoriesTable } from '../../lib/databaseFixes';
import ListingCard from '../../components/ListingCard';

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
    file_path: string;
  }[];
}

interface Category {
  id: number;
  name: string;
}

export default function BrowseTab() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchListings();
  }, [selectedCategory]);

  const fetchCategories = async () => {
    try {
      // Try to get categories, with fallback for schema issues
      const fallbackCategories = await fixCategoriesTable();
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) {
        console.log('Using fallback categories due to error:', error.message);
        setCategories(fallbackCategories);
      } else {
        setCategories(data || fallbackCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Use fallback categories
      setCategories([
        { id: 1, name: 'Electronics' },
        { id: 2, name: 'Books' },
        { id: 3, name: 'Clothing' },
        { id: 4, name: 'Furniture' },
        { id: 5, name: 'Sports' },
        { id: 6, name: 'Other' }
      ]);
    }
  };

  const fetchListings = async () => {
    try {
      let query = supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching listings:', error);
        // Fallback to listings_feed
        let fallbackQuery = supabase
          .from('listings_feed')
          .select('*')
          .order('created_at', { ascending: false });

        if (selectedCategory) {
          fallbackQuery = fallbackQuery.eq('category_id', selectedCategory);
        }

        const { data: fallbackData, error: fallbackError } = await fallbackQuery;
        
        if (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
        } else {
          setListings(fallbackData || []);
        }
      } else {
        // Fetch additional data for each listing
        const listingsWithImages = await Promise.all(
          (data || []).map(async (listing) => {
            try {
              // Fetch images with better debugging
              const { data: images, error: imgError } = await supabase
                .from('listing_images')
                .select('file_path')
                .eq('listing_id', listing.id);

              if (imgError) {
                console.log('Image fetch error for listing', listing.id, ':', imgError);
              }

              console.log('Raw images data for listing', listing.id, ':', images);

              // Filter out images with null/undefined file_path
              const validImages = images?.filter(img => img.file_path && img.file_path.trim() !== '') || [];

              // Fetch seller info
              const { data: seller } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('id', listing.seller_id)
                .single();

              // Fetch category info
              const { data: category } = await supabase
                .from('categories')
                .select('name')
                .eq('id', listing.category_id)
                .single();

              const processedListing = {
                ...listing,
                listing_images: validImages.map(img => ({ file_path: img.file_path })),
                seller: seller || { username: 'Unknown User' },
                category: category || { name: 'Unknown Category' }
              };

              console.log('Processed listing:', processedListing.id, 'with', validImages.length, 'valid images');
              
              return processedListing;
            } catch (additionalError) {
              console.log('Error fetching additional data for listing:', listing.id, additionalError);
              return {
                ...listing,
                listing_images: [],
                seller: { username: 'Unknown User' },
                category: { name: 'Unknown Category' }
              };
            }
          })
        );
        
        setListings(listingsWithImages);
        
        // If no listings exist, create sample data
        if (listingsWithImages.length === 0) {
          console.log('No listings found, creating sample data...');
          const sampleCreated = await databaseSetup.createSampleData();
          if (sampleCreated) {
            // Refetch listings after creating sample data
            setTimeout(() => {
              fetchListings();
            }, 1000);
          }
        } else {
          // Check if any listings have invalid images and fix them
          const hasInvalidImages = listingsWithImages.some(listing => 
            !listing.listing_images || 
            listing.listing_images.length === 0 || 
            listing.listing_images.some((img: { file_path: string }) => !img.file_path || img.file_path === 'undefined')
          );

          if (hasInvalidImages) {
            console.log('Some listings have invalid images, fixing...');
            const fixed = await fixListingImages();
            if (fixed) {
              // Refetch listings after fixing images
              setTimeout(() => {
                fetchListings();
              }, 2000);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchCategories(), fetchListings()]);
    setRefreshing(false);
  };

  const filteredListings = listings.filter(listing =>
    listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCategoryPress = (categoryId: number) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const renderHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Browse Items</Text>
        <Text style={styles.subtitle}>Find what you're looking for</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoryRow}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryCard,
                selectedCategory === category.id && styles.selectedCategoryCard
              ]}
              onPress={() => handleCategoryPress(category.id)}
            >
              <Text style={[
                styles.categoryTitle,
                selectedCategory === category.id && styles.selectedCategoryTitle
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Listings Header */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {selectedCategory 
            ? `${categories.find(c => c.id === selectedCategory)?.name} Items`
            : 'All Items'
          }
        </Text>
      </View>
    </View>
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchQuery 
          ? 'No items found matching your search'
          : 'No items available'
        }
      </Text>
      <Text style={styles.emptySubtext}>
        {searchQuery 
          ? 'Try adjusting your search terms'
          : 'Check back later for new listings'
        }
      </Text>
    </View>
  );

  // Debug function to check database state
  const debugDatabase = async () => {
    console.log('=== DATABASE DEBUG ===');
    
    // Check listings table
    const { data: allListings, error: listingsError } = await supabase
      .from('listings')
      .select('id, title, seller_id, category_id')
      .limit(5);
    
    console.log('Sample listings:', allListings);
    console.log('Listings error:', listingsError);
    
    // Check listing_images table
    const { data: allImages, error: imagesError } = await supabase
      .from('listing_images')
      .select('*')
      .limit(10);
    
    console.log('Sample images:', allImages);
    console.log('Images error:', imagesError);
    
    // Check categories table
    const { data: allCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');
    
    console.log('Categories:', allCategories);
    console.log('Categories error:', categoriesError);
    
    // Check profiles table
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username')
      .limit(5);
    
    console.log('Sample profiles:', allProfiles);
    console.log('Profiles error:', profilesError);
  };

  // Call debug function on component mount
  useEffect(() => {
    debugDatabase();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading listings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredListings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ListingCard listing={item} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyComponent}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
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
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
    backgroundColor: '#0a0a0a',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#0a0a0a',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#333333',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#ffffff',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333333',
  },
  selectedCategoryCard: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
  selectedCategoryTitle: {
    color: '#0a0a0a',
  },
  listContainer: {
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    color: '#ffffff',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
});
