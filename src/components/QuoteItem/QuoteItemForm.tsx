import React, { useState, useEffect } from 'react'; // Removed unused useMemo
import { View, TextInput, Button, StyleSheet, Text, ScrollView, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Import Picker
import CostbookBrowserModal, { SelectedCostbookItem } from '../CostbookBrowser/CostbookBrowserModal'; // Import the browser modal

// Define the shape of the quote item data the form handles
// Based on the 'quote_items' table schema and required inputs
export type QuoteItemFormData = {
  title?: string | null; // Added Title field
  description: string;
  quantity: number;
  unit: string;
  // unit_price: number; // REMOVED - Will be calculated from costs

  // --- NEW Cost & Markup Fields ---
  // Cost Components (per unit) - Optional, can be 0 or null (using snake_case now)
  material_cost?: number | null;
  labor_cost?: number | null;
  equipment_cost?: number | null;
  other_cost?: number | null;
  subcontract_cost?: number | null;
  // Markups omitted based on user feedback
  // --- END NEW Fields ---

  // Links to costbook/item definitions
  item_id?: string | null;
  costbook_item_id?: string | null;
  // Group link
  quote_group_id?: string | null;

  // Note: Calculated fields like line_total, tax_amount_item, total_with_markup
  // are part of the full QuoteItem type, not directly part of the form data input.
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

  // State for the main form data (numeric values for costs)
  const [formData, setFormData] = useState<QuoteItemFormData>({
    title: null, // Initialize title
    description: '',
    quantity: 1,
    unit: 'sq m', // Default unit? Or make it required? Let's default for now.
    // unit_price: 0, // REMOVED
    // Initialize new fields (using snake_case)
    material_cost: null,
    labor_cost: null,
    equipment_cost: null,
    other_cost: null,
    subcontract_cost: null,
    // Markups omitted
    ...initialData,
  });

  // State for the string representation of cost inputs for display
  const [costStrings, setCostStrings] = useState({
    quantity: String(initialData?.quantity ?? 1),
    material_cost: String(initialData?.material_cost ?? ''),
    labor_cost: String(initialData?.labor_cost ?? ''),
    equipment_cost: String(initialData?.equipment_cost ?? ''),
    other_cost: String(initialData?.other_cost ?? ''),
    subcontract_cost: String(initialData?.subcontract_cost ?? ''),
  });

  // Update form and string states if initialData changes
  useEffect(() => {
    const isEditingCostbookItem = !!initialData?.costbook_item_id;
    setIsCustomItem(!isEditingCostbookItem);

    // Prepare numeric formData based on initialData
    const newFormData: QuoteItemFormData = {
      title: null,
      description: '',
      quantity: 1,
      material_cost: null,
      labor_cost: null,
      equipment_cost: null,
      other_cost: null,
      subcontract_cost: null,
      ...initialData,
      unit: initialData?.unit || 'sq m',
    };
    setFormData(newFormData);

    // Prepare string costStrings based on initialData (or defaults)
    setCostStrings({
      quantity: String(newFormData.quantity ?? 1), // Use value from newFormData
      material_cost: String(newFormData.material_cost ?? ''),
      labor_cost: String(newFormData.labor_cost ?? ''),
      equipment_cost: String(newFormData.equipment_cost ?? ''),
      other_cost: String(newFormData.other_cost ?? ''),
      subcontract_cost: String(newFormData.subcontract_cost ?? ''),
    });

  }, [JSON.stringify(initialData)]); // Depend on stringified content

  // Generic handler for non-numeric text inputs
  const handleChange = (name: keyof Omit<QuoteItemFormData, 'quantity' | 'material_cost' | 'labor_cost' | 'equipment_cost' | 'other_cost' | 'subcontract_cost'>, value: string) => {
    setFormData(prevData => ({
      ...prevData,
      [name]: value, // Directly update non-numeric fields
    }));
  };

  // Specific handler for cost/quantity inputs - updates both string state and numeric formData state
  const handleCostInputChange = (
      name: keyof typeof costStrings, // Use keys from costStrings state
      text: string
  ) => {
      // 1. Update the string state immediately for display
      setCostStrings(prev => ({ ...prev, [name]: text }));

      // 2. Validate and parse the input text
      if (text === '') {
          // If input is empty, set numeric state to null (or 0 for quantity?)
          // Let's keep quantity as 1 minimum, others null
          if (name === 'quantity') {
              setFormData(prevData => ({ ...prevData, [name]: 1 })); // Keep quantity at least 1
          } else {
              setFormData(prevData => ({ ...prevData, [name]: null }));
          }
          return;
      }

      // Allow only digits and one decimal point. Replace comma.
      const sanitizedText = text.replace(',', '.');
      // Regex to match valid decimal number format (optional leading digits, optional single decimal, optional trailing digits)
      // Allows formats like: "", ".", ".5", "5", "5.", "5.5"
      const validDecimalRegex = /^\d*\.?\d*$/;

      if (validDecimalRegex.test(sanitizedText)) {
          // If the text format is valid, attempt to parse
          const numericValue = parseFloat(sanitizedText);

          // Update the main formData state only if parsing is successful (not NaN)
          // Allow 0 as a valid value.
          if (!isNaN(numericValue)) {
              // Ensure quantity is at least 1
              const finalValue = (name === 'quantity') ? Math.max(1, numericValue) : numericValue;
              setFormData(prevData => ({ ...prevData, [name]: finalValue }));
          } else if (sanitizedText === '.') {
              // If the input is just ".", treat numeric value as null for now (except quantity)
              if (name !== 'quantity') {
                  setFormData(prevData => ({ ...prevData, [name]: null }));
              }
          }
          // If parsing results in NaN for other invalid formats (e.g., "1.2.3"),
          // the numeric formData state won't be updated, but the invalid string remains displayed via costStrings.
      }
      // If regex test fails, do nothing to formData, invalid string remains displayed.
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
    // Ensure quantity is a valid number > 0 before submitting
    if (typeof formData.quantity !== 'number' || isNaN(formData.quantity) || formData.quantity <= 0) {
       Alert.alert('Validation Error', 'Quantity must be a valid number greater than zero.');
       return;
    }
    // Submit all relevant form data
    const submitData: QuoteItemFormData = {
        title: formData.title, // Include title
        description: formData.description,
        quantity: formData.quantity, // Use the validated numeric quantity
        unit: formData.unit,
        // unit_price: formData.unit_price, // REMOVED
        // Include new cost and markup fields (using snake_case)
        // Ensure costs are numbers or null
        material_cost: typeof formData.material_cost === 'number' && !isNaN(formData.material_cost) ? formData.material_cost : null,
        labor_cost: typeof formData.labor_cost === 'number' && !isNaN(formData.labor_cost) ? formData.labor_cost : null,
        equipment_cost: typeof formData.equipment_cost === 'number' && !isNaN(formData.equipment_cost) ? formData.equipment_cost : null,
        other_cost: typeof formData.other_cost === 'number' && !isNaN(formData.other_cost) ? formData.other_cost : null,
        subcontract_cost: typeof formData.subcontract_cost === 'number' && !isNaN(formData.subcontract_cost) ? formData.subcontract_cost : null,
        // Markups omitted
        // Include linking fields if they exist in formData (set by costbook selection)
        item_id: formData.item_id,
        costbook_item_id: formData.costbook_item_id,
        // quote_group_id is handled by the modal/parent component
    };
    // console.log('QuoteItemForm: Calling onSubmit with:', submitData); // Remove log
    onSubmit(submitData);
  };

  const handleSelectFromCostbook = () => {
      setIsBrowserVisible(true); // Open the browser modal
  };

  // Callback function when an item is selected from the browser modal
  const handleCostbookItemSelected = (selectedItem: SelectedCostbookItem) => {
      // Update numeric formData
      setFormData(prevData => ({
          ...prevData, // Keep existing quantity, etc.? Or reset? Let's reset quantity to 1
          quantity: 1, // Reset quantity when selecting from costbook
          title: selectedItem.title, // Use title from selected item
          description: selectedItem.description,
          unit: selectedItem.unit,
          item_id: selectedItem.item_id, // Link to base item
          costbook_item_id: selectedItem.costbook_item_id, // Link to specific costbook pricing
          material_cost: selectedItem.material_cost,
          labor_cost: selectedItem.labor_cost,
          equipment_cost: selectedItem.equipment_cost,
          other_cost: selectedItem.other_cost,
          subcontract_cost: selectedItem.subcontract_cost,
      }));
      // Update string costStrings based on selected item
      setCostStrings({
          quantity: '1', // Reset quantity string to 1
          material_cost: String(selectedItem.material_cost ?? ''),
          labor_cost: String(selectedItem.labor_cost ?? ''),
          equipment_cost: String(selectedItem.equipment_cost ?? ''),
          other_cost: String(selectedItem.other_cost ?? ''),
          subcontract_cost: String(selectedItem.subcontract_cost ?? ''),
      });
      setIsCustomItem(false); // Switch mode to non-custom
      setIsBrowserVisible(false); // Close the browser modal
  };

  return (
    <>
      <ScrollView style={styles.container}>
       {/* Mode Selector - Removed "Enter Custom Item" button */}
       <View style={styles.modeSelector}>
         {/* <Button title="Enter Custom Item" onPress={() => setIsCustomItem(true)} disabled={isCustomItem} /> */}
         {/* Keep "Select from Costbook", enable it always when adding new? Or only if isCustomItem is true? Let's keep original logic for now */}
         <Button title="Select from Costbook" onPress={handleSelectFromCostbook} disabled={!isCustomItem} />
       </View>

      {/* Added Title Input */}
      <Text style={styles.label}><Text>Title</Text></Text>
      <TextInput
        value={formData.title ?? ''}
        onChangeText={value => handleChange('title', value)}
        placeholder={isCustomItem ? "Enter item title (optional)" : "Selected item title"}
        // Title becomes read-only after costbook selection
        editable={isCustomItem}
        style={[styles.input, !isCustomItem && { backgroundColor: '#eee' }]}
      />

      <Text style={styles.label}><Text>Description *</Text></Text>
      <TextInput
        value={formData.description}
        onChangeText={value => handleChange('description', value)}
        placeholder={isCustomItem ? "Enter item description" : "Selected item description"}
        multiline
        numberOfLines={3}
        // Description remains editable
        editable={true}
        style={[styles.input, styles.textArea]} // Remove conditional background
      />

      <Text style={styles.label}><Text>Quantity *</Text></Text>
      <TextInput
        style={styles.input}
        value={costStrings.quantity} // Use string state for value
        onChangeText={value => handleCostInputChange('quantity', value)} // Use new handler
        placeholder="1"
        keyboardType="numeric" // Keep numeric keyboard, validation handles input
        // Quantity is always editable
      />

      <Text style={styles.label}><Text>Unit *</Text></Text>
      {/* Replace TextInput with Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.unit}
          onValueChange={(itemValue) => handleChange('unit', itemValue)}
          // Unit becomes read-only after costbook selection
          enabled={isCustomItem}
          style={[styles.picker, !isCustomItem && { backgroundColor: '#eee' }]} // Add background style when disabled
          dropdownIconColor={!isCustomItem ? '#ccc' : '#000'}
        >
          <Picker.Item label="Square Meters (sq m)" value="sq m" />
          <Picker.Item label="Square Feet (sq ft)" value="sq ft" />
          <Picker.Item label="Tons (ton)" value="ton" />
          <Picker.Item label="Cubic Meters (m³)" value="m³" />
          {/* Add other common units if needed */}
          <Picker.Item label="Each (ea)" value="ea" />
          <Picker.Item label="Linear Meters (lm)" value="lm" />
          <Picker.Item label="Linear Feet (lf)" value="lf" />
        </Picker>
      </View>

      {/* REMOVED Unit Price Input */}
      {/* <Text style={styles.label}>Unit Price *</Text> ... */}

      {/* --- NEW Cost & Markup Inputs --- */}
      <Text style={styles.sectionHeader}><Text>Cost Components (Per Unit)</Text></Text>
      {/* Display Calculated Total Cost */}
      <View style={styles.totalCostContainer}>
        <Text style={styles.label}><Text>Total Cost / Unit:</Text></Text>
        <Text style={styles.calculatedValue}>
          <Text>$</Text>
          <Text>
            {(
              (formData.material_cost ?? 0) +
              (formData.labor_cost ?? 0) +
              (formData.equipment_cost ?? 0) +
              (formData.other_cost ?? 0) +
              (formData.subcontract_cost ?? 0)
            ).toFixed(2)}
          </Text>
        </Text>
      </View>
      <View style={styles.costRow}>
        <View style={styles.costInputContainer}>
            <Text style={styles.label}><Text>Material</Text></Text>
            <TextInput style={styles.input} value={costStrings.material_cost} onChangeText={v => handleCostInputChange('material_cost', v)} placeholder="0.00" keyboardType="decimal-pad" />
        </View>
        <View style={styles.costInputContainer}>
            <Text style={styles.label}><Text>Labour</Text></Text>
            <TextInput style={styles.input} value={costStrings.labor_cost} onChangeText={v => handleCostInputChange('labor_cost', v)} placeholder="0.00" keyboardType="decimal-pad" />
        </View>
      </View>
      <View style={styles.costRow}>
        <View style={styles.costInputContainer}>
            <Text style={styles.label}><Text>Equipment</Text></Text>
            <TextInput style={styles.input} value={costStrings.equipment_cost} onChangeText={v => handleCostInputChange('equipment_cost', v)} placeholder="0.00" keyboardType="decimal-pad" />
        </View>
         <View style={styles.costInputContainer}>
            <Text style={styles.label}><Text>Other</Text></Text>
            <TextInput style={styles.input} value={costStrings.other_cost} onChangeText={v => handleCostInputChange('other_cost', v)} placeholder="0.00" keyboardType="decimal-pad" />
        </View>
      </View>
       <View style={styles.costRow}>
         <View style={styles.costInputContainer}>
            <Text style={styles.label}><Text>Subcontract</Text></Text>
            <TextInput style={styles.input} value={costStrings.subcontract_cost} onChangeText={v => handleCostInputChange('subcontract_cost', v)} placeholder="0.00" keyboardType="decimal-pad" />
        </View>
        <View style={styles.costInputContainer} />{/* Placeholder for alignment */}
      </View>
      {/* Markups omitted based on user feedback */}
      {/* --- END NEW Cost Inputs --- */}


      {/* Display selected costbook item info if applicable */}
      {!isCustomItem && formData.item_id && (
          <Text style={styles.infoText}><Text>Selected from Costbook (Item ID: {formData.item_id})</Text></Text>
      )}


      <View style={styles.buttonContainer}>
        <Button
          title={submitButtonText}
          onPress={handleSubmit}
          disabled={isSubmitting}
        />
        {/* Log isSubmitting state */}
        {/* <Text>DEBUG: isSubmitting = {String(isSubmitting)}</Text> */}
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
    paddingBottom: 50,
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
    textAlignVertical: 'top',
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 5,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5, // Adjust spacing between rows if needed
  },
  costInputContainer: {
    flex: 1,
    marginHorizontal: 5, // Add horizontal spacing between inputs
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
  // Add missing styles
  pickerContainer: {
    height: 50, // Adjust height as needed
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    justifyContent: 'center', // Center picker content vertically
    backgroundColor: '#fff',
  },
  picker: {
    height: '100%',
    width: '100%',
    // Add any platform-specific styles if needed
  },
  totalCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingVertical: 10,
    paddingHorizontal: 5,
    backgroundColor: '#f0f0f0', // Light background to highlight
    borderRadius: 5,
  },
  calculatedValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default QuoteItemForm;
