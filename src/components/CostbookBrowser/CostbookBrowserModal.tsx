import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, StyleSheet, Text, Button, SafeAreaView, Alert, FlatList, ActivityIndicator, TouchableOpacity, Platform, StatusBar, ScrollView } from 'react-native'; // Added ScrollView
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed

// --- Define Types ---
// Basic types matching DB structure (can be refined)
type Costbook = { costbook_id: string; name: string; };
type CostbookCategory = { category_id: string; name: string; parent_category_id: string | null; costbook_id: string; };
// Type for the item selected, including costs
export type SelectedCostbookItem = {
    costbook_item_id: string;
    item_id: string;
    description: string; // Need to fetch this from related 'items' table
    unit: string; // Need to fetch this from related 'items' table
    unit_price: number; // Need to calculate/derive this from costbook_item costs + markup logic
    // Include costs if needed by the form
    material_cost?: number | null;
    labor_cost?: number | null;
    equipment_cost?: number | null;
    subcontract_cost?: number | null;
    other_cost?: number | null;
};
// Internal type for fetched costbook items including related item data
type FetchedCostbookItem = {
    costbook_item_id: string;
    item_id: string;
    category_id: string | null;
    material_cost?: number | null;
    labor_cost?: number | null;
    equipment_cost?: number | null;
    subcontract_cost?: number | null;
    other_cost?: number | null;
    items: { // Data joined from the 'items' table
        description: string | null;
        unit: string;
        name: string; // Item name might be useful too
    } | null;
};
// --- End Types ---

// --- Tree Structure Type ---
interface TreeNode {
    id: string; // category_id or costbook_item_id
    name: string;
    type: 'category' | 'item';
    children?: TreeNode[]; // For categories
    itemData?: FetchedCostbookItem; // For items
}
// --- End Tree Structure Type ---


type CostbookBrowserModalProps = {
  isVisible: boolean;
  onClose: () => void;
  onItemSelected: (item: SelectedCostbookItem) => void; // Callback when an item is chosen
};

const CostbookBrowserModal: React.FC<CostbookBrowserModalProps> = ({
  isVisible,
  onClose,
  onItemSelected,
}) => {
  const [costbooks, setCostbooks] = useState<Costbook[]>([]);
  const [selectedCostbookId, setSelectedCostbookId] = useState<string | null>(null);
  const [categories, setCategories] = useState<CostbookCategory[]>([]);
  const [items, setItems] = useState<FetchedCostbookItem[]>([]); // Use FetchedCostbookItem type
  const [loading, setLoading] = useState<'costbooks' | 'details' | false>(false);
  const [error, setError] = useState<string | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]); // State to hold the built tree

  // --- Function to build the tree ---
  const buildTree = useCallback((
    allCategories: CostbookCategory[],
    allItems: FetchedCostbookItem[],
    parentId: string | null = null // Start with root nodes (null parent)
  ): TreeNode[] => {
    const nodes: TreeNode[] = [];

    // Find categories with the current parentId
    allCategories
      .filter(cat => cat.parent_category_id === parentId)
      .sort((a, b) => (a.name > b.name ? 1 : -1)) // Basic sort by name
      .forEach(cat => {
        nodes.push({
          id: cat.category_id,
          name: cat.name,
          type: 'category',
          children: buildTree(allCategories, allItems, cat.category_id), // Recursively build children
        });
      });

    // Find items with the current parent categoryId (or null for root items)
    allItems
      .filter(item => item.category_id === parentId)
      .sort((a, b) => ((a.items?.name ?? '') > (b.items?.name ?? '') ? 1 : -1)) // Basic sort
      .forEach(item => {
        if (item.items) { // Ensure item details exist
             nodes.push({
                id: item.costbook_item_id,
                name: item.items.name,
                type: 'item',
                itemData: item,
             });
        }
      });

    return nodes;
  }, []);
  // --- End function to build the tree ---


  // Fetch list of costbooks
  const fetchCostbooks = useCallback(async () => {
    setLoading('costbooks');
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('costbooks')
        .select('costbook_id, name')
        .order('name');
      if (fetchError) throw fetchError;
      setCostbooks(data || []);
    } catch (e: any) {
      setError(e.message);
      Alert.alert('Error fetching costbooks', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch categories and items for the selected costbook
  const fetchCostbookDetails = useCallback(async (costbookId: string) => {
    setLoading('details');
    setError(null);
    setCategories([]);
    setItems([]);
    try {
      // Fetch categories
      const { data: catData, error: catError } = await supabase
        .from('costbook_categories')
        .select('*')
        .eq('costbook_id', costbookId)
        .order('name'); // Or sort_order if available
      if (catError) throw catError;
      setCategories(catData || []);

      // Fetch costbook items WITH related item details (name, unit, description)
      const { data: itemData, error: itemError } = await supabase
        .from('costbook_items')
        // Join with 'items' table to get description and unit
        .select(`
          *,
          items ( name, description, unit ) 
        `) 
        .eq('costbook_id', costbookId);
      if (itemError) throw itemError;
      setItems((itemData as FetchedCostbookItem[]) || []); // Cast to FetchedCostbookItem

    } catch (e: any) {
      setError(e.message);
      Alert.alert('Error fetching costbook details', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch costbooks when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      fetchCostbooks();
      // Reset state when opening
      setSelectedCostbookId(null);
      setCategories([]);
      setItems([]);
    }
  }, [isVisible, fetchCostbooks]);

  // Fetch details when a costbook is selected AND build tree when data arrives
  useEffect(() => {
    if (selectedCostbookId) {
      fetchCostbookDetails(selectedCostbookId);
    } else {
        setTreeData([]); // Clear tree if no costbook selected
    }
  }, [selectedCostbookId, fetchCostbookDetails]);

  // Rebuild tree when categories or items change
  useEffect(() => {
      if (categories.length > 0 || items.length > 0) {
          setTreeData(buildTree(categories, items, null)); // Build tree starting from root (null parent)
      } else {
          setTreeData([]);
      }
  }, [categories, items, buildTree]);


  const handleSelectCostbook = (costbookId: string) => {
    setSelectedCostbookId(costbookId);
  };

  const handleSelectItem = (item: FetchedCostbookItem) => {
      if (!item.items) {
          Alert.alert('Error', 'Selected item data is incomplete.');
          return;
      }
      // TODO: Calculate unit_price based on costs + markup rules (needs more info)
      // For now, let's assume unit_price is derived from sum of costs or needs separate logic
      const calculatedUnitPrice = (item.material_cost ?? 0) + (item.labor_cost ?? 0) + (item.equipment_cost ?? 0) + (item.subcontract_cost ?? 0) + (item.other_cost ?? 0); // Example calculation

      const selectedItemData: SelectedCostbookItem = {
          costbook_item_id: item.costbook_item_id,
          item_id: item.item_id,
          description: item.items.description ?? item.items.name, // Fallback to name if no description
          unit: item.items.unit,
          unit_price: calculatedUnitPrice, // Placeholder calculation
          // Pass costs if needed
          material_cost: item.material_cost,
          labor_cost: item.labor_cost,
          equipment_cost: item.equipment_cost,
          subcontract_cost: item.subcontract_cost,
          other_cost: item.other_cost,
      };
      onItemSelected(selectedItemData);
      onClose();
  };

  // --- Recursive Node Renderer ---
  const RenderNode: React.FC<{ node: TreeNode; level: number }> = ({ node, level }) => {
    const indentStyle = { marginLeft: level * 15 }; // Indent based on level

    if (node.type === 'category') {
      return (
        <View style={indentStyle}>
          <Text style={styles.categoryName}>{node.name}</Text>
          {node.children?.map(childNode => (
            <RenderNode key={childNode.id} node={childNode} level={level + 1} />
          ))}
        </View>
      );
    } else if (node.type === 'item' && node.itemData) {
      // Render item - make it touchable
      return (
        <TouchableOpacity onPress={() => handleSelectItem(node.itemData!)} style={indentStyle}>
          <View style={styles.itemRow}>
            <Text style={styles.itemName}>{node.name}</Text>
            <Text style={styles.itemUnit}>{node.itemData.items?.unit ?? 'N/A'}</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return null; // Should not happen
  };
   // --- End Recursive Node Renderer ---


  const renderCostbookContent = () => {
      if (loading === 'details') {
          return <View style={styles.centered}><ActivityIndicator size="large" /></View>; // Center loading indicator
      }
      if (!selectedCostbookId) {
          return <View style={styles.centered}><Text>Select a costbook above.</Text></View>; // Center text
      }
      if (treeData.length === 0 && !loading) {
          return <View style={styles.centered}><Text>No items or categories found in this costbook.</Text></View>; // Center text
      }

      // Render the tree structure
      // Using ScrollView instead of FlatList for simple recursive rendering
      return (
         <ScrollView>
            {treeData.map(node => (
                <RenderNode key={node.id} node={node} level={0} />
            ))}
         </ScrollView>
      );
  };


  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.headerText}>Select Costbook Item</Text>
          <Button title="Cancel" onPress={onClose} color="#888" />
        </View>

        {/* Costbook Selection List */}
        <View style={styles.costbookList}>
          {loading === 'costbooks' && <ActivityIndicator />}
          {costbooks.map(cb => (
            <Button
              key={cb.costbook_id}
              title={cb.name}
              onPress={() => handleSelectCostbook(cb.costbook_id)}
              disabled={loading !== false || selectedCostbookId === cb.costbook_id}
            />
          ))}
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Items/Categories Browser */}
        <View style={styles.browserContainer}>
            {renderCostbookContent()}
        </View>

      </SafeAreaView>
    </Modal>
  );
};

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
   centered: { // Added for loading/empty states
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  costbookList: {
      flexDirection: 'row',
      flexWrap: 'wrap', // Allow buttons to wrap
      padding: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
  },
  divider: {
      height: 1,
      backgroundColor: '#ccc',
      marginVertical: 5,
  },
  browserContainer: {
      flex: 1, // Take remaining space
      padding: 10,
  },
  itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8, // Adjusted padding
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      // Removed justifyContent as items might not fill width
  },
   categoryName: { // Style for category headers
      fontSize: 16,
      fontWeight: '600', // Bold category names
      color: '#333',
      marginTop: 10, // Space above categories
      marginBottom: 5,
  },
  itemName: {
      fontSize: 15, // Slightly smaller item names
  },
  itemUnit: {
      fontSize: 14,
      color: 'gray',
  }
});

export default CostbookBrowserModal;
