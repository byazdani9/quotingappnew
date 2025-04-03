import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, ScrollView, Alert } from 'react-native'; // Import Alert

// Define the shape of the customer data the form handles
// Based on the 'customers' table schema
export type CustomerFormData = {
  first_name: string;
  last_name: string;
  company_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null; // Street address
  city?: string | null;
  state?: string | null; // Province/State
  postal_code?: string | null;
  notes?: string | null;
  // We likely won't edit coordinates, source, status, or timestamps directly in this form
};

type CustomerFormProps = {
  initialData?: Partial<CustomerFormData>; // Optional initial data for editing
  onSubmit: (data: CustomerFormData) => void; // Function to call on submit
  isSubmitting?: boolean; // Optional flag to disable button during submission
  submitButtonText?: string;
};

const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData = {},
  onSubmit,
  isSubmitting = false,
  submitButtonText = 'Save Customer',
}) => {
  const [formData, setFormData] = useState<CustomerFormData>({
    first_name: '',
    last_name: '',
    company_name: null,
    phone: null,
    email: null,
    address: null,
    city: null,
    state: null,
    postal_code: null,
    notes: null,
    ...initialData, // Spread initial data over defaults
  });

  // Update form if initialData changes (e.g., when opening modal for editing)
  useEffect(() => {
    setFormData({
        first_name: '',
        last_name: '',
        company_name: null,
        phone: null,
        email: null,
        address: null,
        city: null,
        state: null,
        postal_code: null,
        notes: null,
        ...initialData,
    });
  }, [initialData]);


  const handleChange = (name: keyof CustomerFormData, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value || null, // Store empty strings as null if field is nullable
    }));
  };

  const handleSubmit = () => {
    // Basic validation example (can be expanded)
    if (!formData.first_name || !formData.last_name) {
      Alert.alert('Validation Error', 'First Name and Last Name are required.'); // Use Alert API
      return;
    }
    onSubmit(formData);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>First Name *</Text>
      <TextInput
        style={styles.input}
        value={formData.first_name}
        onChangeText={value => handleChange('first_name', value)}
        placeholder="Enter first name"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Last Name *</Text>
      <TextInput
        style={styles.input}
        value={formData.last_name}
        onChangeText={value => handleChange('last_name', value)}
        placeholder="Enter last name"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Company Name</Text>
      <TextInput
        style={styles.input}
        value={formData.company_name ?? ''}
        onChangeText={value => handleChange('company_name', value)}
        placeholder="Enter company name (optional)"
        autoCapitalize="words"
      />

      <Text style={styles.label}>Phone</Text>
      <TextInput
        style={styles.input}
        value={formData.phone ?? ''}
        onChangeText={value => handleChange('phone', value)}
        placeholder="Enter phone number"
        keyboardType="phone-pad"
      />

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={formData.email ?? ''}
        onChangeText={value => handleChange('email', value)}
        placeholder="Enter email address"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Address (Street)</Text>
      <TextInput
        style={styles.input}
        value={formData.address ?? ''}
        onChangeText={value => handleChange('address', value)}
        placeholder="Enter street address"
        autoCapitalize="words"
      />

      <Text style={styles.label}>City</Text>
      <TextInput
        style={styles.input}
        value={formData.city ?? ''}
        onChangeText={value => handleChange('city', value)}
        placeholder="Enter city"
        autoCapitalize="words"
      />

      <Text style={styles.label}>State / Province</Text>
      <TextInput
        style={styles.input}
        value={formData.state ?? ''}
        onChangeText={value => handleChange('state', value)}
        placeholder="Enter state or province"
        autoCapitalize="words" // Or use specific state codes if needed
      />

      <Text style={styles.label}>Postal / Zip Code</Text>
      <TextInput
        style={styles.input}
        value={formData.postal_code ?? ''}
        onChangeText={value => handleChange('postal_code', value)}
        placeholder="Enter postal or zip code"
        autoCapitalize="characters"
      />

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.notes ?? ''}
        onChangeText={value => handleChange('notes', value)}
        placeholder="Enter any notes (optional)"
        multiline
        numberOfLines={3}
      />

      <View style={styles.buttonContainer}>
        <Button
          title={submitButtonText}
          onPress={handleSubmit}
          disabled={isSubmitting}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top', // Align text to top for multiline
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20, // Add some space at the bottom
  },
});

export default CustomerForm;
