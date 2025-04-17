import React from 'react'; // Removed useState, useEffect
// Removed Modal, Button, Alert - No longer needed here
import { View, StyleSheet, Text, SafeAreaView } from 'react-native'; 
import CustomerForm, { CustomerFormData } from './CustomerForm';
// Supabase client might not be needed here anymore if submission logic moves entirely to the screen
// import { supabase } from '../../lib/supabaseClient'; 

// Define props for the simplified component
// It now just needs the form data and the submit handler
type CustomerModalContentProps = {
  customerToEdit?: Partial<CustomerFormData> | null; // Pass initial data for editing
  onSubmit: (data: CustomerFormData) => void; // Function to call on submit
  isSubmitting?: boolean;
  submitButtonText?: string;
  // Removed isVisible, onClose, onSave
};

// Rename component to reflect its new role (content, not modal)
const CustomerModalContent: React.FC<CustomerModalContentProps> = ({
  customerToEdit,
  onSubmit,
  isSubmitting,
  submitButtonText,
}) => {
  // Removed all state and submission logic - this is handled by the screen now
  
  return (
    // Return only the CustomerForm, wrapped if needed for layout
    // Removed Modal, SafeAreaView, Header
    <View style={styles.formContainer}> 
      <CustomerForm
        // Pass undefined if customerToEdit is null
        initialData={customerToEdit || undefined} 
        onSubmit={onSubmit} // Pass onSubmit handler down
        isSubmitting={isSubmitting}
        submitButtonText={submitButtonText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Removed modalContainer, header, headerText styles
  formContainer: {
    flex: 1, // Take up available space within the screen
    // Add padding or other layout styles if needed
  },
});

// Removed Platform, StatusBar imports

// Export the renamed component
export default CustomerModalContent;
