import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../lib/supabase';
import { 
  fontSizes, 
  inputDimensions, 
  shadows,
  responsiveValue 
} from '../lib/responsive';

interface Category {
  id: number;
  name: string;
}

interface CategoryPickerProps {
  onSelect: (categoryId: number) => void;
  selectedValue?: number;
}

// Fallback categories if database is empty
const FALLBACK_CATEGORIES: Category[] = [
  { id: 1, name: 'Electronics' },
  { id: 2, name: 'Books' },
  { id: 3, name: 'Clothing' },
  { id: 4, name: 'Furniture' },
  { id: 5, name: 'Sports & Fitness' },
  { id: 6, name: 'Musical Instruments' },
  { id: 7, name: 'Art & Crafts' },
  { id: 8, name: 'Home & Garden' },
  { id: 9, name: 'Automotive' },
  { id: 10, name: 'Other' },
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
        .order('name');

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
        await populateCategories();
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
              label={category.name}
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
