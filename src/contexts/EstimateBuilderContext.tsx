import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo, useCallback } from 'react'; // Import useCallback
import { QuoteItem } from '../components/QuoteItem/QuoteItemModal'; // Keep original QuoteItem type for data structure

// --- Define Hierarchical Node Types ---

/**
 * Represents a group node in the estimate tree.
 * Contains children which can be other groups or items.
 */
export type QuoteGroupNode = {
  type: 'group';
  quote_group_id: string;
  quote_id: string;
  name: string;
  order_index: number;
  parent_group_id: string | null; // Keep track of parent for potential tree manipulation
  // Add other group-specific fields if needed (e.g., description)
  children: EstimateTreeNode[];
};

/**
 * Represents an item node in the estimate tree.
 * Based on the original QuoteItem type.
 */
export type QuoteItemNode = QuoteItem & {
  type: 'item';
  // Add calculated fields directly? Or keep them separate? Let's add them for now.
  calculated_total_cost_per_unit?: number;
  calculated_total_with_markup?: number; // Renamed from costTotal for clarity
};

/**
 * Union type for nodes in the estimate tree.
 */
export type EstimateTreeNode = QuoteGroupNode | QuoteItemNode;

// --- Original Types (for reference/data fetching) ---
// Keep original QuoteGroup type if needed for raw data fetching before transformation
export type QuoteGroup = {
  quote_group_id: string;
  quote_id: string;
  name: string;
  order_index: number;
  parent_group_id: string | null;
};

// Define the shape of the customer data we need in the context
type CustomerContextType = {
    customer_id: string;
    first_name?: string | null;
    last_name?: string | null;
    address?: string | null;
    city?: string | null;
    postal_code?: string | null;
};

// --- Context Shape ---
interface EstimateBuilderContextProps {
  selectedCustomer: CustomerContextType | null;
  setSelectedCustomer: (customer: CustomerContextType | null) => void;
  estimateTree: EstimateTreeNode[];
  setEstimateTree: React.Dispatch<React.SetStateAction<EstimateTreeNode[]>>; // Direct state setter for now
  // Calculated Totals
  subtotal: number;
  discountAmount: number;
  totalWithDiscount: number;
  taxAmount: number;
  finalTotal: number;
  // --- Tree Manipulation Functions (Low-level placeholders) ---
  addNode: (node: EstimateTreeNode, parentGroupId: string | null) => void;
  updateNode: (node: EstimateTreeNode) => void;
  moveNode: (nodeId: string, nodeType: 'item' | 'group', newParentGroupId: string | null, newOrderIndex: number) => void;
  deleteNode: (nodeId: string, nodeType: 'item' | 'group') => void;
  // --- Helper function ---
  buildTreeFromFlatData: (groups: QuoteGroup[], items: QuoteItem[]) => void;
  // --- Higher-level Handlers (for components to use) ---
  handleAddItem: (targetGroupId: string | null) => void; // Opens modal, needs target group
  handleEditItem: (itemNode: QuoteItemNode) => void; // Opens modal with item data
  handleAddGroup: (targetParentGroupId: string | null) => void; // Needs target parent
  handleEditGroup: (groupNode: QuoteGroupNode) => void; // Needs group data
  handleMoveNode: (nodeId: string, nodeType: 'item' | 'group', direction: 'up' | 'down') => void; // Simpler move handler
  handleDeleteNode: (nodeId: string, nodeType: 'item' | 'group') => void; // Confirmation might be needed UI-side
}

// Create the context with a default value
const EstimateBuilderContext = createContext<EstimateBuilderContextProps | undefined>(undefined);

// --- Provider Component ---
interface EstimateBuilderProviderProps {
  children: ReactNode;
}

export const EstimateBuilderProvider: React.FC<EstimateBuilderProviderProps> = ({ children }) => {
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerContextType | null>(null);
  const [estimateTree, setEstimateTree] = useState<EstimateTreeNode[]>([]);

  // --- Calculation Logic ---

  // Helper to calculate totals for a single item node
  const calculateItemNodeTotals = (itemNode: QuoteItemNode) => {
    const qty = itemNode.quantity ?? 0;
    const costMaterial = itemNode.cost_material ?? 0;
    const costLabour = itemNode.cost_labour ?? 0;
    const costEquipment = itemNode.cost_equipment ?? 0;
    const costOther = itemNode.cost_other ?? 0;
    const costSubcontract = itemNode.cost_subcontract ?? 0;

    const totalCostPerUnit = costMaterial + costLabour + costEquipment + costOther + costSubcontract;
    const costTotal = qty * totalCostPerUnit;

    // Markups are omitted for now. Total is just the cost.
    const totalWithMarkup = costTotal; // Represents item cost * quantity

    return {
      totalCostPerUnit,
      costTotal, // Raw cost * quantity
      totalWithMarkup, // Cost * quantity (potentially including markups later)
    };
  };

  // State for overall totals
  const [subtotal, setSubtotal] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [totalWithDiscount, setTotalWithDiscount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [finalTotal, setFinalTotal] = useState(0);

  // Memoize the calculated totals based on the estimateTree
  const calculatedTotals = useMemo(() => {
    let runningSubtotal = 0;

    // Recursive function to traverse the tree and calculate totals
    // This function now only calculates, doesn't modify state directly
    const traverseTreeAndSum = (nodes: EstimateTreeNode[]): void => {
      nodes.forEach(node => {
        if (node.type === 'item') {
          const itemTotals = calculateItemNodeTotals(node);
          runningSubtotal += itemTotals.costTotal;
        } else if (node.type === 'group') {
          traverseTreeAndSum(node.children); // Recursively process children
        }
      });
    };

    traverseTreeAndSum(estimateTree); // Calculate the running subtotal

    // --- Calculate other totals based on the runningSubtotal ---
    // TODO: Apply global markups (Overhead, Profit, Contingency) here if needed
    const currentTotalBeforeDiscount = runningSubtotal;

    // TODO: Apply global discount logic
    const currentDiscount = 0; // Placeholder
    const currentTotalWithDiscount = currentTotalBeforeDiscount - currentDiscount;

    // TODO: Apply global tax logic (e.g., 13% HST)
    const taxRate = 0.13; // Placeholder
    const currentTaxAmount = currentTotalWithDiscount * taxRate;
    const currentFinalTotal = currentTotalWithDiscount + currentTaxAmount;

    return {
      subtotal: runningSubtotal,
      discountAmount: currentDiscount,
      totalWithDiscount: currentTotalWithDiscount,
      taxAmount: currentTaxAmount,
      finalTotal: currentFinalTotal,
    };
  }, [estimateTree]); // This memo recalculates only when estimateTree reference changes

  // Effect to update the state based on memoized calculations
  useEffect(() => {
    setSubtotal(calculatedTotals.subtotal);
    setDiscountAmount(calculatedTotals.discountAmount);
    setTotalWithDiscount(calculatedTotals.totalWithDiscount);
    setTaxAmount(calculatedTotals.taxAmount);
    setFinalTotal(calculatedTotals.finalTotal);
  }, [calculatedTotals]); // This effect runs only when calculatedTotals object changes


    // --- Old useEffect logic removed ---
    /*
    useEffect(() => {
      let runningSubtotal = 0; // Sum of item cost * quantity
      const traverseTree = (nodes: EstimateTreeNode[]): EstimateTreeNode[] => { ... };
      const treeWithCalculations = traverseTree(estimateTree);
      // ... calculation logic ...
      setSubtotal(runningSubtotal);
      // ... set other totals ...
    }, [estimateTree]);
    */

  // --- End Calculation Logic ---

  // --- Tree Building Logic ---
  /**
   * Builds the hierarchical estimate tree from flat lists of groups and items.
   * @param groups - Array of QuoteGroup objects from Supabase.
   * @param items - Array of QuoteItem objects from Supabase.
   */
  // Wrap buildTreeFromFlatData in useCallback to stabilize its reference
  const buildTreeFromFlatData = useCallback((groups: QuoteGroup[], items: QuoteItem[]) => {
    const groupMap: Map<string, QuoteGroupNode> = new Map();
    const rootNodes: EstimateTreeNode[] = [];

    // 1. Initialize group nodes
    groups.forEach(group => {
      groupMap.set(group.quote_group_id, {
        ...group,
        type: 'group',
        children: [],
      });
    });

    // 2. Place items into their parent groups
    items.forEach(item => {
      const itemNode: QuoteItemNode = { ...item, type: 'item' };
      if (item.quote_group_id) {
        const parentGroup = groupMap.get(item.quote_group_id);
        if (parentGroup) {
          parentGroup.children.push(itemNode);
        } else {
          console.warn(`Item ${item.item_id} references non-existent group ${item.quote_group_id}`);
          // Decide how to handle orphaned items - add to root? discard? log?
          // For now, let's add them to the root as items cannot be top-level according to requirements.
          // This indicates a data integrity issue.
        }
      } else {
         console.warn(`Item ${item.item_id} has no quote_group_id.`);
         // Items must belong to a group. This is a data issue.
      }
    });

    // 3. Build the group hierarchy and identify root nodes
    groupMap.forEach(groupNode => {
      if (groupNode.parent_group_id) {
        const parentGroup = groupMap.get(groupNode.parent_group_id);
        if (parentGroup) {
          parentGroup.children.push(groupNode);
        } else {
          console.warn(`Group ${groupNode.quote_group_id} references non-existent parent group ${groupNode.parent_group_id}`);
          rootNodes.push(groupNode); // Treat as root if parent is missing
        }
      } else {
        rootNodes.push(groupNode); // No parent_group_id means it's a root node
      }
    });

    // 4. Sort children within each group by order_index
    const sortChildren = (nodes: EstimateTreeNode[]) => {
        // Handle potential null/undefined order_index, sorting those last
        nodes.sort((a, b) => (a.order_index ?? Infinity) - (b.order_index ?? Infinity));
        nodes.forEach(node => {
            if (node.type === 'group') {
                sortChildren(node.children);
            }
        });
    };

    groupMap.forEach(groupNode => sortChildren(groupNode.children));
    sortChildren(rootNodes); // Sort root nodes as well

    setEstimateTree(rootNodes);
  // Add dependencies if this function ever relies on state/props, currently none.
  }, []);
  // --- End Tree Building Logic ---


  // --- Placeholder Tree Manipulation Functions (Wrapped in useCallback) ---
  const addNode = useCallback((node: EstimateTreeNode, parentGroupId: string | null) => {
    console.log('addNode called (not implemented)', { node, parentGroupId });
    // TODO: Implement logic to add node to the tree structure
    // - Find parent node (if parentGroupId is not null)
    // - Add node to parent's children array
    // - Update order_index of siblings if necessary
    // - Update estimateTree state using setEstimateTree(prevTree => ...)
  }, []);

  const updateNode = useCallback((node: EstimateTreeNode) => {
    console.log('updateNode called (not implemented)', { node });
    // TODO: Implement logic to update an existing node in the tree
    // - Find the node by its ID and type
    // - Update its properties
    // - Update estimateTree state using setEstimateTree(prevTree => ...)
  }, []);

  const moveNode = useCallback((nodeId: string, nodeType: 'item' | 'group', newParentGroupId: string | null, newOrderIndex: number) => {
    console.log('moveNode called (not implemented)', { nodeId, nodeType, newParentGroupId, newOrderIndex });
    // TODO: Implement logic to move a node within the tree
    // - Find the node
    // - Remove it from its current parent's children
    // - Update order_index of old siblings
    // - Find the new parent node
    // - Add the node to the new parent's children at the correct order_index
    // - Update order_index of new siblings
    // - Update the node's parent_group_id if it's a group, or quote_group_id if it's an item
    // - Update estimateTree state using setEstimateTree(prevTree => ...)
  }, []);

    const deleteNode = useCallback((nodeId: string, nodeType: 'item' | 'group') => {
        console.log('deleteNode called (low-level - not implemented)', { nodeId, nodeType });
        // TODO: Implement logic to delete a node from the tree
        // - Find the node
        // - Remove it from its parent's children
        // - Update order_index of siblings
        // - Handle deletion of groups with children (recursive delete? prevent?)
        // - Update estimateTree state using setEstimateTree(prevTree => ...)
    }, []);
  // --- End Placeholder Low-Level Functions ---

  // --- Placeholder Higher-Level Handlers (Wrapped in useCallback) ---
  // These handlers would typically interact with UI state (like modals) or perform
  // calculations before calling the low-level functions (addNode, moveNode etc.)
  // For now, they just log messages.
  const handleAddItem = useCallback((targetGroupId: string | null) => {
      console.log('Context: handleAddItem triggered for group:', targetGroupId);
      // In a real scenario, this would likely trigger a modal in the UI component
      // The modal's onSave would then call addNode with the new item data.
  }, [addNode]); // Dependency on addNode (which is stable)

  const handleEditItem = useCallback((itemNode: QuoteItemNode) => {
      console.log('Context: handleEditItem triggered for item:', itemNode.quote_item_id);
      // This would trigger a modal in the UI, pre-filled with itemNode data.
      // The modal's onSave would call updateNode.
  }, [updateNode]); // Dependency on updateNode (which is stable)

  const handleAddGroup = useCallback((targetParentGroupId: string | null) => {
      console.log('Context: handleAddGroup triggered for parent:', targetParentGroupId);
      // UI would prompt for group name, then call addNode with a new QuoteGroupNode.
  }, [addNode]); // Dependency on addNode (which is stable)

  const handleEditGroup = useCallback((groupNode: QuoteGroupNode) => {
      console.log('Context: handleEditGroup triggered for group:', groupNode.quote_group_id);
      // UI would show an edit form/modal, then call updateNode.
  }, [updateNode]); // Dependency on updateNode (which is stable)

  const handleMoveNode = useCallback((nodeId: string, nodeType: 'item' | 'group', direction: 'up' | 'down') => {
      console.log('Context: handleMoveNode triggered:', { nodeId, nodeType, direction });
      // TODO: Implement logic to find the node, calculate its new parent/orderIndex based on direction,
      // and then call the low-level moveNode function. This requires traversing the estimateTree.
      // Example: const newTree = calculateNewTreeOrder(...); setEstimateTree(newTree);
  }, [moveNode, estimateTree]); // Depends on moveNode (stable) and estimateTree (changes)

   const handleDeleteNode = useCallback((nodeId: string, nodeType: 'item' | 'group') => {
      console.log('Context: handleDeleteNode triggered:', { nodeId, nodeType });
      // UI should confirm deletion, then call the low-level deleteNode function.
      // Consider adding confirmation logic here or ensuring UI does it.
      // deleteNode(nodeId, nodeType); // Example call
  }, [deleteNode]); // Dependency on deleteNode (stable)
  // --- End Placeholder Higher-Level Handlers ---


  // Memoize the context value to prevent unnecessary re-renders of consumers
  const contextValue = useMemo(() => ({
    selectedCustomer,
    setSelectedCustomer,
    estimateTree,
    // estimateTree, // Removed duplicate
    setEstimateTree, // Keep direct setter for now during refactor, remove later
    // Calculated values
    subtotal,
    discountAmount,
    totalWithDiscount,
    taxAmount,
    finalTotal,
    // Low-level functions (maybe hide these later)
    addNode,
    updateNode,
    moveNode,
    deleteNode,
    // Helper
    buildTreeFromFlatData,
    // Higher-level handlers
    handleAddItem,
    handleEditItem,
    handleAddGroup,
    handleEditGroup,
    handleMoveNode,
    handleDeleteNode,
  // Add all values provided in the context object to the dependency array
  }), [
    selectedCustomer,
    estimateTree,
    subtotal,
    discountAmount,
    totalWithDiscount,
    taxAmount,
    finalTotal,
    // Include stable function references if they were defined with useCallback,
    // otherwise, including them might cause unnecessary updates if they are redefined on every render.
    // For now, assuming setters and placeholders are stable enough or don't need to be dependencies
    // for the memoization of the value object itself. Re-evaluate if needed.
    buildTreeFromFlatData, // Assuming this is stable (defined outside render or via useCallback)
    addNode, updateNode, moveNode, deleteNode, // Placeholders assumed stable
    // Now include the stable function references in the dependency array
    buildTreeFromFlatData,
    addNode, updateNode, moveNode, deleteNode,
    handleAddItem, handleEditItem, handleAddGroup, handleEditGroup, handleMoveNode, handleDeleteNode
  ]);


  return (
    <EstimateBuilderContext.Provider value={contextValue}>
      {children}
    </EstimateBuilderContext.Provider>
  );
};

// Create a custom hook for easy context usage
export const useEstimateBuilder = (): EstimateBuilderContextProps => {
  const context = useContext(EstimateBuilderContext);
  if (context === undefined) {
    throw new Error('useEstimateBuilder must be used within an EstimateBuilderProvider');
  }
  return context;
};
