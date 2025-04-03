import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native'; // Added TouchableOpacity
import { useNavigation } from '@react-navigation/native'; // Added useNavigation
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Added for type safety
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed
import { EstimateStackParamList } from '../../../App'; // Import the stack param list

// Define a type for the quote data we expect
// Adjust based on the actual columns you need from the 'quotes' table
type Quote = {
  estimate_id: string; // uuid
  // estimate_number: string; // Removed - Column does not exist
  customer_id: string | null; // uuid, assuming it can be null
  status: string | null;
  total: number | null;
  // Add other relevant fields from your 'quotes' table
};

// Define the navigation prop type for this screen within the EstimateStack
type EstimatesScreenNavigationProp = NativeStackNavigationProp<
  EstimateStackParamList,
  'EstimateList' // This screen's route name in the stack
>;

const EstimatesScreen = () => {
  const navigation = useNavigation<EstimatesScreenNavigationProp>(); // Hook for navigation
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch quotes - adjust columns as needed
      // Add .eq('user_id', supabase.auth.getUser().id) etc. based on RLS later
      const { data, error: fetchError } = await supabase
        .from('quotes')
        .select('estimate_id, customer_id, status, total') // Select specific columns - removed estimate_number
        .order('created_at', { ascending: false }); // Example order

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setQuotes(data as Quote[]); // Cast data to our Quote type
      }
    } catch (e: any) {
      setError(e.message);
      Alert.alert('Error fetching quotes', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewEstimate = () => {
    // Navigate to the builder screen for a NEW estimate (no ID passed)
    navigation.navigate('EstimateBuilder', {}); 
  };

  const renderItem = ({ item }: { item: Quote }) => (
    // TODO: Make items pressable to navigate to EstimateBuilder for editing
    // onPress={() => navigation.navigate('EstimateBuilder', { estimateId: item.estimate_id })}
    <View style={styles.itemContainer}>
      {/* <Text style={styles.itemText}>Number: {item.estimate_number}</Text> // Removed - Column does not exist */}
      <Text style={styles.itemText}>ID: {item.estimate_id}</Text> {/* Displaying ID for now */}
      <Text style={styles.itemText}>Status: {item.status ?? 'N/A'}</Text>
      <Text style={styles.itemText}>Total: {item.total?.toFixed(2) ?? 'N/A'}</Text>
      {/* Add more details or navigation onPress later */}
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
      <Text style={styles.title}>Estimates Dashboard</Text>
      <FlatList
        data={quotes}
        renderItem={renderItem}
        keyExtractor={(item) => item.estimate_id}
        ListEmptyComponent={<Text style={styles.emptyText}>No estimates found.</Text>}
        // Add some padding at the bottom to avoid overlap with button
        contentContainerStyle={{ paddingBottom: 60 }} 
      />
      {/* Add New Estimate Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddNewEstimate}>
        <Text style={styles.addButtonText}>+ Add New Estimate</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10, 
  },
  centered: { 
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
  },
  emptyText: { 
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: 'gray',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  addButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF', // Example blue color
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 30,
    elevation: 5, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EstimatesScreen;
