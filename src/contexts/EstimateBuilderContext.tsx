import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo, useCallback } from 'react'; // Import useCallback
import { Alert } from 'react-native'; // Import Alert
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
  currentQuoteId: string | null; // Add state for the current quote ID
  setCurrentQuoteId: (quoteId: string | null) => void; // Add setter
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
  const [currentQuoteId, setCurrentQuoteId] = useState<string | null>(null); // Add state for quote ID
  const [estimateTree, setEstimateTree] = useState<EstimateTreeNode[]>([]);

  // --- Helper for Deep Cloning Tree ---
  const deepCloneTree = (nodes: EstimateTreeNode[]): EstimateTreeNode[] => {
    return nodes.map(node => {
      if (node.type === 'group') {
        // Recursively clone children for group nodes
        return { ...node, children: deepCloneTree(node.children) };
      } else {
        // Clone item nodes (shallow copy is usually sufficient for item properties)
        return { ...node };
      }
    });
  };

  // --- Calculation Logic ---

  // Helper to calculate totals for a single item node
  const calculateItemNodeTotals = (itemNode: QuoteItemNode) => {
    const qty = itemNode.quantity ?? 0;
    // Use snake_case consistently to match the data structure after merge
    const material_cost = itemNode.material_cost ?? 0;
    const labor_cost = itemNode.labor_cost ?? 0;
    const equipment_cost = itemNode.equipment_cost ?? 0;
    const other_cost = itemNode.other_cost ?? 0;
    const subcontract_cost = itemNode.subcontract_cost ?? 0;

    const totalCostPerUnit = material_cost + labor_cost + equipment_cost + other_cost + subcontract_cost;
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
  }, [estimateTree, calculateItemNodeTotals]); // Add calculateItemNodeTotals to dependencies

  // Effect to update the state based on memoized calculations
  useEffect(() => {
    console.log('>>> Updating total states based on calculatedTotals:', calculatedTotals); // Add log
    
    // Use a single batch update for all state variables to ensure UI updates consistently
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


  // --- Tree Manipulation Functions (Wrapped in useCallback) ---
  const addNode = useCallback((node: EstimateTreeNode, parentGroupId: string | null) => {
    setEstimateTree(prevTree => {
      // Use the new deep clone helper
      const newTree = deepCloneTree(prevTree);

      // Function to find a group node recursively
      const findGroup = (nodes: EstimateTreeNode[], groupId: string): QuoteGroupNode | null => {
        for (const n of nodes) {
          if (n.type === 'group') {
            if (n.quote_group_id === groupId) {
              return n;
            }
            const foundInChildren = findGroup(n.children, groupId);
            if (foundInChildren) {
              return foundInChildren;
            }
          }
        }
        return null;
      };

      // Determine the target children array and calculate the next order_index
      let targetChildren: EstimateTreeNode[];
      let nextOrderIndex: number;

      if (parentGroupId) {
        const parentNode = findGroup(newTree, parentGroupId);
        if (parentNode) {
          targetChildren = parentNode.children;
        } else {
          console.error(`Parent group ${parentGroupId} not found for adding node.`);
          // Fallback: Add to root? Or throw error? Let's add to root for now.
          targetChildren = newTree;
        }
      } else {
        // Adding to the root level
        targetChildren = newTree;
      }

      // Calculate the next order_index (max existing index + 1, or 0 if empty)
      nextOrderIndex = targetChildren.length > 0
        ? Math.max(...targetChildren.map(child => child.order_index ?? -1)) + 1
        : 0;

      // Assign the calculated order_index and ensure IDs exist
      let nodeToAdd: EstimateTreeNode;
      if (node.type === 'item') {
          // Create a QuoteItemNode, preserving potential null/undefined quote_group_id
          nodeToAdd = {
              ...node,
              order_index: nextOrderIndex,
              quote_item_id: node.quote_item_id || `temp-item-${Date.now()}`, // Placeholder ID generation
              // Ensure default values for fields used in rendering before calculation
              title: node.title ?? '',
              description: node.description ?? '',
              quantity: node.quantity ?? 1,
              unit: node.unit ?? '',
              material_cost: node.material_cost ?? 0,
              labor_cost: node.labor_cost ?? 0,
              equipment_cost: node.equipment_cost ?? 0,
              other_cost: node.other_cost ?? 0,
              subcontract_cost: node.subcontract_cost ?? 0,
          };
          // Calculate and add cost fields before adding to tree
          const itemTotals = calculateItemNodeTotals(nodeToAdd);
          // Add defensive fallbacks during assignment
          nodeToAdd.calculated_total_cost_per_unit = itemTotals.totalCostPerUnit ?? 0;
          nodeToAdd.calculated_total_with_markup = itemTotals.totalWithMarkup ?? 0;

      } else { // node.type === 'group'
          // Create a QuoteGroupNode, ensuring quote_group_id is a string
          nodeToAdd = {
              ...node,
              order_index: nextOrderIndex,
              quote_group_id: node.quote_group_id || `temp-group-${Date.now()}`, // Placeholder ID generation
          };
      }

      // Add the correctly typed node to the target children array
      targetChildren.push(nodeToAdd);

      // Sort the target children array again after adding
       targetChildren.sort((a, b) => (a.order_index ?? Infinity) - (b.order_index ?? Infinity));


      console.log('addNode implemented: Added node', nodeToAdd, 'to parent', parentGroupId);
      return newTree; // Return the modified tree
    });
  }, [calculateItemNodeTotals]); // Add calculateItemNodeTotals to dependencies

  const updateNode = useCallback((updatedNode: EstimateTreeNode) => {
    setEstimateTree(prevTree => {
      // Use the new deep clone helper
      const newTree = deepCloneTree(prevTree);

      // Recursive function to find and update the node
      const findAndUpdate = (nodes: EstimateTreeNode[]): boolean => {
        for (let i = 0; i < nodes.length; i++) {
          const currentNode = nodes[i];

          // Check if the current node matches the ID and type
          if (currentNode.type === updatedNode.type) {
            if (currentNode.type === 'item' && updatedNode.type === 'item' && currentNode.quote_item_id === updatedNode.quote_item_id) {
              // Recalculate costs when updating an item node based on incoming data
              const itemTotals = calculateItemNodeTotals(updatedNode);
              // Update the node in the tree: Start with current node, overwrite with updated fields, add calculated fields
              nodes[i] = {
                ...currentNode, // Start with the existing node in the tree
                ...updatedNode, // Overwrite with fields from the updated data (title, desc, costs, etc.)
                order_index: updatedNode.order_index ?? currentNode.order_index, // Ensure order_index is handled
                calculated_total_cost_per_unit: itemTotals.totalCostPerUnit, // Add calculated value
                calculated_total_with_markup: itemTotals.totalWithMarkup, // Add calculated value
              };
              return true; // Node found and updated
            }
            if (currentNode.type === 'group' && updatedNode.type === 'group' && currentNode.quote_group_id === updatedNode.quote_group_id) {
              // Preserve children when updating a group, only update other properties
              // Ensure order_index isn't accidentally overwritten
              nodes[i] = {
                  ...updatedNode,
                  children: currentNode.children, // Keep existing children
                  order_index: updatedNode.order_index ?? currentNode.order_index
              };
              return true; // Node found and updated
            }
          }

          // If it's a group, search its children recursively
          if (currentNode.type === 'group') {
            if (findAndUpdate(currentNode.children)) {
              return true; // Node found and updated in children
            }
          }
        }
        return false; // Node not found in this branch
      };

      if (findAndUpdate(newTree)) {
        console.log('updateNode implemented: Updated node', updatedNode);
      } else {
        console.warn('updateNode: Node not found for update', updatedNode);
      }

      // Note: Re-sorting the entire tree after every update might be unnecessary and potentially
      // disruptive if only non-order_index properties changed.
      // We might only need to re-sort if order_index itself was part of the update.
      // For simplicity now, we are not re-sorting here. Sorting happens in addNode and buildTree.

      return newTree; // Return the potentially modified tree
    });
  }, [calculateItemNodeTotals]); // Add calculateItemNodeTotals to dependencies

  const moveNode = useCallback((nodeId: string, nodeType: 'item' | 'group', newParentGroupId: string | null, newOrderIndex: number) => {
    setEstimateTree(prevTree => {
      // Use the new deep clone helper
      const newTree = deepCloneTree(prevTree);
      let nodeToMove: EstimateTreeNode | null = null;
      let oldParentChildren: EstimateTreeNode[] | null = null;
      let oldIndex = -1;

      // Helper to find a node and its parent's children array + index
      const findNodeAndParent = (
        nodes: EstimateTreeNode[],
        targetId: string,
        targetType: 'item' | 'group',
        currentParentChildren: EstimateTreeNode[] | null = null
      ): { node: EstimateTreeNode; parentChildren: EstimateTreeNode[]; index: number } | null => {
        for (let i = 0; i < nodes.length; i++) {
          const node = nodes[i];
          // Add explicit type checks before accessing type-specific IDs
          if (node.type === targetType) {
            let idMatch = false;
            if (targetType === 'item' && node.type === 'item') {
              idMatch = node.quote_item_id === targetId;
            } else if (targetType === 'group' && node.type === 'group') {
              idMatch = node.quote_group_id === targetId;
            }
            // const idMatch = targetType === 'item' ? node.quote_item_id === targetId : node.quote_group_id === targetId; // Original line causing error
            if (idMatch) {
              return { node, parentChildren: currentParentChildren ?? newTree, index: i };
            }
          }
          if (node.type === 'group') {
            const found = findNodeAndParent(node.children, targetId, targetType, node.children);
            if (found) return found;
          }
        }
        return null;
      };

      // Helper to find a parent group's children array by ID
      const findParentChildrenArray = (nodes: EstimateTreeNode[], groupId: string | null): EstimateTreeNode[] | null => {
        if (groupId === null) return newTree; // Target is root
        for (const node of nodes) {
          if (node.type === 'group') {
            if (node.quote_group_id === groupId) {
              return node.children;
            }
            const foundInChildren = findParentChildrenArray(node.children, groupId);
            if (foundInChildren) return foundInChildren;
          }
        }
        return null;
      };

      // 1. Find the node to move and its original parent context
      const found = findNodeAndParent(newTree, nodeId, nodeType);
      if (!found) {
        console.error(`moveNode: Node not found - ID: ${nodeId}, Type: ${nodeType}`);
        return prevTree; // Return original tree if node not found
      }
      nodeToMove = found.node;
      oldParentChildren = found.parentChildren;
      oldIndex = found.index;

      // 2. Remove node from its old position
      oldParentChildren.splice(oldIndex, 1);

      // 3. Update order_index for old siblings
      oldParentChildren.forEach((sibling, index) => {
        sibling.order_index = index;
      });

      // 4. Find the new parent's children array
      const newParentChildren = findParentChildrenArray(newTree, newParentGroupId);
      if (!newParentChildren) {
        console.error(`moveNode: New parent group not found - ID: ${newParentGroupId}`);
        // Re-insert node at its old position to revert removal (simplistic rollback)
        oldParentChildren.splice(oldIndex, 0, nodeToMove);
        oldParentChildren.forEach((sibling, index) => { sibling.order_index = index; }); // Re-sort old parent
        return prevTree; // Return original tree
      }

      // 5. Update the node's parent reference
      if (nodeToMove.type === 'group') {
        nodeToMove.parent_group_id = newParentGroupId;
      } else { // type === 'item'
        nodeToMove.quote_group_id = newParentGroupId; // Items store their direct parent group ID here
      }

      // 6. Insert node into the new position
      // Clamp newOrderIndex to be within valid bounds
      const clampedIndex = Math.max(0, Math.min(newOrderIndex, newParentChildren.length));
      newParentChildren.splice(clampedIndex, 0, nodeToMove);

      // 7. Update order_index for new siblings (including the moved node)
      newParentChildren.forEach((sibling, index) => {
        sibling.order_index = index;
      });

      console.log(`moveNode: Moved ${nodeType} ${nodeId} to parent ${newParentGroupId} at index ${clampedIndex}`);
      return newTree; // Return the modified tree
    });
  }, []); // Dependency array is empty

    const deleteNode = useCallback((nodeId: string, nodeType: 'item' | 'group') => {
      setEstimateTree(prevTree => {
        // Use the new deep clone helper
        const newTree = deepCloneTree(prevTree);

        // Recursive function to find and remove the node
        const findAndRemove = (nodes: EstimateTreeNode[]): EstimateTreeNode[] => {
          const filteredNodes = nodes.filter(node => {
            // Check if the current node is the one to delete
            if (node.type === nodeType) {
              // Add explicit type checks before accessing type-specific IDs
              if (nodeType === 'item' && node.type === 'item' && node.quote_item_id === nodeId) {
                return false; // Filter out the item
              }
              if (nodeType === 'group' && node.type === 'group' && node.quote_group_id === nodeId) {
                // If deleting a group, also implicitly delete its children
                return false; // Filter out the group
              }
            }
            return true; // Keep the node if it doesn't match
          });

          // Recursively process children of remaining groups
          return filteredNodes.map(node => {
            if (node.type === 'group') {
              // Return the group with potentially filtered children
              return { ...node, children: findAndRemove(node.children) };
            }
            return node; // Return items as is
          });
        };

        const finalTree = findAndRemove(newTree);

        // Function to re-calculate order_index after deletion
        const updateOrderIndexes = (nodes: EstimateTreeNode[]) => {
            nodes.forEach((node, index) => {
                node.order_index = index; // Assign index as the new order
                if (node.type === 'group') {
                    updateOrderIndexes(node.children); // Recurse for children
                }
            });
        };

        // Update order indexes for the entire tree after deletion
        updateOrderIndexes(finalTree);


        if (JSON.stringify(finalTree) !== JSON.stringify(prevTree)) {
            console.log('deleteNode implemented: Removed node', { nodeId, nodeType });
        } else {
            console.warn('deleteNode: Node not found for deletion', { nodeId, nodeType });
        }

        return finalTree; // Return the modified tree
      });
    }, []); // Dependency array is empty
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
      if (!currentQuoteId) {
          console.error("Cannot add group: currentQuoteId is null. Quote must be created first.");
          // TODO: Handle quote creation flow if needed here or ensure it happens before.
          // Alert.alert("Error", "Cannot add group without an active quote.");
          return;
      }

      // Use Alert.prompt to get the group name from the user
      Alert.prompt(
          "New Group Name",
          "Enter a name for the new group:",
          (groupName: string | undefined) => { // Add type for groupName
              const trimmedGroupName = groupName?.trim(); // Trim whitespace
              if (!trimmedGroupName) { // Check if trimmed name is empty
                  console.log("Group creation cancelled or empty name entered.");
                  return; // Cancelled or empty name
              }

              const tempGroupId = `temp-group-${Date.now()}`;
              const newGroupNode: QuoteGroupNode = {
          type: 'group',
          quote_group_id: tempGroupId,
          quote_id: currentQuoteId, // Use the quote ID from context state
          name: trimmedGroupName, // Use the validated groupName
          order_index: 0, // addNode will calculate the correct index
          parent_group_id: targetParentGroupId,
                  children: [],
              };

              addNode(newGroupNode, targetParentGroupId);
          },
          'plain-text', // Input type
          'New Group' // Default value
      );

  }, [addNode, currentQuoteId]); // Dependency on addNode and currentQuoteId

  const handleEditGroup = useCallback((groupNode: QuoteGroupNode) => {
      console.log('Context: handleEditGroup triggered for group:', groupNode.quote_group_id);
      // UI would show an edit form/modal, then call updateNode.
  }, [updateNode]); // Dependency on updateNode (which is stable)

  const handleMoveNode = useCallback((nodeId: string, nodeType: 'item' | 'group', direction: 'up' | 'down') => {
      console.log('Context: handleMoveNode triggered:', { nodeId, nodeType, direction });
      // TODO: Implement logic to find the node, calculate its new parent/orderIndex based on direction,
      // and then call the low-level moveNode function. This requires traversing the estimateTree.
      // Example: const newTree = calculateNewTreeOrder(...); setEstimateTree(newTree);
  }, [moveNode]); // Depends on moveNode (stable) - REMOVED estimateTree dependency

   const handleDeleteNode = useCallback((nodeId: string, nodeType: 'item' | 'group') => {
      console.log('Context: handleDeleteNode triggered:', { nodeId, nodeType });
      // Add confirmation alert
      Alert.alert(
        `Delete ${nodeType === 'group' ? 'Group' : 'Item'}?`,
        `Are you sure you want to delete this ${nodeType}? ${nodeType === 'group' ? 'All items and sub-groups within it will also be deleted.' : ''}`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Delete",
            onPress: () => {
              // Call the actual state update function if confirmed
              deleteNode(nodeId, nodeType);
            },
            style: "destructive"
          }
        ]
      );
  }, [deleteNode]); // Dependency on deleteNode (stable)
  // --- End Placeholder Higher-Level Handlers ---


  // Create the context value object directly without useMemo
  const contextValue = {
    selectedCustomer,
    setSelectedCustomer,
    currentQuoteId, // Provide quote ID
    setCurrentQuoteId, // Provide setter
    estimateTree,
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
  };


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
