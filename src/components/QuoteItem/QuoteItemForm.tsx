import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import CostbookBrowserModal, { SelectedCostbookItem } from '../CostbookBrowser/CostbookBrowserModal'; // Import the browser modal

// Define the shape of the quote item data the form handles
// Based on the 'quote_items' table schema
export type QuoteItemFormData = {
  description: string;
  quantity: number;
  unit: string;
  unit_price: number;
  // Links to costbook/item definitions - handle later
  item_id?: string | null;
  costbook_item_id?: string | null;
  // Group link - handle later via parent component/context
  quote_group_id?: string | null;
  // Costs - handle later or calculate server-side
  // tax_amount_item - calculated server-side by trigger/function
  // line_total - calculated server-side by trigger/function
};

type QuoteItemFormProps = {
  initialData?: Partial<QuoteItemFormData>; // Optional initial data for editing
  onSubmit: (data: QuoteItemFormData) => void; // Function to call on submit
  isSubmitting?: boolean; // Optional flag to disable button during submission
  submitButtonText?: string;
};

const QuoteItemForm: React.FC<QuoteItemFormProps> = ({
  initialData = {},
  onSubmit,
  isSubmitting = false,
  submitButtonText = 'Save Item',
}) => {
  const [isCustomItem, setIsCustomItem] = useState(!initialData?.costbook_item_id);
  const [isBrowserVisible, setIsBrowserVisible] = useState(false); // State for browser modal visibility
  const [formData, setFormData] = useState<QuoteItemFormData>({
    description: '',
    quantity: 1,
    unit: '', // Consider a default unit like 'Each' or 'Lump Sum'
    unit_price: 0,
    ...initialData,
  });

  // Update form and mode if initialData changes
  useEffect(() => {
     const isEditingCostbookItem = !!initialData?.costbook_item_id;
     setIsCustomItem(!isEditingCostbookItem);
     setFormData({
        description: '',
        quantity: 1,
        unit: '',
        unit_price: 0,
        ...initialData,
     });
  }, [JSON.stringify(initialData)]); // Depend on stringified content

  // Generic handler for text inputs
  const handleChange = (name: keyof QuoteItemFormData, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Specific handler for numeric inputs (quantity, unit_price)
  const handleNumericChange = (name: 'quantity' | 'unit_price', value: string) => {
    const numericValue = parseFloat(value);
    setFormData(prevData => ({
      ...prevData,
      [name]: isNaN(numericValue) ? 0 : numericValue, // Default to 0 if input is not a valid number
    }));
  };


  const handleSubmit = () => {
    // Basic validation
    if (!formData.description) {
      Alert.alert('Validation Error', 'Description is required.');
      return;
    }
     if (!formData.unit) {
      Alert.alert('Validation Error', 'Unit is required.');
      return;
    }
    if (formData.quantity <= 0) {
       Alert.alert('Validation Error', 'Quantity must be greater than zero.');
       return;
    }
    // Submit only the fields managed by this form
    const submitData: QuoteItemFormData = {
        description: formData.description,
        quantity: formData.quantity,
        unit: formData.unit,
        unit_price: formData.unit_price,
        // item_id, costbook_item_id, quote_group_id would be added here
        // based on how the user selected/created the item (logic outside this form)
    };
    onSubmit(submitData);
  };

  const handleSelectFromCostbook = () => {
      setIsBrowserVisible(true); // Open the browser modal
  };

  // Callback function when an item is selected from the browser modal
  const handleCostbookItemSelected = (selectedItem: SelectedCostbookItem) => {
      setFormData(prevData => ({
          ...prevData, // Keep existing quantity, etc.
          description: selectedItem.description,
          unit: selectedItem.unit,
          unit_price: selectedItem.unit_price,
          item_id: selectedItem.item_id, // Link to base item
          costbook_item_id: selectedItem.costbook_item_id, // Link to specific costbook pricing
          // Potentially copy costs here too if needed
      }));
      setIsCustomItem(false); // Switch mode to non-custom
      setIsBrowserVisible(false); // Close the browser modal
  };

  return (
    <> 
      <ScrollView style={styles.container}>
       {/* Mode Selector - Basic implementation */}
       <View style={styles.modeSelector}>
         <Button title="Enter Custom Item" onPress={() => setIsCustomItem(true)} disabled={isCustomItem} />
         <Button title="Select from Costbook" onPress={handleSelectFromCostbook} disabled={!isCustomItem} />
       </View>

      <Text style={styles.label}>Description *</Text>
      <TextInput
        value={formData.description}
        onChangeText={value => handleChange('description', value)}
        placeholder={isCustomItem ? "Enter item description" : "Selected item description"}
        multiline
        numberOfLines={3}
        editable={isCustomItem} // Description is editable only for custom items
        // CORRECTED: Single style prop with conditional background
        style={[styles.input, styles.textArea, !isCustomItem && { backgroundColor: '#eee' }]} 
      />

      <Text style={styles.label}>Quantity *</Text>
      <TextInput
        style={styles.input}
        value={String(formData.quantity)} // Convert number to string for TextInput
        onChangeText={value => handleNumericChange('quantity', value)}
        placeholder="1"
        keyboardType="numeric"
        // Quantity is always editable
      />

      <Text style={styles.label}>Unit *</Text>
      <TextInput
        value={formData.unit}
        onChangeText={value => handleChange('unit', value)}
        placeholder={isCustomItem ? "e.g., sq ft, ton, each" : "Selected item unit"}
        autoCapitalize="none"
        editable={isCustomItem} // Unit is editable only for custom items
        // CORRECTED: Single style prop with conditional background
        style={[styles.input, !isCustomItem && { backgroundColor: '#eee' }]} 
      />

      <Text style={styles.label}>Unit Price *</Text>
      <TextInput
        style={styles.input}
        value={String(formData.unit_price)} // Convert number to string
        onChangeText={value => handleNumericChange('unit_price', value)}
        placeholder="0.00"
        keyboardType="decimal-pad"
        // Price might be editable even if from costbook (override?) - keep editable for now
        // editable={isCustomItem}
        // backgroundColor={isCustomItem ? '#fff' : '#eee'}
      />

      {/* Display selected costbook item info if applicable */}
      {!isCustomItem && formData.item_id && (
          <Text style={styles.infoText}>Selected from Costbook (Item ID: {formData.item_id})</Text>
      )}


      <View style={styles.buttonContainer}>
        <Button
          title={submitButtonText}
          onPress={handleSubmit}
          disabled={isSubmitting}
        />
      </View>
    </ScrollView>
    <CostbookBrowserModal
        isVisible={isBrowserVisible}
        onClose={() => setIsBrowserVisible(false)}
        onItemSelected={handleCostbookItemSelected}
    />
   </> 
  );
};

// Reusing styles from CustomerForm where applicable
const styles = StyleSheet.create({
   container: {
    padding: 15,
    paddingBottom: 50, // Ensure scroll content doesn't hide behind buttons etc.
  },
  modeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
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
  infoText: {
      fontSize: 12,
      color: 'gray',
      fontStyle: 'italic',
      marginBottom: 15,
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 20, // Add some space at the bottom
  },
});

export default QuoteItemForm;
