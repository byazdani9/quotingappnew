import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, ActivityIndicator, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { JobStackParamList } from '../../../App'; // Adjust path if needed
// Import context hook and NEW types
import {
  useEstimateBuilder,
  EstimateTreeNode, // Import the main node type
  QuoteGroupNode,   // Import specific node types if needed for checks
  QuoteItemNode,
  QuoteGroup as FlatQuoteGroup, // Keep original flat type for fetching if needed
} from '../../contexts/EstimateBuilderContext';
import { supabase } from '../../lib/supabaseClient';
import QuoteItemModal, { QuoteItem } from '../../components/QuoteItem/QuoteItemModal';
import { TouchableOpacity, Button as NativeButton } from 'react-native';
import EstimateNodeDisplay from './EstimateNodeDisplay'; // Import the new component

// Define types for data (can be refined)
type QuoteDetails = {
  estimate_id: string;
  customer_id: string | null;
  subtotal: number | null;
  overhead: number | null;
  profit: number | null;
  contingency: number | null;
  discount: number | null;
  tax_amount: number | null;
  total: number | null;
  status?: string | null;
};
// Keep CustomerDetails type if needed elsewhere, but we'll use context type for display
type CustomerDetails = { customer_id: string; first_name: string; last_name: string; /* etc */ };
// No longer need local QuoteGroup type, use types from context


// Update Props to use NativeStackScreenProps with JobStackParamList
type Props = NativeStackScreenProps<JobStackParamList, 'EstimateBuilder'>;

const EstimateBuilderScreen: React.FC<Props> = ({ route, navigation }) => {
  // Get params from route
  const estimateId = route.params?.estimateId;
  const jobTitle = route.params?.jobTitle;
  const templateId = route.params?.templateId;

  // Get customer data and setters from context
  const {
    selectedCustomer,
    setSelectedCustomer,
    estimateTree, // Use the new tree state
    // setEstimateTree, // Avoid direct setting from screen if possible
    buildTreeFromFlatData, // Function to build the tree
    addNode, // Placeholder functions from context
    updateNode,
    moveNode, // Low-level placeholder
    deleteNode, // Low-level placeholder
    // Destructure higher-level handlers (Remove add/edit item handlers as they are handled locally by screen for modal)
    // handleAddItem,
    // handleEditItem,
    handleAddGroup,
    handleEditGroup,
    handleMoveNode,
    handleDeleteNode,
    // Get calculated totals from context
    subtotal,
    discountAmount,
    totalWithDiscount,
    taxAmount,
    finalTotal,
  } = useEstimateBuilder();

  const [quote, setQuote] = useState<QuoteDetails | null>(null); // Keep for initial load/status etc.
  const [title, setTitle] = useState<string>(jobTitle || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<QuoteItem | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null);

  // --- Customer Selection ---
  const handleSelectCustomer = () => {
    // Navigate to the selection screen, passing required params
    navigation.navigate('CustomerSelectionScreen', {
      jobTitle: title, // Use the current title state
      templateId: templateId, // Pass the templateId from route params
    });
  };
  // --- End Customer Selection ---

  // Remove useEffect listening for route.params.selectedCustomer

  const fetchData = useCallback(async () => {
    // Only proceed if estimateId exists
    if (!estimateId) {
      // If creating a new estimate, ensure context customer is cleared initially?
      // Or handle this when navigating TO this screen.
      // For now, assume context is managed correctly elsewhere or on initial load.
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch quote details
      const quoteColumns = 'estimate_id, customer_id, subtotal, overhead, profit, contingency, discount, tax_amount, total, status';
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(quoteColumns)
        .eq('estimate_id', estimateId)
        .single();
      if (quoteError) throw quoteError;
      if (!quoteData) throw new Error('Quote not found');
      setQuote(quoteData);

      // Fetch customer details ONLY if not already in context AND quote has customer_id
      // This prevents overwriting a newly selected customer from context
      if (!selectedCustomer && quoteData.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('customer_id, first_name, last_name') // Select fields needed for context/display
          .eq('customer_id', quoteData.customer_id)
          .single();
        if (customerError) throw customerError;
        // Set the customer in the context if fetched from DB
        if (customerData) {
            setSelectedCustomer(customerData);
        }
      } else if (selectedCustomer && quoteData.customer_id !== selectedCustomer.customer_id) {
          // TODO: Handle discrepancy? Maybe update quote's customer_id based on context?
          // For now, context takes precedence if it exists.
          console.warn("Context customer differs from quote's customer_id");
      }

      // Fetch groups (as flat data)
      const { data: groupsData, error: groupsError } = await supabase
        .from('quote_groups')
        .select('*')
        .eq('quote_id', estimateId)
        .order('order_index', { ascending: true });
      if (groupsError) throw groupsError;

      // Fetch items (as flat data)
      // TODO: Update select to include new cost/markup fields when they are in DB
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*') // Select all fields for QuoteItemNode type
        .eq('quote_id', estimateId)
        .order('order_index', { ascending: true });
      if (itemsError) throw itemsError;

      // Build the tree using the context function
      buildTreeFromFlatData(groupsData || [], (itemsData as QuoteItem[]) || []);

    } catch (e: any) {
      setError(e.message);
      Alert.alert('Error loading estimate data', e.message);
    } finally {
      setLoading(false);
    }
  }, [estimateId, selectedCustomer, setSelectedCustomer, buildTreeFromFlatData]); // Update dependency array

  useEffect(() => {
    if (estimateId) {
      fetchData();
    } else {
      // This is a new estimate (no estimateId).
      // Clear the tree in context for a fresh start
      buildTreeFromFlatData([], []); // Call with empty arrays to clear tree
      // Context customer is set before navigating here.
      setLoading(false);
    }
  }, [estimateId, fetchData, buildTreeFromFlatData]); // Update dependency array


  // --- Old structuring logic removed ---
  // const structuredData = React.useMemo(() => { ... }, [groups, items]);


  // Apply template logic - Moved up to ensure hooks are called before early returns
  useEffect(() => {
    // Move the condition inside the effect
    if (templateId && !estimateId) {
      console.log(`Applying template: ${templateId}`);
      // Future template loading logic here
    }
    // The effect itself always runs, but the logic inside is conditional
  }, [templateId, estimateId]); // Dependencies remain the same

  // --- Reordering Logic --- (Placeholder - Use context function)
  const handleMove = async (nodeId: string, nodeType: 'item' | 'group', direction: 'up' | 'down') => {
    console.log('handleMove called (screen level)', { nodeId, nodeType, direction });
    // TODO: Calculate newParentGroupId and newOrderIndex based on direction and current tree structure
    // Then call context function: moveNode(nodeId, nodeType, newParentGroupId, newOrderIndex);
  };
  // --- End Reordering Logic ---

  // --- Add Group Logic --- (Local definition removed, using context's handleAddGroup directly)
  // const handleAddGroup = () => { ... };
  // --- End Add Group Logic ---

  // --- Other handlers ---
  const handleAddItem = (groupId: string | null = null) => {
    console.log('handleAddItem called (screen level)', { groupId });
    setItemToEdit(null); // Ensure we are adding, not editing
    setTargetGroupId(groupId); // Set the target group for the modal
    setIsItemModalVisible(true);
  };
  const handleEditItem = (item: QuoteItemNode) => { // Accept QuoteItemNode
    console.log('handleEditItem called (screen level)', { item });
    setItemToEdit(item); // Pass the full item node
    setTargetGroupId(null); // Not needed when editing
    setIsItemModalVisible(true);
  };
  const handleItemModalClose = () => {
    setIsItemModalVisible(false);
    setItemToEdit(null);
    setTargetGroupId(null);
  };
  // Update handleItemModalSave to use context functions
  const handleItemModalSave = (savedItemData: QuoteItem) => { // Modal returns flat QuoteItem
    console.log('handleItemModalSave called (screen level)', { savedItemData });
    // Convert flat data back to node for context update/add
    const savedNode: QuoteItemNode = { ...savedItemData, type: 'item' };

    if (itemToEdit) {
      // We were editing, call updateNode
      updateNode(savedNode);
    } else {
      // We were adding, call addNode
      // targetGroupId was set when opening the modal for adding
      addNode(savedNode, targetGroupId);
    }
    // Modal closes itself on successful save now
  };
  const handleGeneratePdf = async () => { /* ... */ }; // Keep as is for now
  const handleConvertToJob = async () => { /* ... */ }; // Keep as is for now
  // --- End Other handlers ---


  // Simplified Loading/Error/Not Found States
  if (loading) {
     return <View style={styles.centered}><Text>Loading...</Text></View>; // Simpler loading
  }
  if (error) {
    return <View style={styles.centered}><Text>Error loading data.</Text></View>; // Simpler error
  }
  if (estimateId && !quote) { // Simplified not found check
     return <View style={styles.centered}><Text>Quote not found.</Text></View>;
  }

  // Template logic useEffect moved above the early returns

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.container}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.quoteNumber}>
            {estimateId ? `Quote #: ${quote?.estimate_id}` : 'New Estimate'}
          </Text>
          <Text style={styles.jobTitle}>{title || 'Untitled Job'}</Text>
          <View style={styles.customerHeader}>
            {/* Use selectedCustomer from context for display, explicit Text wrapping */}
            <View style={styles.customerInfo}>
              <Text style={styles.customerNameText}>
                <Text>Customer: </Text><Text>{selectedCustomer ? `${selectedCustomer.first_name ?? ''} ${selectedCustomer.last_name ?? ''}`.trim() : 'N/A'}</Text>
              </Text>
              {/* Use ternary operator for conditional rendering */}
              {selectedCustomer ? (
                <Text style={styles.customerAddressText}>
                  {`${selectedCustomer.address || ''}${selectedCustomer.address && (selectedCustomer.city || selectedCustomer.postal_code) ? ', ' : ''}${selectedCustomer.city || ''} ${selectedCustomer.postal_code || ''}`.trim()}
                </Text>
              ) : null}
            </View>
            <NativeButton
              title={selectedCustomer ? "Edit Customer" : "Select Customer"}
              onPress={handleSelectCustomer}
            />
          </View>
          {/* Display finalTotal from context with default, explicit Text wrapping */}
          <Text style={styles.totalText}><Text>Total: $</Text><Text>{(finalTotal ?? 0).toFixed(2)}</Text></Text>
        </View>

        {/* Items/Groups Section - Placeholder for Recursive Rendering */}
        <View style={styles.itemsSection}>
           <Text style={styles.sectionTitle}>Items & Groups</Text>
           {/*
             TODO: Replace this section with recursive rendering component.
             The component will take the estimateTree from context and render nodes.
             Example structure:
             {estimateTree.length === 0 ? (
               <Text style={styles.emptyText}>No items or groups added yet.</Text>
             ) : (
               estimateTree.map(node => <EstimateNodeDisplay key={node.type === 'item' ? node.quote_item_id : node.quote_group_id} node={node} />)
              )}
            */}
           {/* Replace placeholder with actual recursive rendering */}
           {estimateTree.length === 0 ? (
               <Text style={styles.emptyText}>No items or groups added yet.</Text>
             ) : (
               estimateTree.map(node => (
                 <EstimateNodeDisplay
                   key={node.type === 'item' ? node.quote_item_id : node.quote_group_id}
                   node={node}
                   level={0} // Start top-level nodes at level 0
                   // Pass handlers if needed, though component uses context now
                 />
               ))
             )}
           {/* Button to add top-level group */}
           <Button title="+ Add Top-Level Group" onPress={() => handleAddGroup(null)} />
           {/* Add Item button might need context (e.g., add to root group or specific group) - Removed for now */}
         </View>

         {/* Action Buttons - Keep Add Group (now calls context), others might change */}
        <View style={styles.actionButtons}>
            {/* This button now correctly calls the context's handleAddGroup via the destructured variable */}
            {/* <Button title="Add Group" onPress={handleAddGroup} disabled={loading} /> */}
            {/* Note: The "+ Add Top-Level Group" button inside itemsSection already calls handleAddGroup(null) */}
            <Button title="Generate PDF" onPress={handleGeneratePdf} disabled={loading} />
            <Button title="Convert to Job" onPress={handleConvertToJob} disabled={loading} />
        </View>

        {/* Totals Summary Section */}
         {/* Totals Summary Section - Use context values, explicit Text wrapping */}
         <View style={styles.totalsContainer}>
             <Text style={styles.sectionTitle}><Text>Totals</Text></Text>
             {/* Display detailed breakdown based on context calculations (simplified) */}
             <View style={styles.totalRow}>
                <Text style={styles.totalLabel}><Text>Subtotal (Item Costs):</Text></Text>
                {/* Subtotal now represents the sum of item costs * quantity */}
                <Text style={styles.totalValue}><Text>$</Text><Text>{(subtotal ?? 0).toFixed(2)}</Text></Text>
             </View>
              {/* Optional: Display summed markups if needed - Omitted for now */}
             {/* <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>   Overhead:</Text>
                <Text style={styles.totalValue}>${(overheadTotal ?? 0).toFixed(2)}</Text>
             </View>
             <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>   Profit:</Text>
                <Text style={styles.totalValue}>${(profitTotal ?? 0).toFixed(2)}</Text>
             </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>   Contingency:</Text>
                <Text style={styles.totalValue}>${(contingencyTotal ?? 0).toFixed(2)}</Text>
             </View> */}
             {/* Display Discount if applied - Use ternary operator */}
             {(discountAmount ?? 0) > 0 ? (
                 <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}><Text>Discount:</Text></Text>
                    <Text style={styles.totalValue}><Text>-$</Text><Text>{(discountAmount ?? 0).toFixed(2)}</Text></Text>
                 </View>
             ) : null}
             <View style={styles.totalRow}>
                <Text style={styles.totalLabel}><Text>Total before Tax:</Text></Text>
                <Text style={styles.totalValue}><Text>$</Text><Text>{(totalWithDiscount ?? 0).toFixed(2)}</Text></Text>
             </View>
             <View style={styles.totalRow}>
                <Text style={styles.totalLabel}><Text>Tax (13%):</Text></Text>
                <Text style={styles.totalValue}><Text>$</Text><Text>{(taxAmount ?? 0).toFixed(2)}</Text></Text>
             </View>
             <View style={[styles.totalRow, styles.grandTotalRow]}>
                <Text style={[styles.totalLabel, styles.grandTotalLabel]}><Text>Price:</Text></Text>
                <Text style={[styles.totalValue, styles.grandTotalValue]}><Text>$</Text><Text>{(finalTotal ?? 0).toFixed(2)}</Text></Text>
             </View>
        </View>
      </ScrollView>

      {/* Item Modal */}
      {/* Item Modal - Pass itemToEdit (which is QuoteItemNode | null) */}
      <QuoteItemModal
        isVisible={isItemModalVisible}
        onClose={handleItemModalClose}
        quoteId={estimateId!} // Ensure estimateId is available or handle null case
        itemToEdit={itemToEdit} // Pass the item node directly
        onSave={handleItemModalSave}
        targetGroupId={targetGroupId} // Pass the target group ID for adding
      />
      {/* Customer Modal removed */}
    </View>
  );
};

// Styles remain the same
const styles = StyleSheet.create({
  container: { flex: 1, },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', },
  errorText: { color: 'red', fontSize: 16, },
  header: { padding: 15, backgroundColor: '#f0f0f0', borderBottomWidth: 1, borderBottomColor: '#ccc', },
  quoteNumber: { fontSize: 18, fontWeight: 'bold', },
  jobTitle: { fontSize: 16, marginVertical: 3, color: '#444' },
  customerHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', // Align items to the top for multi-line address
    marginVertical: 5, 
  },
  customerInfo: {
    flex: 1, // Allow text to take available space
    marginRight: 10, // Add space between text and button
  },
  customerNameText: {
    fontSize: 14, // Adjust size as needed
    marginBottom: 2, // Space between name and address
  },
  customerAddressText: {
    fontSize: 12, // Smaller size for address
    color: 'gray',
  },
  totalText: { fontSize: 16, fontWeight: 'bold', marginTop: 5, },
  itemsSection: { padding: 15, },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, },
  groupHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, },
  groupActionButtons: { flexDirection: 'row', },
  groupContainer: { marginBottom: 15, paddingLeft: 5, },
  groupHeader: { fontSize: 16, fontWeight: 'bold', color: '#555', flex: 1, marginRight: 5, },
  rowWithButtons: { flexDirection: 'row', alignItems: 'center', },
  reorderButtons: { flexDirection: 'column', marginLeft: 5, },
  itemContainer: { paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#eee', },
  ungroupedItem: { },
  itemDescription: { },
  itemDetails: { fontSize: 12, color: 'gray', marginTop: 2, },
  emptyGroupText: { fontStyle: 'italic', color: 'gray', paddingLeft: 10, },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: 'gray', },
  actionButtons: { padding: 15, },
  totalsContainer: { padding: 15, marginTop: 10, borderTopWidth: 1, borderTopColor: '#ccc', backgroundColor: '#f9f9f9', },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5, },
  totalLabel: { fontSize: 16, color: '#555', },
  totalValue: { fontSize: 16, fontWeight: '500', },
  grandTotalRow: { borderTopWidth: 1, borderTopColor: '#ccc', marginTop: 10, paddingTop: 10, },
  grandTotalLabel: { fontWeight: 'bold', color: '#000', },
  grandTotalValue: { fontWeight: 'bold', color: '#000', }
});

export default EstimateBuilderScreen;
