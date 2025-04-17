import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native'; // Added TouchableOpacity
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Added useNavigation and useFocusEffect
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Added for type safety
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed
import { EstimateStackParamList, JobStackParamList, AppDrawerParamList } from '../../../App'; // Import all param lists
import { CompositeNavigationProp } from '@react-navigation/native'; // Import CompositeNavigationProp
import { DrawerNavigationProp } from '@react-navigation/drawer'; // Import DrawerNavigationProp

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

// Define a composite navigation prop type for nested navigation
type EstimatesScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<EstimateStackParamList, 'EstimateList'>,
  DrawerNavigationProp<AppDrawerParamList>
>;

const EstimatesScreen = () => {
  const navigation = useNavigation<EstimatesScreenNavigationProp>(); // Hook for navigation
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert fetchQuotes to useCallback for useFocusEffect
  const fetchQuotes = useCallback(async () => {
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
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Refresh quotes when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('EstimatesScreen focused, refreshing quotes');
      fetchQuotes();
      return () => {
        // Cleanup function when screen loses focus (optional)
      };
    }, [fetchQuotes])
  );

  const handleAddNewEstimate = () => {
    // Navigate to the Jobs stack first, then to the NewEstimateDetails screen
    console.log('Navigating to Jobs > NewEstimateDetails screen');
    
    // Use ts-ignore to bypass type checking for the nested navigation
    // @ts-ignore - This is valid navigation syntax for nested navigators
    navigation.navigate('Jobs', { 
      screen: 'NewEstimateDetails' 
    });
  };

  const renderItem = ({ item }: { item: Quote }) => (
    <TouchableOpacity
      onPress={() => {
        // @ts-ignore - Accept navigation to nested stack
        navigation.navigate('Jobs', {
          screen: 'EstimateBuilder',
          params: { estimateId: item.estimate_id }
        });
      }}
    >
      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>ID: {item.estimate_id}</Text>
        <Text style={styles.itemText}>Status: {item.status ?? 'N/A'}</Text>
        <Text style={styles.itemText}>Total: {item.total?.toFixed(2) ?? 'N/A'}</Text>
      </View>
    </TouchableOpacity>
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
      
      {/* Debug button for direct navigation */}
      <View style={{ marginBottom: 16, alignItems: 'center' }}>
        <TouchableOpacity 
          style={{ 
            padding: 10, 
            backgroundColor: '#4a90e2', 
            borderRadius: 8,
            marginBottom: 10
          }}
          onPress={() => {
            console.log('Trying direct navigation to JobStack/NewEstimateDetails');
            // Use the same pattern as our main navigation function
            // @ts-ignore - Bypass type checking for debugging
            navigation.navigate('Jobs', { screen: 'NewEstimateDetails' });
          }}
        >
          <Text style={{ color: 'white' }}>DEBUG: Open New Estimate Details</Text>
        </TouchableOpacity>
      </View>
      
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
