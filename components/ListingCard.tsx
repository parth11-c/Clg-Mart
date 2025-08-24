import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { 
  fontSizes, 
  spacing, 
  responsivePadding, 
  cardDimensions, 
  imageDimensions,
  shadows,
  isTablet,
  isSmallDevice,
  responsiveValue 
} from '../lib/responsive';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  created_at: string;
  seller: {
    username: string;
  };
  category: {
    name: string;
  };
  listing_images?: {
    file_path: string;
  }[];
}

interface ListingCardProps {
  listing: Listing;
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

export default function ListingCard({ listing }: ListingCardProps) {
  // Early return if listing is invalid
  if (!listing || !listing.id) {
    return null;
  }

  const handlePress = () => {
    if (listing?.id) {
      router.push(`/home/listing/${listing.id}`);
    }
  };

  const formatPrice = (price: number) => {
    if (!price || isNaN(price)) return '$0.00';
    return `$${price.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return 'Just now';
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const mainImage = listing.listing_images?.[0]?.file_path;
  console.log('ListingCard image data:', listing.listing_images, 'Main image:', mainImage);
  
  // Check if the image is base64 or a URL
  const isBase64 = mainImage?.startsWith('data:image');

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.imageContainer}>
        {mainImage ? (
          <Image 
            source={{ uri: mainImage }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>📷</Text>
          </View>
        )}
        <View style={styles.priceTag}>
          <Text style={styles.priceText}>{formatPrice(listing.price)}</Text>
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {listing.description}
        </Text>
        
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Category:</Text>
            <Text style={styles.metaValue}>{listing.category?.name || 'Unknown'}</Text>
          </View>
          
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Condition:</Text>
            <Text style={styles.metaValue}>{getConditionLabel(listing.condition || 'unknown')}</Text>
          </View>
        </View>
        
        <View style={styles.footer}>
          <View style={styles.sellerInfo}>
            <View style={styles.sellerInitial}>
              <Text style={styles.sellerInitialText}>
                {listing.seller?.username?.charAt(0)?.toUpperCase() || '👤'}
              </Text>
            </View>
            <Text style={styles.sellerName}>{listing.seller?.username || 'Unknown Seller'}</Text>
          </View>
          
          <Text style={styles.date}>{formatDate(listing.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: cardDimensions.borderRadius,
    marginBottom: cardDimensions.margin,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333333',
    ...shadows.small,
  },
  imageContainer: {
    position: 'relative',
    height: responsiveValue(imageDimensions.card, 200),
  },
  image: {
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
    fontSize: responsiveValue(36, 48),
    color: '#666666',
  },
  priceTag: {
    position: 'absolute',
    top: responsiveValue(8, 12),
    right: responsiveValue(8, 12),
    backgroundColor: '#000000',
    paddingHorizontal: responsiveValue(8, 12),
    paddingVertical: responsiveValue(4, 6),
    borderRadius: responsiveValue(12, 16),
    ...shadows.small,
  },
  priceText: {
    color: '#ffffff',
    fontSize: responsiveValue(fontSizes.md, 16),
    fontWeight: '600',
  },
  content: {
    padding: cardDimensions.padding,
  },
  title: {
    fontSize: responsiveValue(fontSizes.lg, 18),
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: responsiveValue(6, 8),
    lineHeight: responsiveValue(20, 24),
  },
  description: {
    fontSize: responsiveValue(fontSizes.sm, 14),
    color: '#cccccc',
    marginBottom: responsiveValue(10, 12),
    lineHeight: responsiveValue(18, 20),
  },
  meta: {
    marginBottom: responsiveValue(10, 12),
  },
  metaItem: {
    flexDirection: 'row',
    marginBottom: responsiveValue(3, 4),
  },
  metaLabel: {
    fontSize: responsiveValue(fontSizes.xs, 12),
    color: '#888888',
    marginRight: responsiveValue(6, 8),
    minWidth: responsiveValue(50, 60),
  },
  metaValue: {
    fontSize: responsiveValue(fontSizes.xs, 12),
    color: '#cccccc',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerInitial: {
    width: responsiveValue(20, 24),
    height: responsiveValue(20, 24),
    borderRadius: responsiveValue(10, 12),
    backgroundColor: '#333333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: responsiveValue(6, 8),
  },
  sellerInitialText: {
    fontSize: responsiveValue(fontSizes.xs, 12),
    color: '#ffffff',
    fontWeight: '600',
  },
  sellerName: {
    fontSize: responsiveValue(fontSizes.xs, 12),
    color: '#cccccc',
    fontWeight: '500',
  },
  date: {
    fontSize: responsiveValue(fontSizes.xs, 12),
    color: '#888888',
  },
});
