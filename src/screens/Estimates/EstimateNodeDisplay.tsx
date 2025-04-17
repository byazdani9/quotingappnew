import React from 'react';
import { View, Text, StyleSheet, Button, TouchableOpacity } from 'react-native';
import { EstimateTreeNode, QuoteGroupNode, QuoteItemNode, useEstimateBuilder } from '../../contexts/EstimateBuilderContext'; // Adjust path if needed

type EstimateNodeDisplayProps = {
  node: EstimateTreeNode;
  onEditItem: (itemNode: QuoteItemNode) => void; // Add prop for editing items
  // Add other callbacks as needed
  // onDeleteNode: (nodeId: string, nodeType: 'item' | 'group') => void;
  level?: number; // Optional: for indentation
};

// Destructure onEditItem from props here
const EstimateNodeDisplay: React.FC<EstimateNodeDisplayProps> = ({ node, level = 0, onEditItem }) => {
  // Get action handlers and currentQuoteId from context (excluding handleEditItem)
  const {
    currentQuoteId, // Get quote ID to check if adding is allowed
    // handleEditItem, // This will be passed via props
    handleAddItem,
    handleMoveNode,
    handleDeleteNode,
    handleAddGroup,
    handleEditGroup
  } = useEstimateBuilder();

  const indentationStyle = {
    marginLeft: level * 15, // Indent based on nesting level
  };

  if (node.type === 'group') {
    return (
      <View style={[styles.groupContainer, indentationStyle]}>
        <View style={styles.groupHeaderContainer}>
          <Text style={styles.groupHeader}><Text>{node.name}</Text></Text>
          <View style={styles.groupActionButtons}>
            {/* Wire up buttons to context handlers, disable add buttons if no quote ID */}
            <Button title={"↑"} onPress={() => handleMoveNode(node.quote_group_id, 'group', 'up')} />
            <Button title={"↓"} onPress={() => handleMoveNode(node.quote_group_id, 'group', 'down')} />
            <Button title={"+ Item"} onPress={() => handleAddItem(node.quote_group_id)} disabled={!currentQuoteId} />
            <Button title={"+ Group"} onPress={() => handleAddGroup(node.quote_group_id)} disabled={!currentQuoteId} />
            <Button title={"Edit"} onPress={() => handleEditGroup(node)} />
            <Button title={"Del"} onPress={() => handleDeleteNode(node.quote_group_id, 'group')} color="red" />
          </View>
        </View>
        {/* Recursively render children */}
        {node.children.length > 0 ? (
          node.children.map(childNode => (
            <EstimateNodeDisplay
              key={childNode.type === 'item' ? childNode.quote_item_id : childNode.quote_group_id}
              node={childNode}
              level={level + 1} // Increase indentation level for children
              onEditItem={onEditItem} // Pass onEditItem down recursively
            />
          ))
        ) : (
          <Text style={[styles.emptyGroupText, { marginLeft: (level + 1) * 15 }]}><Text>No items or sub-groups in this group.</Text></Text>
        )}
      </View>
    );
  }

  if (node.type === 'item') {
    // No need to destructure props again, onEditItem is already available from function arguments
    // console.log('Rendering item node:', node); // Remove log

    return (
      <View style={[styles.rowWithButtons, indentationStyle]}>
        {/* Use the passed-in onEditItem handler */}
        <TouchableOpacity style={{ flex: 1 }} onPress={() => onEditItem(node)}>
          <View style={styles.itemContainer}>
            {/* Restore title rendering with proper Text wrapping */}
            <Text style={styles.itemDescription}>
              {node.title ? <Text>({node.title}) </Text> : null}
              <Text>{node.description || ''}</Text>
            </Text>
            {/* Restore original itemDetails rendering with proper Text wrapping */}
            <Text style={styles.itemDetails}>
              <Text>{node.quantity ?? 0} </Text>
              <Text>{node.unit || ''} </Text>
              <Text>@ $</Text>
              <Text>{Number(node.calculated_total_cost_per_unit ?? 0).toFixed(2)} </Text>
              <Text>= $</Text>
              <Text>{Number(node.calculated_total_with_markup ?? 0).toFixed(2)}</Text>
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.reorderButtons}>
          {/* Wire up buttons to context handlers */}
          <Button title={"↑"} onPress={() => handleMoveNode(node.quote_item_id, 'item', 'up')} />
          <Button title={"↓"} onPress={() => handleMoveNode(node.quote_item_id, 'item', 'down')} />
           <Button title={"Del"} onPress={() => handleDeleteNode(node.quote_item_id, 'item')} color="red" />
        </View>
      </View>
    );
  }

  // Fallback for unknown node types (shouldn't happen with TypeScript)
  return <Text style={{ color: 'red', marginLeft: indentationStyle.marginLeft }}><Text>Unknown Node Type</Text></Text>;
};

// Use similar styles from EstimateBuilderScreen for consistency
const styles = StyleSheet.create({
  groupContainer: {
    marginBottom: 10,
    // backgroundColor: '#f9f9f9', // Optional background for groups
    // borderLeftWidth: 2, // Optional border to show hierarchy
    // borderLeftColor: '#e0e0e0',
    // paddingLeft: 5, // Included in indentationStyle now
  },
  groupHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    paddingVertical: 5,
    paddingHorizontal: 5,
    backgroundColor: '#eee', // Header background
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  groupHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flexShrink: 1, // Allow text to shrink if buttons take space
    marginRight: 5,
  },
  groupActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowWithButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginLeft handled by indentationStyle
  },
  reorderButtons: {
    flexDirection: 'column', // Stack buttons vertically for items? Or keep row? Let's try column.
    marginLeft: 5,
  },
  itemContainer: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flex: 1, // Ensure TouchableOpacity takes full width available
  },
  itemDescription: {
    // Style for item description
  },
  itemDetails: {
    fontSize: 12,
    color: 'gray',
    marginTop: 2,
  },
  emptyGroupText: {
    fontStyle: 'italic',
    color: 'gray',
    paddingVertical: 5,
    paddingHorizontal: 10,
    // marginLeft handled by indentationStyle
  },
});

export default EstimateNodeDisplay;
