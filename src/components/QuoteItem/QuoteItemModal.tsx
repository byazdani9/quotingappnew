import React, { useState } from 'react';
import { Modal, View, StyleSheet, Text, Button, SafeAreaView, Alert, Platform, StatusBar } from 'react-native';
import QuoteItemForm, { QuoteItemFormData } from './QuoteItemForm';
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed
import { useEstimateBuilder } from '../../contexts/EstimateBuilderContext'; // Import context hook

// Define the full quote item type including ID and other DB fields, and export it
export type QuoteItem = QuoteItemFormData & {
    quote_item_id: string; // uuid
    quote_id: string; // uuid

    // Existing DB fields
    line_total?: number | null; // Calculated by DB trigger or app
    tax_amount_item?: number | null; // Calculated by DB trigger or app
    order_index?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    user_id?: string | null;

  // --- NEW FIELDS based on screenshots ---
  // Cost Components (per unit) (using snake_case now)
  material_cost?: number | null;
  labor_cost?: number | null;
  equipment_cost?: number | null;
  other_cost?: number | null;
  subcontract_cost?: number | null;

    // Calculated Cost Per Unit (can be calculated in app or fetched if stored)
    // total_cost_per_unit?: number | null; // Sum of above costs - This will be calculated

    // Markups are omitted for now based on user feedback

    // Calculated Values (can be calculated in app or fetched if stored)
    // cost_total?: number | null; // quantity * total_cost_per_unit - This will be calculated
    // overhead_amount?: number | null; // cost_total * markup_overhead_percent
    // profit_amount?: number | null; // (cost_total + overhead_amount) * markup_profit_percent
    // contingency_amount?: number | null; // (cost_total + overhead_amount + profit_amount) * markup_contingency_percent
    // total_with_markup?: number | null; // cost_total + overhead + profit + contingency

    // Link to product catalog/costbook (optional, based on screenshot)
    linked_product_id?: string | null;

    // --- Optional fields to store calculated values for display ---
    calculated_total_cost_per_unit?: number;
    calculated_total_with_markup?: number;
    // --- END NEW FIELDS ---
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
  const { currentQuoteId } = useEstimateBuilder(); // Get currentQuoteId from context
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prepare initial data for the form, excluding IDs managed elsewhere
  const initialFormData: Partial<QuoteItemFormData> | undefined = itemToEdit
    ? (({ quote_item_id, quote_id, ...rest }) => rest)(itemToEdit) // Exclude IDs
    : undefined;

  const handleFormSubmit = async (formData: QuoteItemFormData) => {
    setIsSubmitting(true);
    try {
      let savedData: QuoteItem | null = null;

      // Data to insert/update - include all form data + quote_id + group_id
      // Ensure numeric fields are numbers or null, not empty strings
      const dataToSave = {
          // Map form data fields to the correct database column names
          // Map form data fields to the correct database column names
          title: formData.title, // Include title
          description: formData.description,
          quantity: formData.quantity ?? 0,
          unit: formData.unit,
          // unit_price: formData.unit_price ?? 0, // REMOVED - No longer in form data
          // Use snake_case keys to match DB schema and form data type
          material_cost: formData.material_cost ?? null,
          labor_cost: formData.labor_cost ?? null,
          equipment_cost: formData.equipment_cost ?? null,
          other_cost: formData.other_cost ?? null,
          subcontract_cost: formData.subcontract_cost ?? null,
          // Markups omitted
          // Use currentQuoteId from context for new items, keep existing for updates
          quote_id: itemToEdit ? itemToEdit.quote_id : currentQuoteId,
          // Assign the target group ID if creating a new item, otherwise keep existing
          quote_group_id: itemToEdit ? itemToEdit.quote_group_id : targetGroupId,
          // item_id and costbook_item_id are already included via ...formData if set
      };
      // Remove calculated fields that should be handled by context/DB triggers
      // delete dataToSave.line_total;
      // delete dataToSave.tax_amount_item;

      // TODO: Decide if line_total and tax_amount_item should be calculated client-side before save
      // or purely rely on DB triggers/context calculations post-save.
      // For now, assuming context handles display and DB might handle storage of calculated values.

      // Calculate line_total here or rely on DB trigger
      // dataToSave.line_total = dataToSave.quantity * dataToSave.unit_price;
      // Calculate tax_amount_item here or rely on DB trigger/function
      // dataToSave.tax_amount_item = dataToSave.line_total * (quote_tax_rate); // Need quote's tax rate

      // Add a check for quote_id before inserting
      if (!dataToSave.quote_id) {
          throw new Error("Cannot save item: Quote ID is missing.");
      }
      // console.log("QuoteItemModal: Data before saving to Supabase:", dataToSave); // Remove log

      if (itemToEdit) {
        // Update existing quote item
        const { data, error } = await supabase
          .from('quote_items')
          .update(dataToSave)
          .eq('quote_item_id', itemToEdit.quote_item_id)
          // Explicitly select all columns needed, including costs
          .select(`
            *, 
            material_cost, 
            labor_cost, 
            equipment_cost, 
            other_cost, 
            subcontract_cost
          `)
          .single();

        if (error) throw error;
        savedData = data as QuoteItem;
      } else {
        // Create new quote item
        const { data, error } = await supabase
          .from('quote_items')
          .insert(dataToSave)
          // Explicitly select all columns needed, including costs
          .select(`
            *, 
            material_cost, 
            labor_cost, 
            equipment_cost, 
            other_cost, 
            subcontract_cost
          `)
          .single();

        if (error) throw error;
        savedData = data; // Keep Supabase result separate for now
      }

      if (savedData) {
        // Merge the original data (with costs) and the Supabase result (with IDs/timestamps)
        const finalSavedData: QuoteItem = {
          ...dataToSave, // Start with the data we intended to save (has costs)
          ...savedData,  // Overwrite with Supabase result (has correct IDs, timestamps, etc.)
        };
        // console.log("QuoteItemModal: Data received from Supabase:", savedData); // Remove log
        // console.log("QuoteItemModal: Merged data passed to onSave:", finalSavedData); // Remove log
        onSave(finalSavedData); // Pass merged data back
        onClose(); // Close modal
      } else {
         Alert.alert('Error', 'Failed to save quote item.');
      }

    } catch (error: any) {
      // console.error("Error saving quote item:", error); // Remove console.error
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
            <Text>{itemToEdit ? 'Edit Item' : 'Add New Item'}</Text>
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
