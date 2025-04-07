import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from 'react-native'; // Added TouchableOpacity
import { useNavigation } from '@react-navigation/native'; // Added useNavigation
import { NativeStackNavigationProp } from '@react-navigation/native-stack'; // Added for type safety
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed
import { JobStackParamList } from '../../../App'; // Import the stack param list
import { useTheme } from 'react-native-paper'; // Import useTheme

// Define type for related Customer data (adjust fields as needed)
type RelatedCustomer = {
  customer_id: string;
  first_name: string | null;
  last_name: string | null;
  address: string | null;
  city: string | null;
  // province: string | null; // Removed - Does not exist
  postal_code: string | null;
  // Add other customer fields if needed
} | null; // Allow customer to be null if customer_id is null

// Define a type for the job data including customer
type Job = {
  job_id: string; // uuid
  name: string | null; // Added
  number: string | null; // Added (Job number if exists)
  customer_id: string | null; // uuid, assuming it can be null
  status: string | null;
  amount: number | null; // Added
  // Add other relevant fields from your 'jobs' table
  customer: RelatedCustomer; // Correct type: single object or null, matching log
};

// Define the navigation prop type for this screen within the JobStack
type JobsScreenNavigationProp = NativeStackNavigationProp<
  JobStackParamList,
  'JobList' // This screen's route name in the stack
>;


const JobsScreen = () => {
  const theme = useTheme(); // Get theme object
  const navigation = useNavigation<JobsScreenNavigationProp>(); // Hook for navigation
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // console.log('>>> JobsScreen useEffect fired <<<'); // Remove log
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    let rawData = null; // Variable to hold data outside try/catch
    let fetchErrorObj = null; // Variable to hold error outside try/catch
    try {
      // Fetch jobs - adjust columns as needed
      // Add RLS filtering later if needed
      // Fetch job fields and related customer fields
      // Restore customer relation query
      const selectQuery = `
        job_id, 
        name, 
        number, 
        customer_id, 
        status, 
        amount, 
        customer:customers ( customer_id, first_name, last_name, address, city, postal_code )
      `;
      const { data, error } = await supabase
        .from('jobs')
        .select(selectQuery)
        .order('created_at', { ascending: false }); // Order by creation time
      
      fetchErrorObj = error; // Store error object
      rawData = data; // Store data object

      if (fetchErrorObj) {
        throw fetchErrorObj;
      }

    } catch (e: any) {
      setError(e.message || 'An unknown error occurred');
      Alert.alert('Error fetching jobs', e.message || 'An unknown error occurred'); 
    } finally {
      // Update state outside try/catch to ensure it happens regardless of errors inside try
      if (rawData && !fetchErrorObj) {
         // console.log('>>> Transforming and setting jobs state <<<'); // Remove log
         // Explicitly map rawData to ensure type correctness, especially for 'customer'
         const formattedJobs: Job[] = rawData.map((job: any) => ({
           job_id: job.job_id,
           name: job.name,
           number: job.number,
           customer_id: job.customer_id,
           status: job.status,
           amount: job.amount,
           // Ensure customer is treated as an object, even if Supabase types might infer array
           customer: job.customer as RelatedCustomer, 
         }));
         setJobs(formattedJobs);
      } else {
         // console.log('>>> Setting empty jobs state due to error or no data <<<'); // Remove log
         setJobs([]); // Set empty on error or no data
      }
      setLoading(false);
    }
  };

  const handleNavigateToDetail = (jobId: string) => {
    navigation.navigate('JobDetail', { jobId: jobId });
  };

  const handleAddNewJob = () => {
    // Navigate to JobDetail without a jobId to indicate creation
    // TODO: JobDetailScreen needs to handle the case where jobId is undefined
    navigation.navigate('JobDetail', {}); 
  };

  const renderItem = ({ item }: { item: Job }) => {
    // Access customer data directly as an object
    const customerData = item.customer; 
    const customerName = customerData ? `${customerData.first_name || ''} ${customerData.last_name || ''}`.trim() : 'No Customer';
    const customerAddress = customerData ? [customerData.address, customerData.city, customerData.postal_code].filter(Boolean).join(', ') : 'No Address';
    const jobIdentifier = item.name || `Job #${item.number || item.job_id.substring(0, 8)}`; // Use name, number, or partial ID
    const jobAmount = item.amount?.toLocaleString(undefined, { style: 'currency', currency: 'CAD' }) ?? '$0.00'; // Format as currency

    return (
      <TouchableOpacity onPress={() => handleNavigateToDetail(item.job_id)}>
        <View style={styles.itemContainer}>
          <View style={styles.itemRow}>
            {/* Left Column (Now Customer Info + Amount) */}
            <View style={styles.leftColumn}>
              <Text style={styles.customerNameLg}>{customerName}</Text> 
              <Text style={styles.customerAddressLg}>{customerAddress}</Text>
              <Text style={styles.jobAmountLg}>{jobAmount}</Text>
            </View>
            {/* Right Column (Now Project Name + Status) */}
            <View style={styles.rightColumn}>
              <Text style={styles.jobIdentifierSm}>{jobIdentifier}</Text> 
              <Text style={styles.jobStatusSm}>{item.status ?? 'N/A'}</Text>
            </View>
            {/* Arrow Icon Placeholder */}
            <Text style={styles.arrow}>{'>'}</Text> 
          </View>
        </View>
      </TouchableOpacity>
    );
  };

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={styles.title}>Jobs Dashboard</Text>
      <FlatList
        data={jobs}
        renderItem={renderItem}
        keyExtractor={(item) => item.job_id}
        ListEmptyComponent={<Text style={styles.emptyText}>No jobs found.</Text>}
        contentContainerStyle={{ paddingBottom: 60 }} // Avoid overlap with button
      />
      {/* Add New Job Button */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddNewJob}>
        <Text style={styles.addButtonText}>+ Add New Job</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    // backgroundColor applied inline
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
    // padding: 15, // Padding handled by rows/columns now
    borderBottomWidth: 1,
    borderBottomColor: '#eee', // Lighter border
  },
  itemRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 15,
    alignItems: 'center', // Align items vertically
  },
  leftColumn: {
    flex: 1, // Takes up half the space minus the arrow
    marginRight: 10,
  },
  rightColumn: {
    flex: 1, // Takes up half the space minus the arrow
    alignItems: 'flex-end', // Align text to the right
  },
  // --- Styles for New Layout ---
  customerNameLg: { // Style for Customer Name on Left
    fontSize: 16, // Larger
    fontWeight: 'bold', // Bold
    marginBottom: 4,
  },
  customerAddressLg: { // Style for Address on Left
    fontSize: 14, // Larger
    color: '#555',
    marginBottom: 4,
  },
   jobAmountLg: { // Style for Amount on Left
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
   jobIdentifierSm: { // Style for Project Name on Right
    fontSize: 13, // Smaller
    fontWeight: '500', // Medium weight
    marginBottom: 4,
    textAlign: 'right',
  },
   jobStatusSm: { // Style for Status on Right
    fontSize: 12, // Smaller
    color: '#888', // Lighter color
    textTransform: 'capitalize',
    textAlign: 'right',
  },
  // --- Original Styles (Keep for reference or remove if unused) ---
  jobIdentifier: { // Original style - keep if needed elsewhere or remove
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  jobStatus: { // Original style
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
    textTransform: 'capitalize', 
  },
  jobAmount: { // Original style
    fontSize: 14,
    color: '#333',
  },
  customerName: { // Original style
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 3,
  },
  customerAddress: { // Original style
    fontSize: 12,
    color: 'gray',
    textAlign: 'right',
  },
  arrow: {
    fontSize: 20,
    color: '#ccc',
    marginLeft: 10,
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
  },
  addButton: { // Reusing styles from EstimatesScreen - consider centralizing styles later
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

export default JobsScreen;
