import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Button, ActivityIndicator, TextInput, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions } from '@react-navigation/native'; // Keep CommonActions import
import { JobStackParamList } from '../../../App'; // Adjust path
import { supabase } from '../../lib/supabaseClient'; // Adjust path
import { CustomerFormData } from '../../components/Customer/CustomerForm'; // Import type
import { useEstimateBuilder } from '../../contexts/EstimateBuilderContext'; // Import context hook

// Define Customer type including ID and potentially other needed fields for display
type Customer = Partial<CustomerFormData> & {
    customer_id: string;
    first_name?: string | null; // Ensure context type matches
    last_name?: string | null; // Ensure context type matches
    company_name?: string;
};

// Define props - include route
type Props = NativeStackScreenProps<JobStackParamList, 'CustomerSelectionScreen'>;

const CustomerSelectionScreen: React.FC<Props> = ({ navigation, route }) => { // Add route to props
    const { jobTitle, templateId } = route.params; // Extract params
    const { setSelectedCustomer } = useEstimateBuilder(); // Get setter from context
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let query = supabase
                .from('customers')
                // Select fields needed for context (including address) and display
                .select('customer_id, first_name, last_name, company_name, address, city, postal_code') 
                .order('last_name', { ascending: true })
                .order('first_name', { ascending: true });

            if (searchTerm) {
                 query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            setCustomers((data as Customer[]) || []);
        } catch (e: any) {
            setError(e.message);
            console.error("Error fetching customers:", e.message);
        } finally {
            setLoading(false);
        }
    }, [searchTerm]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', fetchCustomers);
        return unsubscribe;
    }, [navigation, fetchCustomers]);

    const handleSelectCustomer = (selectedCustomer: Customer) => {
        console.log("[CustomerSelectionScreen] Setting customer in context:", selectedCustomer.customer_id);
        // Set the selected customer in the context
        setSelectedCustomer({
            customer_id: selectedCustomer.customer_id,
            first_name: selectedCustomer.first_name,
            last_name: selectedCustomer.last_name,
            // Add address fields to context
            address: selectedCustomer.address,
            city: selectedCustomer.city,
            postal_code: selectedCustomer.postal_code,
        });
        // Navigate forward to EstimateBuilder, passing jobTitle and templateId
        // estimateId will be undefined, indicating a new estimate
        navigation.navigate('EstimateBuilder', {
            jobTitle: jobTitle,
            templateId: templateId,
            // customerId is implicitly handled by the context now
        });
    };

    const handleAddNewCustomer = () => {
        // Navigate to the modal screen for adding a new customer, passing jobTitle and templateId
        navigation.navigate({
            name: 'CustomerModalScreen',
            params: { jobTitle, templateId }
        });
    };

    const renderItem = ({ item }: { item: Customer }) => (
        <TouchableOpacity onPress={() => handleSelectCustomer(item)} style={styles.itemContainer}>
            <Text style={styles.itemTextName}>{item.first_name || ''} {item.last_name || ''}</Text>
            {item.company_name && <Text style={styles.itemTextCompany}>{item.company_name}</Text>}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                 <Button title="Cancel" onPress={() => navigation.goBack()} />
                 <Text style={styles.title}>Select Customer</Text>
                 <Button title="Add New" onPress={handleAddNewCustomer} />
            </View>
            <TextInput
                style={styles.searchInput}
                placeholder="Search customers..."
                value={searchTerm}
                onChangeText={setSearchTerm}
                clearButtonMode="while-editing"
            />
            {loading && <ActivityIndicator style={styles.loader} size="large" />}
            {error && <Text style={styles.errorText}>Error: {error}</Text>}
            {!loading && !error && (
                <FlatList
                    data={customers}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.customer_id}
                    ListEmptyComponent={<Text style={styles.emptyText}>No customers found.</Text>}
                />
            )}
        </SafeAreaView>
    );
};

// Styles remain the same
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fff', },
     header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ccc', backgroundColor: '#f8f8f8', },
    title: { fontSize: 17, fontWeight: '600', },
    searchInput: { height: 40, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, marginHorizontal: 15, marginTop: 10, marginBottom: 5, paddingHorizontal: 10, backgroundColor: '#f0f0f0', },
    loader: { marginTop: 20, },
    errorText: { color: 'red', textAlign: 'center', marginTop: 20, paddingHorizontal: 15, },
    itemContainer: { paddingVertical: 12, paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ccc', },
    itemTextName: { fontSize: 16, },
    itemTextCompany: { fontSize: 14, color: 'gray', marginTop: 2, },
    emptyText: { textAlign: 'center', marginTop: 30, fontSize: 16, color: 'gray', },
});

export default CustomerSelectionScreen;
