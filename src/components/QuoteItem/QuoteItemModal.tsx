import React, { useState } from 'react';
import { Modal, View, StyleSheet, Text, Button, SafeAreaView, Alert, Platform, StatusBar } from 'react-native';
import QuoteItemForm, { QuoteItemFormData } from './QuoteItemForm';
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed

// Define the full quote item type including ID and other DB fields, and export it
export type QuoteItem = QuoteItemFormData & {
    quote_item_id: string; // uuid
    quote_id: string; // uuid
    line_total?: number | null; // Calculated by DB trigger
    tax_amount_item?: number | null; // Calculated by DB trigger/function potentially
    order_index?: number | null; // Set by DB default or app logic
    created_at?: string | null;
    updated_at?: string | null;
    user_id?: string | null;
    // Include other fields fetched from DB if needed
};

type QuoteItemModalProps = {
  isVisible: boolean;
  onClose: () => void;
  quoteId: string; // ID of the quote this item belongs to
  itemToEdit?: QuoteItem | null; // Pass item data if editing
  onSave: (savedItem: QuoteItem) => void; // Callback after successful save
  targetGroupId?: string | null; // ID of the group to add the item to (if adding new)
};

const QuoteItemModal: React.FC<QuoteItemModalProps> = ({
  isVisible,
  onClose,
  quoteId,
  itemToEdit,
  onSave,
  targetGroupId, // Destructure the new prop
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prepare initial data for the form, excluding IDs managed elsewhere
  const initialFormData: Partial<QuoteItemFormData> | undefined = itemToEdit
    ? (({ quote_item_id, quote_id, ...rest }) => rest)(itemToEdit) // Exclude IDs
    : undefined;

  const handleFormSubmit = async (formData: QuoteItemFormData) => {
    setIsSubmitting(true);
    try {
      let savedData: QuoteItem | null = null;
      // Data to insert/update - include quote_id
      const dataToSave = {
          ...formData,
          quote_id: quoteId,
          // Assign the target group ID if creating a new item
          quote_group_id: itemToEdit ? itemToEdit.quote_group_id : targetGroupId, 
          // TODO: Add logic here to set item_id, costbook_item_id
          // based on whether user selected from costbook or entered custom.
          // Also need to calculate/fetch costs and potentially tax_amount_item if not done by DB trigger.
          // For now, we save the basic form data. Line total will be calculated by trigger.
      };

      // Calculate line_total here or rely on DB trigger
      // dataToSave.line_total = dataToSave.quantity * dataToSave.unit_price;
      // Calculate tax_amount_item here or rely on DB trigger/function
      // dataToSave.tax_amount_item = dataToSave.line_total * (quote_tax_rate); // Need quote's tax rate

      if (itemToEdit) {
        // Update existing quote item
        const { data, error } = await supabase
          .from('quote_items')
          .update(dataToSave)
          .eq('quote_item_id', itemToEdit.quote_item_id)
          .select()
          .single();

        if (error) throw error;
        savedData = data as QuoteItem;
      } else {
        // Create new quote item
        const { data, error } = await supabase
          .from('quote_items')
          .insert(dataToSave)
          .select()
          .single();

        if (error) throw error;
        savedData = data as QuoteItem;
      }

      if (savedData) {
        onSave(savedData); // Pass saved data back
        onClose(); // Close modal
      } else {
         Alert.alert('Error', 'Failed to save quote item.');
      }

    } catch (error: any) {
      Alert.alert('Error saving quote item', error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {itemToEdit ? 'Edit Item' : 'Add New Item'}
          </Text>
          <Button title="Cancel" onPress={onClose} color="#888" />
        </View>
        <QuoteItemForm
          initialData={initialFormData}
          onSubmit={handleFormSubmit}
          isSubmitting={isSubmitting}
          submitButtonText={itemToEdit ? 'Update Item' : 'Add Item'}
        />
      </SafeAreaView>
    </Modal>
  );
};

// Reusing styles from CustomerModal
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
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

export default QuoteItemModal;
