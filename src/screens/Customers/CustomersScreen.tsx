import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Button, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native'; // Import useNavigation and useFocusEffect
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Import navigation prop type
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed
// Import the renamed content component - NOT USED DIRECTLY HERE ANYMORE
// import CustomerModalContent from '../../components/Customer/CustomerModal';
import { CustomerFormData } from '../../components/Customer/CustomerForm'; // Import form data type
// Import the ParamList type from the detail screen (or define it centrally)
import { CustomerStackParamList } from './CustomerDetailScreen'; // Assuming this is defined correctly

// Define a type for the full customer data including ID
type Customer = CustomerFormData & {
    customer_id: string; // uuid
    // Include other fields if needed
};

// Define the navigation prop type using the stack param list
type CustomersScreenNavigationProp = NativeStackNavigationProp<
  CustomerStackParamList,
  'CustomerList' // This screen's name in the stack
>;

const CustomersScreen = () => {
  const navigation = useNavigation<CustomersScreenNavigationProp>(); // Get navigation object
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  // Remove modal visibility state, navigation stack handles it
  // const [isModalVisible, setIsModalVisible] = useState(false);
  // Remove selectedCustomer state for modal
  // const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    // Don't set loading to true here if it's just a refresh
    // setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('customers')
        .select('customer_id, first_name, last_name, company_name, phone, email, address, city, state, postal_code, notes') // Select needed columns
        .order('last_name', { ascending: true })
        .order('first_name', { ascending: true });

      if (fetchError) throw fetchError;
      if (data) setCustomers(data as Customer[]);

    } catch (e: any) {
      setError(e.message);
      Alert.alert('Error fetching customers', e.message);
    } finally {
      setLoading(false); // Set loading false after fetch completes or fails
    }
  }, []);

  // Use useFocusEffect to refetch data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true); // Set loading true when focusing
      fetchCustomers();
    }, [fetchCustomers])
  );

  // Update handleAddCustomer to navigate to the modal screen
  const handleAddCustomer = () => {
    // Navigate to the modal screen in the stack, no params needed for adding
    // Ensure 'CustomerModalScreen' is correctly defined in your CustomerStackNav in App.tsx
    navigation.navigate('CustomerModalScreen', {});
  };

  // Keep handleNavigateToDetail as is
  const handleNavigateToDetail = (customer: Customer) => {
    navigation.navigate('CustomerDetail', { customerId: customer.customer_id });
  };

  // Remove handleModalClose and handleModalSave, they belong in CustomerModalScreen now
  /*
  const handleModalClose = () => { ... };
  const handleModalSave = (savedCustomer: Customer) => { ... };
  */


  const renderItem = ({ item }: { item: Customer }) => (
    // Update onPress to call handleNavigateToDetail
    <TouchableOpacity onPress={() => handleNavigateToDetail(item)}>
      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>
          <Text>{item.first_name || ''}</Text>
          {item.first_name && item.last_name ? <Text> </Text> : null}
          <Text>{item.last_name || ''}</Text>
        </Text>
        {item.company_name && <Text style={styles.itemSubText}><Text>{item.company_name}</Text></Text>}
        {/* Add more details like phone/email if needed */}
      </View>
    </TouchableOpacity>
  );

  // Show loading only on initial load (when customers array is empty)
  if (loading && customers.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          <Text>Error: </Text>
          <Text>{error}</Text>
        </Text>
        <Button title="Retry" onPress={() => { setLoading(true); fetchCustomers(); }} />
      </View>
    );
  }

  // Filter customers based on search term (case-insensitive)
  const filteredCustomers = customers.filter((customer) => {
    const fullName = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
    const company = (customer.company_name || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || company.includes(term);
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
         <View style={{ flex: 1 }} />
         <Button title="Add New" onPress={handleAddCustomer} />
      </View>
      <TextInput
        style={styles.searchInputStandalone}
        placeholder="Search customers..."
        value={searchTerm}
        onChangeText={setSearchTerm}
        clearButtonMode="while-editing"
      />
      <FlatList
        data={filteredCustomers}
        renderItem={renderItem}
        keyExtractor={(item) => item.customer_id}
        ListEmptyComponent={<Text style={styles.emptyText}><Text>No customers found.</Text></Text>}
        refreshing={loading} // Show refresh indicator while fetching via pull-to-refresh
        onRefresh={() => { setLoading(true); fetchCustomers(); }} // Allow pull-to-refresh
      />
      {/* Remove the direct rendering of CustomerModal */}
      {/* 
      <CustomerModal
        isVisible={isModalVisible}
        onClose={handleModalClose}
        customerToEdit={null} // Modal is now only for adding from this screen
        onSave={handleModalSave}
      />
      */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
   headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 5, // Add some padding
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemContainer: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubText: {
    fontSize: 14,
    color: 'gray',
    marginTop: 2,
  },
  searchInputStandalone: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    fontSize: 16,
    marginBottom: 10,
    marginHorizontal: 0,
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
    marginBottom: 10, // Add space before retry button
  }
});

export default CustomersScreen;
