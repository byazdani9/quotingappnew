import React, { useState } from 'react';
import { View, StyleSheet, SafeAreaView, Button, Text, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native';
import { JobStackParamList } from '../../../App'; // Adjust path if needed
import CustomerModalContent from '../../components/Customer/CustomerModal'; // Adjust path if needed
import { CustomerFormData } from '../../components/Customer/CustomerForm'; // Keep form data type import
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed
import { useEstimateBuilder } from '../../contexts/EstimateBuilderContext';

// Define a type for the full customer data including ID
type Customer = CustomerFormData & {
    customer_id: string;
};

// Define props using the JobStackParamList OR CustomerStackParamList
// We need a common or combined type, or handle params differently.
// For now, let's assume JobStackParamList might be sufficient if CustomerModalScreen
// is primarily used in that flow, OR we adjust the navigation logic.
// Let's stick with JobStackParamList for now and see if TS complains elsewhere.
// If editing from CustomerDetail, we might need to adjust how params are passed/typed.
type Props = NativeStackScreenProps<JobStackParamList, 'CustomerModalScreen'>;
// Alternative: Use a combined type if needed:
// type CombinedStackParamList = JobStackParamList & CustomerStackParamList;
// type Props = NativeStackScreenProps<CombinedStackParamList, 'CustomerModalScreen'>;


const CustomerModalScreen: React.FC<Props> = ({ navigation, route }) => {
  // customerToEdit can come from either JobStack or CustomerStack route params
  const customerToEdit = route.params?.customerToEdit;
  const { setSelectedCustomer } = useEstimateBuilder();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
          .select('customer_id, first_name, last_name') // Select fields needed for context
          .single();

        if (error) throw error;
        savedData = data as Customer;
      } else {
        // Create new customer
        const { data, error } = await supabase
          .from('customers')
          .insert(formData)
          .select('customer_id, first_name, last_name') // Select fields needed for context
          .single();

        if (error) throw error;
        savedData = data as Customer;
      }

      if (savedData) {
        Alert.alert('Success', `Customer ${customerToEdit ? 'updated' : 'added'} successfully!`);

        // If adding a new customer (not editing), set as selected and pop back to EstimateBuilder
        if (!customerToEdit && savedData) {
          setSelectedCustomer({
            customer_id: savedData.customer_id,
            first_name: savedData.first_name,
            last_name: savedData.last_name,
          });
          // Try to get jobTitle from route params if available
          const jobTitle = route.params?.jobTitle || '';
          navigation.navigate('EstimateBuilder', { jobTitle });
          return;
        }

        // If editing, just go back one screen
        navigation.goBack();

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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          <Text>{customerToEdit ? 'Edit Customer' : 'Add New Customer'}</Text>
        </Text>
        <Button title="Cancel" onPress={() => navigation.goBack()} color="#888" />
      </View>
      <CustomerModalContent
        customerToEdit={customerToEdit}
        onSubmit={handleFormSubmit}
        isSubmitting={isSubmitting}
        submitButtonText={customerToEdit ? 'Update Customer' : 'Add Customer'}
      />
    </SafeAreaView>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', backgroundColor: '#f8f8f8', },
  headerText: { fontSize: 18, fontWeight: 'bold', },
});

export default CustomerModalScreen;
