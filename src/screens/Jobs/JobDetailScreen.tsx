import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Button } from 'react-native';
// TODO: Import navigation types if needed, e.g., for route params
// import { NativeStackScreenProps } from '@react-navigation/native-stack';
// import { JobsStackParamList } from '../../../App'; // Assuming a JobsStack is created

import { supabase } from '../../lib/supabaseClient';

// TODO: Define types for Job Details, Customer, Estimate Link etc.
type JobDetails = any; // Replace with actual type
type Customer = any; // Replace with actual type

// TODO: Define Props type using navigation types
// type Props = NativeStackScreenProps<JobsStackParamList, 'JobDetail'>;
type Props = { route: any; navigation: any }; // Basic placeholder

const JobDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  // TODO: Get job_id from route.params
  const jobId = route.params?.jobId; // Assuming jobId is passed as a param

  const [job, setJob] = useState<JobDetails | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [estimateId, setEstimateId] = useState<string | null>(null); // To store linked estimate ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setError('Job ID is missing.');
      setLoading(false);
      return;
    }

    const fetchJobDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch job details
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*') // Select all columns for now
          .eq('job_id', jobId)
          .single();

        if (jobError) throw jobError;
        if (!jobData) throw new Error('Job not found');

        setJob(jobData);
        // TODO: Extract estimate_id from jobData (assuming 'quote_id' or 'original_estimate_id')
        setEstimateId(jobData.quote_id || jobData.original_estimate_id || null);

        // Fetch customer details if customer_id exists
        if (jobData.customer_id) {
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('*') // Select all for now
            .eq('customer_id', jobData.customer_id)
            .single();
          if (customerError) throw customerError; // Handle error appropriately
          setCustomer(customerData);
        }

      } catch (e: any) {
        setError(e.message);
        Alert.alert('Error loading job details', e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  const handleNavigateToEstimate = () => {
    if (estimateId) {
      // TODO: Ensure navigation prop is correctly typed and EstimateBuilder exists in the target stack
      navigation.navigate('EstimateBuilder', { estimateId: estimateId });
    } else {
      Alert.alert('No Estimate Found', 'This job does not have an associated estimate.');
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>Error: {error}</Text></View>;
  }

  if (!job) {
     // This case might be covered by the error state if fetch fails
     return <View style={styles.centered}><Text>Job not found.</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Job Detail</Text>
      <Text>Job ID: {job.job_id}</Text>
      <Text>Job Name: {job.name ?? 'N/A'}</Text>
      <Text>Status: {job.status ?? 'N/A'}</Text>
      <Text>Customer: {customer ? `${customer.first_name} ${customer.last_name}` : 'N/A'}</Text>
      <Text>Address: {job.address ?? 'N/A'}</Text>
      
      {/* TODO: Add layout similar to screenshot 3 */}
      
      <View style={styles.actionsSection}>
         {/* Example button to navigate to estimate */}
         <Button 
            title={`Estimate (${estimateId ? 'View' : 'N/A'})`} 
            onPress={handleNavigateToEstimate} 
            disabled={!estimateId} 
         />
         {/* TODO: Add other action buttons/rows (Change Orders, Credits, etc.) */}
      </View>

      {/* TODO: Add Make Inactive button */}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  errorText: {
    color: 'red',
    fontSize: 16,
  },
  actionsSection: {
      marginTop: 20,
      borderTopWidth: 1,
      borderTopColor: '#ccc',
      paddingTop: 15,
  }
  // TODO: Add more styles based on screenshot 3 layout
});

export default JobDetailScreen;
