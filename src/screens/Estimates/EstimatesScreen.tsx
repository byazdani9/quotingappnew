import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed

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

const EstimatesScreen = () => {
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

const renderItem = ({ item }: { item: Quote }) => (
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
      />
      {/* TODO: Add '+' button for new estimate */}
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
});

export default EstimatesScreen;
