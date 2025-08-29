import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import { databaseSetup } from '../lib/databaseSetup';
import { 
  fontSizes, 
  inputDimensions, 
  shadows,
  responsiveValue 
} from '../lib/responsive';

interface Category {
  id: number;
  label: string;
  slug?: string;
}

interface CategoryPickerProps {
  onSelect: (categoryId: number) => void;
  selectedValue?: number;
}

// Fallback categories if database is empty
const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, label: 'Electronics', slug: 'electronics' },
  { id: 2, label: 'Books', slug: 'books' },
  { id: 3, label: 'Clothing', slug: 'clothing' },
  { id: 4, label: 'Furniture', slug: 'furniture' },
  { id: 5, label: 'Sports & Fitness', slug: 'sports' },
  { id: 6, label: 'Musical Instruments', slug: 'instruments' },
  { id: 7, label: 'Art & Crafts', slug: 'art' },
  { id: 8, label: 'Home & Garden', slug: 'home' },
  { id: 9, label: 'Automotive', slug: 'automotive' },
  { id: 10, label: 'Other', slug: 'other' },
];

export default function CategoryPicker({ onSelect, selectedValue }: CategoryPickerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('label');

      if (error) {
        console.log('Error fetching categories:', error);
        // Use fallback categories if database table doesn't exist or is empty
        setCategories(FALLBACK_CATEGORIES);
      } else if (data && data.length > 0) {
        console.log('Categories fetched from database:', data);
        setCategories(data);
      } else {
        console.log('Categories table is empty, using fallback categories');
        // If table exists but is empty, populate it with fallback categories
        await databaseSetup.initializeCategories();
        setCategories(FALLBACK_CATEGORIES);
      }
    } catch (error) {
      console.error('Error in fetchCategories:', error);
      setCategories(FALLBACK_CATEGORIES);
    } finally {
      setLoading(false);
    }
  };

  const populateCategories = async () => {
    try {
      const { error } = await supabase
        .from('categories')
        .insert(FALLBACK_CATEGORIES);
      
      if (error) {
        console.error('Error populating categories:', error);
      } else {
        console.log('Categories table populated successfully');
      }
    } catch (error) {
      console.error('Error populating categories:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>Category *</Text>
        <View style={styles.pickerContainer}>
          <ActivityIndicator size="small" color="#ffffff" style={styles.loading} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={(itemValue) => onSelect(itemValue)}
          style={styles.picker}
          dropdownIconColor="#ffffff"
        >
          <Picker.Item label="Select a category" value={undefined} color="#888888" />
          {categories.map((category) => (
            <Picker.Item
              key={category.id}
              label={category.label}
              value={category.id}
              color="#ffffff"
            />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: responsiveValue(16, 20),
  },
  label: {
    fontSize: responsiveValue(fontSizes.sm, 14),
    fontWeight: '500',
    color: '#cccccc',
    marginBottom: responsiveValue(6, 8),
  },
  pickerContainer: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: inputDimensions.borderRadius,
    overflow: 'hidden',
    ...shadows.small,
  },
  picker: {
    color: '#ffffff',
    backgroundColor: 'transparent',
    height: inputDimensions.height,
  },
  loading: {
    padding: responsiveValue(16, 20),
  },
});
