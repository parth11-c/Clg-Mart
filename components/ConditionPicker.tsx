import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { 
  fontSizes, 
  inputDimensions, 
  shadows,
  responsiveValue 
} from '../lib/responsive';

interface ConditionPickerProps {
  onSelect: (condition: string) => void;
  selectedValue?: string;
}

const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
];

export default function ConditionPicker({ onSelect, selectedValue }: ConditionPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Condition *</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={(itemValue) => {
            console.log('Condition selected:', itemValue);
            onSelect(itemValue);
          }}
          style={styles.picker}
          dropdownIconColor="#ffffff"
        >
          <Picker.Item label="Select condition" value={undefined} color="#888888" />
          {CONDITIONS.map((condition) => (
            <Picker.Item
              key={condition.value}
              label={condition.label}
              value={condition.value}
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
});
