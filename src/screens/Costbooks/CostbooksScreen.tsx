import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed

// Define a type for the costbook data we expect
// Adjust based on the actual columns you need from the 'costbooks' table
type Costbook = {
  costbook_id: string; // uuid
  name: string;
  description: string | null;
  // Add other relevant fields from your 'costbooks' table
};

const CostbooksScreen = () => {
  const [costbooks, setCostbooks] = useState<Costbook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCostbooks();
  }, []);

  const fetchCostbooks = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch costbooks - adjust columns as needed
      // Add RLS filtering later if needed
      const { data, error: fetchError } = await supabase
        .from('costbooks')
        .select('costbook_id, name, description') // Select specific columns
        .order('name', { ascending: true }); // Example order

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setCostbooks(data as Costbook[]); // Cast data to our Costbook type
      }
    } catch (e: any) {
      setError(e.message);
      Alert.alert('Error fetching costbooks', e.message);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Costbook }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.name}</Text>
      {item.description && <Text style={styles.itemSubText}>{item.description}</Text>}
      {/* Add navigation onPress to view costbook details later */}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
        {/* Optionally add a retry button */}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Costbooks</Text>
      <FlatList
        data={costbooks}
        renderItem={renderItem}
        keyExtractor={(item) => item.costbook_id}
        ListEmptyComponent={<Text style={styles.emptyText}>No costbooks found.</Text>}
      />
      {/* TODO: Add '+' button for new costbook */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  centered: { // Added for loading/error states
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500', // Make name slightly bolder
  },
  itemSubText: { // Style for description
    fontSize: 14,
    color: 'gray',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'gray',
  },
  errorText: { // Added for error state
    color: 'red',
    fontSize: 16,
  }
});

export default CostbooksScreen;
