import React, { useState, useEffect } from 'react';
import { Modal, View, StyleSheet, Text, Button, SafeAreaView, Alert } from 'react-native';
import CustomerForm, { CustomerFormData } from './CustomerForm';
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed

// Define a type for the full customer data including ID
// Based on the 'customers' table schema
type Customer = CustomerFormData & {
    customer_id: string; // uuid
    // Include other fields if needed, e.g., created_at, updated_at
};

type CustomerModalProps = {
  isVisible: boolean;
  onClose: () => void;
  customerToEdit?: Customer | null; // Pass customer data if editing
  onSave: (savedCustomer: Customer) => void; // Callback after successful save
};

const CustomerModal: React.FC<CustomerModalProps> = ({
  isVisible,
  onClose,
  customerToEdit,
  onSave,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prepare initial data for the form, excluding the ID
  const initialFormData: Partial<CustomerFormData> | undefined = customerToEdit
    ? (({ customer_id, ...rest }) => rest)(customerToEdit) // Exclude customer_id
    : undefined;

  const handleFormSubmit = async (formData: CustomerFormData) => {
    setIsSubmitting(true);
    try {
      let savedData: Customer | null = null;
      if (customerToEdit) {
        // Update existing customer
        const { data, error } = await supabase
          .from('customers')
          .update(formData)
          .eq('customer_id', customerToEdit.customer_id)
          .select() // Select the updated record to get the full data back
          .single(); // Expecting a single record back

        if (error) throw error;
        savedData = data as Customer;
      } else {
        // Create new customer
        // Note: user_id will be set by default value if configured in DB
        const { data, error } = await supabase
          .from('customers')
          .insert(formData)
          .select() // Select the inserted record
          .single(); // Expecting a single record back

        if (error) throw error;
        savedData = data as Customer;
      }

      if (savedData) {
        onSave(savedData); // Pass saved data back to parent
        onClose(); // Close modal on success
      } else {
         Alert.alert('Error', 'Failed to save customer data.');
      }

    } catch (error: any) {
      Alert.alert('Error saving customer', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose} // For Android back button
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {customerToEdit ? 'Edit Customer' : 'Add New Customer'}
          </Text>
          <Button title="Cancel" onPress={onClose} color="#888" />
        </View>
        <CustomerForm
          initialData={initialFormData}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          submitButtonText={customerToEdit ? 'Update Customer' : 'Add Customer'}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight, // Adjust for status bar on Android
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    backgroundColor: '#f8f8f8',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

// Need Platform and StatusBar for marginTop adjustment
import { Platform, StatusBar } from 'react-native';

export default CustomerModal;
