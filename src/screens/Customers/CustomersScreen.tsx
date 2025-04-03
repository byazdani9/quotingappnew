import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Button, TouchableOpacity } from 'react-native';
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed
import CustomerModal from '../../components/Customer/CustomerModal'; // Import the modal
import { CustomerFormData } from '../../components/Customer/CustomerForm'; // Import form data type

// Define a type for the full customer data including ID
type Customer = CustomerFormData & {
    customer_id: string; // uuid
    // Include other fields if needed
};

const CustomersScreen = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleAddCustomer = () => {
    setSelectedCustomer(null); // Ensure we are adding, not editing
    setIsModalVisible(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedCustomer(null); // Clear selected customer on close
  };

  const handleModalSave = (savedCustomer: Customer) => {
     // Refresh the list after saving
     // Option 1: Simple refetch
     fetchCustomers();

     // Option 2: Optimistic update (more complex)
     // if (selectedCustomer) {
     //   // Update existing customer in state
     //   setCustomers(prev => prev.map(c => c.customer_id === savedCustomer.customer_id ? savedCustomer : c));
     // } else {
     //   // Add new customer to state
     //   setCustomers(prev => [savedCustomer, ...prev]);
     // }
  };


  const renderItem = ({ item }: { item: Customer }) => (
    <TouchableOpacity onPress={() => handleEditCustomer(item)}>
      <View style={styles.itemContainer}>
        <Text style={styles.itemText}>{item.first_name} {item.last_name}</Text>
        {item.company_name && <Text style={styles.itemSubText}>{item.company_name}</Text>}
        {/* Add more details like phone/email if needed */}
      </View>
    </TouchableOpacity>
  );

  if (loading && customers.length === 0) { // Show loading only on initial load
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
        <Button title="Retry" onPress={fetchCustomers} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
         <Text style={styles.title}>Customers</Text>
         <Button title="Add New" onPress={handleAddCustomer} />
      </View>
      <FlatList
        data={customers}
        renderItem={renderItem}
        keyExtractor={(item) => item.customer_id}
        ListEmptyComponent={<Text style={styles.emptyText}>No customers found.</Text>}
        refreshing={loading} // Show refresh indicator while fetching
        onRefresh={fetchCustomers} // Allow pull-to-refresh
      />
      <CustomerModal
        isVisible={isModalVisible}
        onClose={handleModalClose}
        customerToEdit={selectedCustomer}
        onSave={handleModalSave}
      />
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
