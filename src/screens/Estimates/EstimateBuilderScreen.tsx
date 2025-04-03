import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, ActivityIndicator, Alert } from 'react-native';
// Need navigation types, specifically for route params
import { NativeStackScreenProps } from '@react-navigation/native-stack';
// Assuming we'll add this screen to a stack navigator nested within the Drawer or similar
// We need to define the param list for that stack
// Example: type EstimatesStackParamList = { EstimatesList: undefined; EstimateBuilder: { estimateId: string }; };
// Import the actual stack param list from App.tsx
import { EstimateStackParamList } from '../../../App'; // Adjust path if App.tsx is moved

// Define the Props type using the imported param list
type Props = NativeStackScreenProps<EstimateStackParamList, 'EstimateBuilder'>;


import { supabase } from '../../lib/supabaseClient';
// Import the modal AND the exported type
import QuoteItemModal, { QuoteItem } from '../../components/QuoteItem/QuoteItemModal';
import { TouchableOpacity } from 'react-native'; // Ensure TouchableOpacity is imported

// Define types for data (can be refined)
type QuoteDetails = {
  estimate_id: string;
  // estimate_number: string; // Removed - Does not exist in DB query result
  customer_id: string | null;
  subtotal: number | null;
  overhead: number | null; // Added
  profit: number | null; // Added
  contingency: number | null; // Added
  discount: number | null; // Added
  tax_amount: number | null; // Added
  total: number | null; 
  status?: string | null; // Added status field
};
type CustomerDetails = { customer_id: string; first_name: string; last_name: string; /* etc */ };
// Simple type for groups fetched
type QuoteGroup = { quote_group_id: string; name: string; order_index: number; /* etc */ };
// We now IMPORT QuoteItem type from the modal component

// Interface for the structured data
interface GroupedItem extends QuoteGroup {
  items: QuoteItem[];
}


const EstimateBuilderScreen: React.FC<Props> = ({ route }) => {
  // Get estimateId from navigation params - it might be undefined based on the type
  const estimateId = route.params?.estimateId; 

  const [quote, setQuote] = useState<QuoteDetails | null>(null);
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [groups, setGroups] = useState<QuoteGroup[]>([]);
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isItemModalVisible, setIsItemModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<QuoteItem | null>(null);
  const [targetGroupId, setTargetGroupId] = useState<string | null>(null); // Track which group to add item to

  const fetchData = useCallback(async () => {
    // Only proceed if estimateId exists
    if (!estimateId) {
      setLoading(false); // Nothing to fetch for a new estimate
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Fetch quote details - explicitly select needed fields - REMOVED estimate_number
      const quoteColumns = 'estimate_id, customer_id, subtotal, overhead, profit, contingency, discount, tax_amount, total, status'; // Add status etc. if needed
      const { data: quoteData, error: quoteError } = await supabase
        .from('quotes')
        .select(quoteColumns)
        .eq('estimate_id', estimateId)
        .single();
      if (quoteError) throw quoteError;
      if (!quoteData) throw new Error('Quote not found');
      setQuote(quoteData);

      // Fetch customer details if customer_id exists
      if (quoteData.customer_id) {
        const { data: customerData, error: customerError } = await supabase
          .from('customers')
          .select('*') // Select all for now
          .eq('customer_id', quoteData.customer_id)
          .single();
        if (customerError) throw customerError;
        setCustomer(customerData);
      }

      // Fetch groups for this quote
      const { data: groupsData, error: groupsError } = await supabase
        .from('quote_groups')
        .select('*')
        .eq('quote_id', estimateId)
        .order('order_index', { ascending: true });
      if (groupsError) throw groupsError;
      setGroups(groupsData || []);

      // Fetch items for this quote - ensure all fields needed by QuoteItem type are selected
      const { data: itemsData, error: itemsError } = await supabase
        .from('quote_items')
        .select('*, quote_groups(name)') // Select all item fields, maybe group name too
        .eq('quote_id', estimateId)
        .order('order_index', { ascending: true });
      if (itemsError) throw itemsError;
      // Ensure the fetched data matches the imported QuoteItem type
      setItems((itemsData as QuoteItem[]) || []);

    } catch (e: any) {
      setError(e.message);
      Alert.alert('Error loading estimate data', e.message);
    } finally {
      setLoading(false);
    }
  }, [estimateId]); // Keep estimateId dependency

  useEffect(() => {
    if (estimateId) {
      // Only fetch data if we are editing an existing estimate
      fetchData();
    } else {
      // If creating a new estimate, just stop loading
      setLoading(false);
    }
    // Depend on estimateId to re-run if it changes (though unlikely in this setup)
    // Depend on fetchData callback to ensure it's stable
  }, [estimateId, fetchData]);

  // Modified to accept optional groupId
  const handleAddItem = (groupId: string | null = null) => { 
    setItemToEdit(null);
    setTargetGroupId(groupId); // Set the target group for the new item
    setIsItemModalVisible(true);
  };

  const handleEditItem = (item: QuoteItem) => {
     setItemToEdit(item);
     setIsItemModalVisible(true);
  };

  const handleItemModalClose = () => {
    setIsItemModalVisible(false);
    setItemToEdit(null);
    setTargetGroupId(null); // Clear target group on close
  };

  const handleItemModalSave = (savedItem: QuoteItem) => {
    // Refetch all data for simplicity for now
    // TODO: Optimistic update later
    fetchData();
  };

  const handleGeneratePdf = async () => {
      // TODO: Call the generate_quote_pdf Edge Function
      // TODO: Handle the returned PDF data (emailing, uploading)
      Alert.alert('TODO: Generate PDF', `Generate PDF for quote ${estimateId}`);
  };

  const handleConvertToJob = async () => {
      // TODO: Call the create_job_from_quote Database Function
      // Need to handle potential errors (e.g., quote not 'Accepted')
      setLoading(true); // Show loading indicator
      try {
          // Ensure quote status allows conversion (check locally first)
          if (quote?.status !== 'Accepted') {
              Alert.alert('Cannot Convert', 'Quote must be in Accepted status to convert to job.');
              setLoading(false);
              return;
          }

          const { data, error } = await supabase.rpc('create_job_from_quote', {
              input_quote_id: estimateId 
          });

          if (error) throw error;

          const newJobId = data; // Function returns the new job_id
          Alert.alert('Success', `Job created successfully! Job ID: ${newJobId}`);
          // TODO: Optionally navigate to the new job screen or update quote status display
          fetchData(); // Refetch quote data to potentially show updated status

      } catch (e: any) {
          Alert.alert('Error Converting to Job', e.message);
          setLoading(false); // Stop loading on error
      }
      // setLoading(false); // Handled by fetchData or error path
  };


  // --- Reordering Logic ---
  const handleMove = async (
    type: 'group' | 'item', 
    id: string, 
    direction: 'up' | 'down'
  ) => {
    setLoading(true);
    setError(null);
    try {
      let itemToMove: QuoteItem | QuoteGroup | undefined;
      let siblingToSwap: QuoteItem | QuoteGroup | undefined;
      let list: (QuoteItem | QuoteGroup)[] = []; // Initialize list
      let idField: 'quote_item_id' | 'quote_group_id' = 'quote_item_id'; // Default, will be set
      let tableName: 'quote_items' | 'quote_groups' = 'quote_items'; // Default, will be set
      let isGroupList = false;

      if (type === 'item') {
        idField = 'quote_item_id';
        tableName = 'quote_items';
        // Find the item and its group (or ungrouped list)
        const itemToFind = items.find(i => i.quote_item_id === id); // Find item first
        const parentGroupId = itemToFind?.quote_group_id; // Get its group ID safely
        if (parentGroupId) {
          list = structuredData.sortedGroups.find(g => g.quote_group_id === parentGroupId)?.items || [];
        } else {
          list = structuredData.ungroupedItems;
        }
      } else { // type === 'group'
        idField = 'quote_group_id';
        tableName = 'quote_groups';
        list = structuredData.sortedGroups;
        isGroupList = true;
      }

      // Use type guards for safe access when finding index
      const findIndexById = (item: QuoteItem | QuoteGroup): boolean => {
          if (isGroupList && 'quote_group_id' in item) { // Check if it's a QuoteGroup
              return item.quote_group_id === id;
          } else if (!isGroupList && 'quote_item_id' in item) { // Check if it's a QuoteItem
              return item.quote_item_id === id;
          }
          return false;
      };

      const currentIndex = list.findIndex(findIndexById);
      itemToMove = list[currentIndex];

      if (currentIndex === -1 || !itemToMove) {
        throw new Error(`${type} not found in its list.`);
      }

      const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

      if (swapIndex < 0 || swapIndex >= list.length) {
        console.log('Cannot move item further in that direction.');
        setLoading(false); // No change needed
        return; 
      }

      siblingToSwap = list[swapIndex];

      if (!siblingToSwap) {
           throw new Error(`Could not find sibling to swap with.`);
      }

      // Get current order indices safely using type guards
      const getOrderIndex = (item: QuoteItem | QuoteGroup): number => {
          // Check if order_index exists and is a number, otherwise default to 0
          if (typeof item.order_index === 'number') {
              return item.order_index;
          }
          return 0;
      };
      const currentOrder = getOrderIndex(itemToMove);
      const siblingOrder = getOrderIndex(siblingToSwap);

      // Get IDs safely using type guards and null checks - CORRECTED
      const getId = (item: QuoteItem | QuoteGroup): string => {
          if (isGroupList && 'quote_group_id' in item) {
              if (!item.quote_group_id) throw new Error('Group ID is missing'); 
              return item.quote_group_id;
          } else if (!isGroupList && 'quote_item_id' in item) {
              if (!item.quote_item_id) throw new Error('Item ID is missing'); 
              return item.quote_item_id;
          }
          // This case should ideally not be reached due to earlier checks
          throw new Error('Cannot determine ID for item/group'); 
      };
      const idToMove = getId(itemToMove);
      const idToSwap = getId(siblingToSwap);


      // Perform updates - swap order indices
      const updates = [
        supabase.from(tableName).update({ order_index: siblingOrder }).eq(idField, idToMove),
        supabase.from(tableName).update({ order_index: currentOrder }).eq(idField, idToSwap)
      ];

      const results = await Promise.all(updates);
      
      // Check for errors in updates
      results.forEach(result => {
          if (result.error) throw result.error;
      });

      // Refetch data to reflect the new order
      fetchData();

    } catch (e: any) {
      setError(e.message);
      Alert.alert(`Error reordering ${type}`, e.message);
      setLoading(false); // Stop loading on error
    }
    // No finally block here, setLoading(false) is handled by fetchData or error path
  };
  // --- End Reordering Logic ---

  // Removed the explicit check for !estimateId, useEffect handles the loading state now

  const handleAddGroup = () => {
    // Ensure we have an estimateId before adding group (should exist if editing, need to handle creation flow)
    if (!estimateId) {
        Alert.alert("Cannot Add Group", "Please save the new estimate first."); // Or handle creation differently
        return;
    }
    Alert.prompt(
      'Add New Group',
      'Enter the name for the new group:',
      async (groupName) => {
        if (groupName) {
          setLoading(true); // Indicate activity
          try {
            // TODO: Determine order_index logic (e.g., count existing groups + 1)
            const newOrderIndex = groups.length; // Simplistic order

            const { error } = await supabase
              .from('quote_groups')
              .insert({
                quote_id: estimateId,
                name: groupName,
                order_index: newOrderIndex,
                // parent_group_id: null, // For top-level group initially
              });

            if (error) throw error;

            // Refresh data to show the new group
            fetchData();

          } catch (e: any) {
            Alert.alert('Error adding group', e.message);
            setLoading(false); // Ensure loading stops on error
          }
          // setLoading(false) is handled by fetchData's finally block
        }
      },
      'plain-text' // Input type
    );
  };


  // --- Logic to structure groups and items ---
  const structuredData = React.useMemo(() => {
    const grouped: { [key: string]: GroupedItem } = {};
    const ungroupedItems: QuoteItem[] = [];

    // Initialize groups map
    groups.forEach(group => {
      grouped[group.quote_group_id] = { ...group, items: [] };
    });

    // Assign items to groups or the ungrouped list
    items.forEach(item => {
      if (item.quote_group_id && grouped[item.quote_group_id]) {
        grouped[item.quote_group_id].items.push(item);
      } else {
        ungroupedItems.push(item);
      }
    });

    // Convert grouped map to array and sort groups
    const sortedGroups = Object.values(grouped).sort((a, b) => a.order_index - b.order_index);

    // Sort items within each group
    sortedGroups.forEach(group => {
      group.items.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
    });

    // Sort ungrouped items
    ungroupedItems.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));


    return { sortedGroups, ungroupedItems };

  }, [groups, items]);
  // --- End of structuring logic ---


  if (loading) {
     return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>Error: {error}</Text></View>;
  }

  // Only show "Quote not found" if we were trying to load one (estimateId exists) but failed
  if (estimateId && !quote) {
     return <View style={styles.centered}><Text>Quote not found.</Text></View>;
  }
  // If estimateId is null/undefined (creating new), we proceed even if quote is null

  return (
    <ScrollView style={styles.container}>
      {/* Header Section */}
      <View style={styles.header}>
        {/* Conditionally display quote number or 'New Quote' */}
        <Text style={styles.quoteNumber}>{quote ? `Quote #: ${quote.estimate_id}` : 'New Estimate'}</Text> 
        <Text>Customer: {customer ? `${customer.first_name} ${customer.last_name}` : 'N/A'}</Text>
        {/* TODO: Add button to select/edit customer */}
        <Text style={styles.totalText}>Total: ${quote?.total?.toFixed(2) ?? '0.00'}</Text>
      </View>

      {/* Items/Groups Section - Render Hierarchically */}
      <View style={styles.itemsSection}>
        <Text style={styles.sectionTitle}>Items & Groups</Text>

        {/* Render Ungrouped Items First (Optional) */}
        {structuredData.ungroupedItems.map((item, index, arr) => (
          <View key={item.quote_item_id} style={styles.rowWithButtons}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => handleEditItem(item)}>
              <View style={[styles.itemContainer, styles.ungroupedItem]}>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.itemDetails}>{item.quantity} {item.unit} @ ${item.unit_price?.toFixed(2)} = ${item.line_total?.toFixed(2)}</Text>
              </View>
            </TouchableOpacity>
            {/* Reorder Buttons for Ungrouped Items */}
            <View style={styles.reorderButtons}>
               <Button title="↑" onPress={() => handleMove('item', item.quote_item_id, 'up')} disabled={index === 0} />
               <Button title="↓" onPress={() => handleMove('item', item.quote_item_id, 'down')} disabled={index === arr.length - 1} />
            </View>
          </View>
        ))}
        {/* Add Item button for ungrouped items */}
        <Button title="+ Add Item Here" onPress={() => handleAddItem(null)} /> 

        {/* Render Groups and their Items */}
        {structuredData.sortedGroups.map((group, groupIndex, groupsArr) => (
          <View key={group.quote_group_id} style={styles.groupContainer}>
            <View style={styles.groupHeaderContainer}>
                 <Text style={styles.groupHeader}>{group.name}</Text>
                 <View style={styles.groupActionButtons}>
                    {/* Reorder Buttons for Groups */}
                    <Button title="↑" onPress={() => handleMove('group', group.quote_group_id, 'up')} disabled={groupIndex === 0} />
                    <Button title="↓" onPress={() => handleMove('group', group.quote_group_id, 'down')} disabled={groupIndex === groupsArr.length - 1} />
                    {/* Add Item button specific to this group */}
                    <Button title="+ Item" onPress={() => handleAddItem(group.quote_group_id)} />
                 </View>
            </View>
            {group.items.map((item, itemIndex, itemsArr) => (
               <View key={item.quote_item_id} style={styles.rowWithButtons}>
                 <TouchableOpacity style={{ flex: 1 }} onPress={() => handleEditItem(item)}>
                   <View style={styles.itemContainer}>
                     <Text style={styles.itemDescription}>{item.description}</Text>
                     <Text style={styles.itemDetails}>{item.quantity} {item.unit} @ ${item.unit_price?.toFixed(2)} = ${item.line_total?.toFixed(2)}</Text>
                   </View>
                 </TouchableOpacity>
                  {/* Reorder Buttons for Items within Group */}
                 <View style={styles.reorderButtons}>
                    <Button title="↑" onPress={() => handleMove('item', item.quote_item_id, 'up')} disabled={itemIndex === 0} />
                    <Button title="↓" onPress={() => handleMove('item', item.quote_item_id, 'down')} disabled={itemIndex === itemsArr.length - 1} />
                 </View>
               </View>
            ))}
            {group.items.length === 0 && <Text style={styles.emptyGroupText}>No items in this group.</Text>}
          </View>
        ))}

        {(structuredData.sortedGroups.length === 0 && structuredData.ungroupedItems.length === 0) &&
          <Text style={styles.emptyText}>No items or groups added yet.</Text>
        }
      </View>

      {/* Add Group Button & Main Action Buttons */}
      <View style={styles.actionButtons}>
        <Button title="Add Group" onPress={handleAddGroup} disabled={loading} />
        <Button title="Generate PDF" onPress={handleGeneratePdf} disabled={loading} />
        {/* Conditionally show Convert button based on quote status? */}
        <Button title="Convert to Job" onPress={handleConvertToJob} disabled={loading /* || quote?.status !== 'Accepted' */} />
        {/* TODO: Add Save button if needed */}
      </View>

      {/* Totals Summary Section */}
      <View style={styles.totalsContainer}>
         <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            {/* Use optional chaining for quote */}
            <Text style={styles.totalValue}>${quote?.subtotal?.toFixed(2) ?? '0.00'}</Text>
         </View>
         {/* TODO: Add rows for Overhead, Profit, Contingency, Discount if needed */}
         <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Tax (HST):</Text> 
            {/* Use optional chaining for quote */}
            <Text style={styles.totalValue}>${quote?.tax_amount?.toFixed(2) ?? '0.00'}</Text>
         </View>
         <View style={[styles.totalRow, styles.grandTotalRow]}>
            <Text style={[styles.totalLabel, styles.grandTotalLabel]}>Total:</Text>
            {/* Apply optional chaining to quote as well */}
            <Text style={[styles.totalValue, styles.grandTotalValue]}>${quote?.total?.toFixed(2) ?? '0.00'}</Text>
         </View>
      </View>


      <QuoteItemModal
        isVisible={isItemModalVisible}
        onClose={handleItemModalClose}
        quoteId={estimateId!} // Use non-null assertion - logic ensures it's defined here
        itemToEdit={itemToEdit}
        onSave={handleItemModalSave}
        // Pass the target group ID to the modal
        targetGroupId={targetGroupId} 
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  header: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  quoteNumber: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  itemsSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
   groupHeaderContainer: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
   groupActionButtons: { // Container for buttons next to group header
    flexDirection: 'row',
  },
  groupContainer: {
    marginBottom: 15,
    paddingLeft: 5, 
    // Add styling for group visual separation if desired
    // backgroundColor: '#f9f9f9', 
    // padding: 10, 
    // borderRadius: 5, 
  },
  groupHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    flex: 1, // Allow header text to take available space
    marginRight: 5, // Space before buttons
  },
   rowWithButtons: { // Container for item row + reorder buttons
    flexDirection: 'row',
    alignItems: 'center',
  },
  reorderButtons: { // Container for up/down buttons
    flexDirection: 'column', // Stack buttons vertically
    marginLeft: 5,
  },
  itemContainer: {
    paddingVertical: 8, // Slightly less padding for items within groups
    paddingHorizontal: 10, // Indent items slightly
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
   ungroupedItem: {
     // Optional: Different style for items not in a group
     // marginLeft: 0, // No indent
   },
  itemDescription: {
    // Style for item description text if needed
  },
  itemDetails: {
    fontSize: 12,
    color: 'gray',
    marginTop: 2,
  },
  emptyGroupText: {
    fontStyle: 'italic',
    color: 'gray',
    paddingLeft: 10, // Indent message
  },
  emptyText: { // General empty text if nothing exists
      textAlign: 'center',
      marginTop: 20,
      fontSize: 16,
      color: 'gray',
  },
  actionButtons: {
      padding: 15,
  },
  totalsContainer: {
      padding: 15,
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#ccc',
      backgroundColor: '#f9f9f9',
  },
  totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 5,
  },
  totalLabel: {
      fontSize: 16,
      color: '#555',
  },
  totalValue: {
      fontSize: 16,
      fontWeight: '500',
  },
  grandTotalRow: {
      borderTopWidth: 1,
      borderTopColor: '#ccc',
      marginTop: 10,
      paddingTop: 10,
  },
  grandTotalLabel: {
      fontWeight: 'bold',
      color: '#000',
  },
  grandTotalValue: {
      fontWeight: 'bold',
      color: '#000',
  }
});


export default EstimateBuilderScreen;
