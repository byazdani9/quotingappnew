import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Button, FlatList, TouchableOpacity, Pressable } from 'react-native'; // Removed ScrollView, Added FlatList, TouchableOpacity, Pressable
import { Checkbox } from 'react-native-paper'; // Import Checkbox from react-native-paper
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CommonActions, useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed
// Import JobStackParamList to navigate to EstimateBuilder
import { JobStackParamList } from '../../../App';

// Define Customer type (can be imported if shared)
type Customer = {
    customer_id: string;
    first_name?: string | null;
    last_name?: string | null;
    company_name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    notes?: string | null;
};

// Define a simple type for related quotes
type RelatedQuote = {
    estimate_id: string;
    name?: string | null;
    status?: string | null;
    created_at?: string | null;
    job_id?: string | null; // Add job_id field to check if this is a job
    // Add total if needed later
};

// Define ParamList for this stack
export type CustomerStackParamList = {
    CustomerList: undefined;
    CustomerDetail: { customerId: string };
    // Add CustomerModalScreen to the stack params
    CustomerModalScreen: { customerToEdit?: any, onSaveSuccessRoute?: string };
};

type Props = NativeStackScreenProps<CustomerStackParamList, 'CustomerDetail'>;

const CustomerDetailScreen: React.FC<Props> = ({ route, navigation }) => {
    const { customerId } = route.params;
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [relatedQuotes, setRelatedQuotes] = useState<RelatedQuote[]>([]); // State for related quotes
    const [loading, setLoading] = useState(true);
    const [loadingQuotes, setLoadingQuotes] = useState(true); // Separate loading for quotes
    const [error, setError] = useState<string | null>(null);
    
    // Multi-select mode state
    const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isDeleteEnabled, setIsDeleteEnabled] = useState(true); // Toggle for enabling/disabling multi-delete feature

    // Define fetchCustomer and fetchRelatedQuotes functions outside of useEffect
    const fetchCustomer = useCallback(async () => {
        setLoading(true); // Keep main loading for customer fetch
        setError(null);
        try {
            const { data, error: fetchError } = await supabase
                .from('customers')
                .select('*')
                .eq('customer_id', customerId)
                .single();

            if (fetchError) throw fetchError;
            if (!data) throw new Error('Customer not found');
            setCustomer(data as Customer);
        } catch (e: any) {
            setError(e.message);
            Alert.alert('Error fetching customer details', e.message);
        } finally {
            setLoading(false); // Customer loading finished
        }
    }, [customerId]);

    const fetchRelatedQuotes = useCallback(async () => {
        setLoadingQuotes(true);
        try {
            // First, fetch quotes
            const { data: quotesData, error: quoteError } = await supabase
                .from('quotes')
                .select('estimate_id, name, status, created_at')
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false }); // Show newest first

            if (quoteError) throw quoteError;
            
            // Then, fetch jobs that reference these quotes
            if (quotesData && quotesData.length > 0) {
                const estimateIds = quotesData.map(quote => quote.estimate_id);
                
                const { data: jobsData, error: jobsError } = await supabase
                    .from('jobs')
                    .select('job_id, quote_id')
                    .in('quote_id', estimateIds);
                
                if (jobsError) {
                    console.warn("Error fetching related jobs:", jobsError.message);
                } else if (jobsData) {
                    // Create a map of estimate_id to job_id
                    const jobMap = jobsData.reduce((map, job) => {
                        if (job.quote_id) {
                            map[job.quote_id] = job.job_id;
                        }
                        return map;
                    }, {} as Record<string, string>);
                    
                    // Add job_id to each quote
                    const quotesWithJobs = quotesData.map(quote => ({
                        ...quote,
                        job_id: jobMap[quote.estimate_id] || null
                    }));
                    
                    setRelatedQuotes(quotesWithJobs as RelatedQuote[]);
                } else {
                    setRelatedQuotes(quotesData as RelatedQuote[]);
                }
            } else {
                setRelatedQuotes([]);
            }
        } catch (e: any) {
            // Don't overwrite main customer fetch error
            console.error("Error fetching related quotes:", e.message);
            // Avoid alerting for quote fetch errors if customer fetch succeeded
            // Alert.alert('Error fetching related quotes', e.message);
        } finally {
            setLoadingQuotes(false); // Quotes loading finished
        }
    }, [customerId]);

    // Initial data fetch
    useEffect(() => {
        fetchCustomer();
        fetchRelatedQuotes();
    }, [fetchCustomer, fetchRelatedQuotes]);

    // Refresh related quotes when the screen comes into focus
    useFocusEffect(
        useCallback(() => {
            console.log('CustomerDetailScreen focused, refreshing related quotes');
            fetchRelatedQuotes();
            return () => {
                // Cleanup function when screen loses focus (optional)
            };
        }, [fetchRelatedQuotes])
    );

    // Set header title dynamically and add multi-select controls to header
    useEffect(() => {
        if (customer) {
            const customerName = `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim() || 'Customer Details';
            
            if (isMultiSelectMode) {
                // In multi-select mode, show cancel button and selected count
                navigation.setOptions({
                    title: `${selectedItems.size} Selected`,
                    headerRight: () => (
                        <Button
                            title="Cancel"
                            onPress={() => {
                                setIsMultiSelectMode(false);
                                setSelectedItems(new Set());
                            }}
                        />
                    ),
                });
            } else {
                // Normal mode, show customer name
                navigation.setOptions({
                    title: customerName,
                    headerRight: undefined,
                });
            }
        }
    }, [navigation, customer, isMultiSelectMode, selectedItems]);

    // Toggle multi-select mode
    const toggleMultiSelectMode = () => {
        if (!isDeleteEnabled) return; // Don't allow multi-select if feature is disabled
        setIsMultiSelectMode(!isMultiSelectMode);
        setSelectedItems(new Set()); // Clear selections when toggling mode
    };

    // Toggle item selection
    const toggleItemSelection = (itemId: string) => {
        const newSelectedItems = new Set(selectedItems);
        if (newSelectedItems.has(itemId)) {
            newSelectedItems.delete(itemId);
        } else {
            newSelectedItems.add(itemId);
        }
        setSelectedItems(newSelectedItems);
    };

    // Handle batch deletion
    const handleBatchDelete = async () => {
        if (selectedItems.size === 0) return;

        // Separate jobs and estimates
        const selectedJobs: string[] = [];
        const selectedEstimates: string[] = [];

        relatedQuotes.forEach(item => {
            if (selectedItems.has(item.estimate_id)) {
                if (item.job_id) {
                    selectedJobs.push(item.job_id);
                } else {
                    selectedEstimates.push(item.estimate_id);
                }
            }
        });

        Alert.alert(
            "Confirm Deletion",
            `Are you sure you want to delete ${selectedItems.size} item(s)? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        try {
                            // Delete jobs first
                            if (selectedJobs.length > 0) {
                                const { error: jobsError } = await supabase
                                    .from('jobs')
                                    .delete()
                                    .in('job_id', selectedJobs);
                                
                                if (jobsError) throw jobsError;
                            }

                            // Delete quote items for selected estimates
                            if (selectedEstimates.length > 0) {
                                const { error: itemsError } = await supabase
                                    .from('quote_items')
                                    .delete()
                                    .in('quote_id', selectedEstimates);
                                
                                if (itemsError) throw itemsError;
                                
                                // Delete quote groups for selected estimates
                                const { error: groupsError } = await supabase
                                    .from('quote_groups')
                                    .delete()
                                    .in('quote_id', selectedEstimates);
                                
                                if (groupsError) throw groupsError;
                                
                                // Delete the quotes themselves
                                const { error: quotesError } = await supabase
                                    .from('quotes')
                                    .delete()
                                    .in('estimate_id', selectedEstimates);
                                
                                if (quotesError) throw quotesError;
                            }

                            Alert.alert("Success", `Successfully deleted ${selectedItems.size} item(s).`);
                            setIsMultiSelectMode(false);
                            setSelectedItems(new Set());
                            fetchRelatedQuotes(); // Refresh the list
                        } catch (e: any) {
                            Alert.alert("Error", `Failed to delete items: ${e.message}`);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Toggle delete feature
    const toggleDeleteFeature = () => {
        setIsDeleteEnabled(!isDeleteEnabled);
        if (isMultiSelectMode) {
            setIsMultiSelectMode(false);
            setSelectedItems(new Set());
        }
    };

    const handleDeleteCustomer = async () => {
        if (!customer) return;

        Alert.alert(
            "Delete Customer",
            `Are you sure you want to delete ${customer.first_name} ${customer.last_name}? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const { count, error: countError } = await supabase
                                .from('quotes')
                                .select('*', { count: 'exact', head: true })
                                .eq('customer_id', customerId);

                            if (countError) throw countError;

                            if (count !== null && count > 0) {
                                Alert.alert(
                                    "Cannot Delete Customer",
                                    `This customer has ${count} associated quote(s) and cannot be deleted.`
                                );
                                return;
                            }

                            const { error: deleteError } = await supabase
                                .from('customers')
                                .delete()
                                .eq('customer_id', customerId);

                            if (deleteError) throw deleteError;

                            Alert.alert("Success", "Customer deleted successfully.");
                            navigation.navigate('CustomerList');
                        } catch (e: any) {
                            Alert.alert("Error", `Failed to delete customer: ${e.message}`);
                        }
                    },
                },
            ]
        );
    };

    // Component to render the customer details and buttons (used as header/empty component)
    const renderHeader = () => {
        // Return an empty View instead of null if customer isn't loaded yet
        if (!customer) return <View />; 

        return (
            <View style={styles.headerContentContainer}>
                <Text style={styles.label}>
                    <Text>Name:</Text>
                </Text>
                <Text style={styles.value}>
                    <Text>{customer.first_name || ''}</Text>
                    {customer.first_name && customer.last_name ? <Text> </Text> : null}
                    <Text>{customer.last_name || ''}</Text>
                </Text>

                {/* Use ternary operator for conditional rendering */}
                {customer.company_name ? (
                    <>
                        <Text style={styles.label}>
                            <Text>Company:</Text>
                        </Text>
                        <Text style={styles.value}>
                            <Text>{customer.company_name}</Text>
                        </Text>
                    </>
                ) : null}

                <Text style={styles.label}>
                    <Text>Phone:</Text>
                </Text>
                <Text style={styles.value}>
                    <Text>{customer.phone || 'N/A'}</Text>
                </Text>

                <Text style={styles.label}>
                    <Text>Email:</Text>
                </Text>
                <Text style={styles.value}>
                    <Text>{customer.email || 'N/A'}</Text>
                </Text>

            <Text style={styles.label}>
                <Text>Address:</Text>
            </Text>
            <Text style={styles.value}>
                <Text>{customer.address || ''}</Text>
                {customer.address ? <Text>{'\n'}</Text> : null}
                <Text>
                    {[
                        customer.city || '',
                        customer.state || '',
                        customer.postal_code || ''
                    ].filter(Boolean).join(' ')}
                </Text>
                {(!customer.address && !customer.city && !customer.state && !customer.postal_code) ? 
                    <Text>N/A</Text> : 
                    null
                }
            </Text>

            {/* Use ternary operator for conditional rendering */}
            {customer.notes ? (
                    <>
                        <Text style={styles.label}>
                            <Text>Notes:</Text>
                        </Text>
                        <Text style={styles.value}>
                            <Text>{customer.notes}</Text>
                        </Text>
                    </>
                ) : null}

                {/* Edit Button */}
                <View style={styles.buttonContainer}>
                    <Button
                        title="Edit Customer"
                        onPress={() => {
                            if (customer) {
                                navigation.navigate('CustomerModalScreen', { customerToEdit: customer });
                            } else {
                                Alert.alert("Error", "Customer data not available to edit.");
                            }
                        }}
                    />
                </View>

                {/* Delete Button */}
                <View style={styles.buttonContainer}>
                     <Button
                        title="Delete Customer"
                        color="red"
                        onPress={handleDeleteCustomer}
                     />
                </View>

                {/* Related Jobs/Estimates Section Title */}
                <View style={styles.relatedSectionHeader}>
                    <View style={styles.sectionTitleRow}>
                        <Text style={styles.sectionTitle}>
                            <Text>Related Jobs/Estimates</Text>
                        </Text>
                        
                        {/* Multi-select controls */}
                        <View style={styles.multiSelectControls}>
                            {isDeleteEnabled && (
                                <Button
                                    title={isMultiSelectMode ? "Cancel" : "Select"}
                                    onPress={toggleMultiSelectMode}
                                />
                            )}
                            
                            {/* Toggle for enabling/disabling multi-delete feature */}
                            <View style={styles.toggleContainer}>
                                <Text style={styles.toggleLabel}>
                                    <Text>Multi-Delete: </Text>
                                </Text>
                                <Button
                                    title={isDeleteEnabled ? "Enabled" : "Disabled"}
                                    onPress={toggleDeleteFeature}
                                    color={isDeleteEnabled ? "green" : "gray"}
                                />
                            </View>
                        </View>
                    </View>
                    
                    <Text style={styles.legendText}>
                        <Text>🔨 Jobs (can be deleted) | 📝 Estimates</Text>
                    </Text>
                    
                    {/* Delete button for multi-select mode */}
                    {isMultiSelectMode && selectedItems.size > 0 && (
                        <View style={styles.batchDeleteContainer}>
                            <Button
                                title={`Delete Selected (${selectedItems.size})`}
                                onPress={handleBatchDelete}
                                color="red"
                            />
                        </View>
                    )}
                </View>
            </View>
        );
    };


    // Main loading state for customer data
    if (loading) {
        return <View style={styles.centered}>
            <ActivityIndicator size="large" />
        </View>;
    }

    // Error state specifically for customer fetch
    if (error) {
        return <View style={styles.centered}>
            <Text style={styles.errorText}>
                <Text>Error: </Text>
                <Text>{error}</Text>
            </Text>
        </View>;
    }

    // Should not happen if loading/error checks pass, but good practice
    if (!customer) {
        return <View style={styles.centered}>
            <Text>
                <Text>Customer not found.</Text>
            </Text>
        </View>;
    }

    return (
        // Use FlatList as the main container
        <FlatList
            style={styles.container} // Apply container style (flex: 1)
            data={relatedQuotes}
            keyExtractor={(item) => item.estimate_id}
            ListHeaderComponent={renderHeader} // Render details and buttons as header
            renderItem={({ item }) => {
                // Debug logging to see the exact structure of each item
                console.log('Rendering item:', JSON.stringify(item));
                
                const isSelected = selectedItems.has(item.estimate_id);
                
                return (
                    <View style={styles.quoteItemContainer}>
                        <TouchableOpacity
                            style={[
                                styles.quoteItem,
                                isMultiSelectMode && isSelected && styles.selectedItem
                            ]}
                            onPress={() => {
                                if (isMultiSelectMode) {
                                    // In multi-select mode, toggle selection
                                    toggleItemSelection(item.estimate_id);
                                } else {
                                    // Normal mode, navigate to detail screen
                                    if (item.job_id) {
                                        // If this is a job, navigate to JobDetail screen
                                        (navigation as any).navigate('Jobs', {
                                            screen: 'JobDetail',
                                            params: { jobId: item.job_id },
                                            initial: false, // This tells React Navigation this is not the initial screen
                                        });
                                    } else {
                                        // If this is just an estimate, navigate to EstimateBuilder screen
                                        (navigation as any).navigate('Jobs', {
                                            screen: 'EstimateBuilder',
                                            params: { estimateId: item.estimate_id },
                                            initial: false, // This tells React Navigation this is not the initial screen
                                        });
                                    }
                                }
                            }}
                            onLongPress={() => {
                                if (isDeleteEnabled && !isMultiSelectMode) {
                                    // Long press to enter multi-select mode and select this item
                                    setIsMultiSelectMode(true);
                                    toggleItemSelection(item.estimate_id);
                                }
                            }}
                        >
                            <View style={styles.quoteItemRow}>
                                {/* Checkbox for multi-select mode */}
                                {isMultiSelectMode && (
                                    <View style={styles.checkbox}>
                                        <Checkbox
                                            status={isSelected ? 'checked' : 'unchecked'}
                                            onPress={() => toggleItemSelection(item.estimate_id)}
                                        />
                                    </View>
                                )}
                                
                                <View style={styles.quoteItemContent}>
                                    {/* Add back the name/ID with proper nesting */}
                                    <Text style={styles.quoteName}>
                                        <Text>{item.job_id ? '🔨 ' : '📝 '}</Text>
                                        {item.name ? (
                                            <Text>{item.name}</Text>
                                        ) : (
                                            <Text>Estimate #{item.estimate_id ? item.estimate_id.substring(0, 6) : 'Unknown'}</Text>
                                        )}
                                    </Text>
                                    
                                    {/* Add back the status information */}
                                    <Text style={styles.quoteStatus}>
                                        <Text>Status: </Text>
                                        <Text>{item.status || 'N/A'}</Text>
                                    </Text>
                                    
                                    {/* Add back the date with a simpler approach */}
                                    {item.created_at && (
                                        <Text style={styles.quoteDate}>
                                            <Text>Created: </Text>
                                            <Text>
                                                {(() => {
                                                    try {
                                                        return new Date(item.created_at).toLocaleDateString();
                                                    } catch (e) {
                                                        return 'Invalid date';
                                                    }
                                                })()}
                                            </Text>
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                );
            }}
            ListEmptyComponent={() => (
                // Only show loading indicator or empty text, header is already rendered by ListHeaderComponent
                <View style={styles.emptyContainer}>
                    {loadingQuotes ? (
                        <ActivityIndicator style={{ marginTop: 20 }} />
                    ) : (
                        <Text style={styles.emptyListText}>
                            <Text>No related jobs or estimates found.</Text>
                        </Text>
                    )}
                </View>
            )}
            // Removed commented-out prop
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // Remove padding from container, apply to header/items if needed
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Styles for header content (customer details)
    headerContentContainer: { // Container for header content padding
        paddingHorizontal: 15,
        paddingTop: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: 'gray',
        marginTop: 10,
    },
    value: {
        fontSize: 16,
        marginBottom: 10,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 15, // Reduced top margin
        marginBottom: 5, // Reduced bottom margin
        paddingHorizontal: 15, // Add padding to match content
    },
    relatedSectionHeader: { // Style for the header part containing the section title
        marginTop: 20, // Reduced top margin
        paddingTop: 15,
        // paddingHorizontal: 15, // Padding handled by headerContentContainer
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    legendText: {
        fontSize: 12,
        color: 'gray',
        marginBottom: 10,
    },
    // Styles for the related quotes list items
    quoteItemContainer: { // Add container for padding
        paddingHorizontal: 15, // Horizontal padding for list items
    },
    quoteItem: {
        backgroundColor: '#fff',
        padding: 15,
        marginBottom: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#eee',
    },
    quoteName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    quoteStatus: {
        fontSize: 14,
        color: 'gray',
        marginTop: 3,
    },
    quoteDate: {
        fontSize: 12,
        color: 'darkgray',
        marginTop: 3,
    },
    emptyContainer: {
        paddingHorizontal: 15,
        paddingTop: 10,
    },
    emptyListText: {
        textAlign: 'center',
        color: 'gray',
        marginTop: 20, // Increased margin
        paddingHorizontal: 15, // Add padding to empty text
        paddingBottom: 20, // Add bottom padding when empty
    },
    // Multi-select styles
    sectionTitleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    multiSelectControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10,
    },
    toggleLabel: {
        fontSize: 12,
        color: 'gray',
    },
    batchDeleteContainer: {
        marginTop: 10,
        marginBottom: 10,
    },
    // Item styles for multi-select
    selectedItem: {
        backgroundColor: '#e6f7ff', // Light blue background for selected items
        borderColor: '#1890ff', // Blue border for selected items
    },
    quoteItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        marginRight: 10,
    },
    quoteItemContent: {
        flex: 1,
    }
});

export default CustomerDetailScreen;
