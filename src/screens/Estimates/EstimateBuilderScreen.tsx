import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
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
import { Button as NativeButton } from 'react-native';
import EstimateNodeDisplay from './EstimateNodeDisplay'; // Import the new component
import JobSelectionModal from '../../components/Job/JobSelectionModal';

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
    currentQuoteId, // Get current quote ID
    setCurrentQuoteId, // Get setter for quote ID
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

  // Job selection modal state
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  // Configure the back button in the navigation header
  useLayoutEffect(() => {
    // Get the navigation state to determine where we came from
    const state = navigation.getState();
    const routes = state.routes;
    const currentRouteIndex = state.index;
    
    // Check if we have a previous route
    if (currentRouteIndex > 0) {
      const previousRoute = routes[currentRouteIndex - 1];
      console.log('Previous route:', previousRoute);
      
      // Use the default back button which will show as an arrow
      navigation.setOptions({
        headerLeft: undefined, // Let React Navigation use its default back button (arrow)
      });
    } else {
      // If there's no previous route, provide a default back behavior
      // But still use the arrow style for consistency
      navigation.setOptions({
        // Use the default back button style but with custom navigation
        headerBackTitle: 'Jobs',
        headerBackVisible: true, // Show the back button
        headerLeft: () => (
          <TouchableOpacity 
            style={{ marginLeft: 10, padding: 5 }}
            onPress={() => {
              // Use CommonActions to navigate to the Jobs stack
              const { CommonActions } = require('@react-navigation/native');
              navigation.dispatch(
                CommonActions.navigate({
                  name: 'Jobs',
                  params: {
                    screen: 'JobList'
                  }
                })
              );
            }}
          >
            <Text style={{ fontSize: 24, color: '#007AFF' }}>←</Text>
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation]);

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
      setCurrentQuoteId(quoteData.estimate_id); // Set the quote ID in context

      // Always fetch customer details from the database based on the quote's customer_id
      // This ensures we're always using the correct customer for this quote
      if (quoteData.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('customer_id, first_name, last_name, address, city, postal_code') // Select fields needed for context/display
          .eq('customer_id', quoteData.customer_id)
          .single();
        if (customerError) {
          console.warn("Error fetching customer:", customerError.message);
          setSelectedCustomer(null);
        } else if (customerData) {
          // Always update the context with the customer from the database
          setSelectedCustomer(customerData);
        }
      } else {
        setSelectedCustomer(null); // No customer linked to this quote
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
  }, [estimateId, setSelectedCustomer, buildTreeFromFlatData]); // Remove selectedCustomer from dependency array

  useEffect(() => {
    if (estimateId) {
      fetchData();
    } else {
      // This is a new estimate (no estimateId).
      // Clear the tree in context for a fresh start
      buildTreeFromFlatData([], []); // Call with empty arrays to clear tree
      // Context customer should be set before navigating here.
      // Create the quote record in Supabase
      const createNewQuote = async () => {
        if (!selectedCustomer) {
          setError("Cannot create quote: No customer selected.");
          Alert.alert("Error", "Please select a customer before creating an estimate.");
          setLoading(false);
          // Optionally navigate back or disable functionality
          return;
        }
        try {
          const { data: newQuote, error: insertError } = await supabase
            .from('quotes')
            .insert({
              customer_id: selectedCustomer.customer_id,
              // Add other default fields for a new quote if necessary
              // e.g., status: 'Draft', name: jobTitle || 'New Estimate'
              name: title || 'New Estimate', // Use title state
              status: 'Draft',
            })
            .select('estimate_id') // Select the ID of the newly created quote
            .single();

          if (insertError) throw insertError;
          if (!newQuote || !newQuote.estimate_id) throw new Error("Failed to retrieve new quote ID.");

          console.log('New quote created with ID:', newQuote.estimate_id);
          setCurrentQuoteId(newQuote.estimate_id); // Set the new quote ID in context
          // Update route params or screen state if needed to reflect the new ID?
          // For now, context holds the ID.
          setQuote({ estimate_id: newQuote.estimate_id, customer_id: selectedCustomer.customer_id, subtotal: 0, overhead: 0, profit: 0, contingency: 0, discount: 0, tax_amount: 0, total: 0, status: 'Draft' }); // Set basic quote details locally

        } catch (e: any) {
          setError(`Failed to create quote: ${e.message}`);
          Alert.alert('Error', `Failed to create quote: ${e.message}`);
        } finally {
          setLoading(false);
        }
      };
      createNewQuote();
    }
  // Remove selectedCustomer from dependency array to prevent infinite loop
  }, [estimateId, fetchData, buildTreeFromFlatData, setCurrentQuoteId, title]);


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

    // Sanitize the data returned from Supabase before adding to the tree state
    const sanitizedData: QuoteItem = {
        ...savedItemData,
        title: savedItemData.title ?? '', // Ensure title is string or empty string
        description: savedItemData.description ?? '', // Ensure description is string or empty string
        unit: savedItemData.unit ?? '', // Ensure unit is string or empty string
        // Add other fields that might be null and rendered as text if necessary
    };

    // Convert sanitized data back to node for context update/add
    // Use sanitizedData here instead of savedItemData
    const savedNode: QuoteItemNode = { ...sanitizedData, type: 'item' };

    if (itemToEdit) {
      // We were editing, call updateNode
      // console.log('EstimateBuilderScreen: Updating node:', savedNode); // Remove log
      updateNode(savedNode);
    } else {
      // We were adding, call addNode
      // targetGroupId was set when opening the modal for adding
      // console.log('EstimateBuilderScreen: Adding node:', savedNode, 'to group:', targetGroupId); // Remove log
      addNode(savedNode, targetGroupId);
    }
    // Modal closes itself on successful save now
  };
  const handleGeneratePdf = async () => { /* ... */ }; // Keep as is for now
  const handleConvertToJob = async () => { /* ... */ }; // Keep as is for now
  
  const handleDeleteEstimate = async () => {
    if (!currentQuoteId) {
      Alert.alert('Error', 'No estimate to delete.');
      return;
    }

    Alert.alert(
      "Confirm Deletion",
      "Are you sure you want to delete this estimate? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              setLoading(true); // Show loading indicator during delete
              
              // First, delete all quote items
              const { error: itemsDeleteError } = await supabase
                .from('quote_items')
                .delete()
                .eq('quote_id', currentQuoteId);
              
              if (itemsDeleteError) throw itemsDeleteError;
              
              // Then, delete all quote groups
              const { error: groupsDeleteError } = await supabase
                .from('quote_groups')
                .delete()
                .eq('quote_id', currentQuoteId);
              
              if (groupsDeleteError) throw groupsDeleteError;
              
              // Finally, delete the quote itself
              const { error: quoteDeleteError } = await supabase
                .from('quotes')
                .delete()
                .eq('estimate_id', currentQuoteId);
              
              if (quoteDeleteError) throw quoteDeleteError;

              Alert.alert("Success", "Estimate deleted successfully.");
              
              // Check if we have a customer to navigate back to
              // Use the customer_id from the quote object, not the selectedCustomer from context
              if (quote && quote.customer_id) {
                // Use CommonActions to navigate back to the customer detail screen
                const { CommonActions } = require('@react-navigation/native');
                navigation.dispatch(
                  CommonActions.navigate({
                    name: 'Customers',
                    params: {
                      screen: 'CustomerDetail',
                      params: { customerId: quote.customer_id }
                    }
                  })
                );
              } else {
                // Default fallback: just go back one screen
                navigation.goBack();
              }

            } catch (e: any) {
              setError(e.message); // Set error state
              Alert.alert('Error Deleting Estimate', e.message);
            } finally {
              setLoading(false); // Hide loading indicator
            }
          } 
        },
      ]
    );
  };
  // --- End Other handlers ---


  // Simplified Loading/Error/Not Found States
  if (loading) {
     return <View style={styles.centered}><Text><Text>Loading...</Text></Text></View>; // Simpler loading
  }
  if (error) {
    return <View style={styles.centered}><Text><Text>Error loading data.</Text></Text></View>; // Simpler error
  }
  if (estimateId && !quote) { // Simplified not found check
     return <View style={styles.centered}><Text><Text>Quote not found.</Text></Text></View>;
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
          {/* Job selection */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
            <Text style={{ fontWeight: 'bold', marginRight: 8 }}>Job:</Text>
            {selectedJob ? (
              <Text style={{ flex: 1 }}>
                {selectedJob.name || 'Untitled'} {selectedJob.number ? `(#${selectedJob.number})` : ''}
                {selectedJob.status ? ` - ${selectedJob.status}` : ''}
              </Text>
            ) : (
              <Text style={{ flex: 1, color: '#888' }}>No job selected</Text>
            )}
            <NativeButton title="Select Job" onPress={() => setJobModalVisible(true)} />
          </View>
          <View style={styles.customerHeader}>
              {/* Use selectedCustomer from context for display, explicit Text wrapping */}
            <View style={styles.customerInfo}>
              <Text style={styles.customerNameText}>
                <Text>Customer: </Text>
                <Text>{selectedCustomer ? 
                  (selectedCustomer.first_name || '') + ' ' + (selectedCustomer.last_name || '') : 
                  'N/A'}</Text>
              </Text>
              {/* Use ternary operator for conditional rendering */}
              {selectedCustomer ? (
                <Text style={styles.customerAddressText}>
                  <Text>{selectedCustomer.address || ''}</Text>
                  {selectedCustomer.address && (selectedCustomer.city || selectedCustomer.postal_code) ? 
                    <Text>, </Text> : 
                    null}
                  <Text>{selectedCustomer.city || ''}</Text>
                  <Text> {selectedCustomer.postal_code || ''}</Text>
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
               <Text style={styles.emptyText}><Text>No items or groups added yet.</Text></Text>
             ) : (
               estimateTree.map(node => <EstimateNodeDisplay key={node.type === 'item' ? node.quote_item_id : node.quote_group_id} node={node} />)
              )}
            */}
           {/* Replace placeholder with actual recursive rendering */}
           {estimateTree.length === 0 ? (
               <Text style={styles.emptyText}><Text>No items or groups added yet.</Text></Text>
             ) : (
               estimateTree.map(node => (
                 <EstimateNodeDisplay
                   key={node.type === 'item' ? node.quote_item_id : node.quote_group_id}
                   node={node}
                   level={0} // Start top-level nodes at level 0
                   onEditItem={handleEditItem} // Pass the screen's handler down
                 />
               ))
             )}
           {/* Buttons to add top-level items/groups */}
           <View style={styles.topLevelAddButtons}>
             {/* Disable buttons if currentQuoteId is null */}
             <Button title="+ Add Top-Level Group" onPress={() => handleAddGroup(null)} disabled={!currentQuoteId} />
             <Button title="+ Add Item" onPress={() => handleAddItem(null)} disabled={!currentQuoteId} />
           </View>
         </View>

         {/* Action Buttons - Keep Add Group (now calls context), others might change */}
        <View style={styles.actionButtons}>
            {/* This button now correctly calls the context's handleAddGroup via the destructured variable */}
            {/* <Button title="Add Group" onPress={handleAddGroup} disabled={loading} /> */}
            {/* Note: The "+ Add Top-Level Group" button inside itemsSection already calls handleAddGroup(null) */}
            <Button title="Generate PDF" onPress={handleGeneratePdf} disabled={loading} />
            <Button title="Convert to Job" onPress={handleConvertToJob} disabled={loading} />
            <Button title="Delete Estimate" onPress={handleDeleteEstimate} color="red" disabled={loading} />
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
      {/* Job Selection Modal */}
      <JobSelectionModal
        visible={jobModalVisible}
        onClose={() => setJobModalVisible(false)}
        onSelect={job => {
          setSelectedJob(job);
          setJobModalVisible(false);
        }}
      />
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
  grandTotalValue: { fontWeight: 'bold', color: '#000', },
  topLevelAddButtons: { // Style for the container of top-level add buttons
    flexDirection: 'row',
    justifyContent: 'space-around', // Space out buttons
    marginTop: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  }
});

export default EstimateBuilderScreen;
