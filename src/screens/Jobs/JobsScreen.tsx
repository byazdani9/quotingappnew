import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../lib/supabaseClient'; // Adjust path if needed

// Define a type for the job data we expect
// Adjust based on the actual columns you need from the 'jobs' table
type Job = {
  job_id: string; // uuid
  // job_number: string; // Removed - Assuming column does not exist based on user feedback
  customer_id: string | null; // uuid, assuming it can be null
  status: string | null;
  date_created: string | null; // timestamptz
  // Add other relevant fields from your 'jobs' table
};

const JobsScreen = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch jobs - adjust columns as needed
      // Add RLS filtering later if needed
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select('job_id, customer_id, status, date_created') // Select specific columns - removed job_number
        .order('date_created', { ascending: false }); // Example order

      if (fetchError) {
        throw fetchError;
      }

      if (data) {
        setJobs(data as Job[]); // Cast data to our Job type
      }
    } catch (e: any) {
      setError(e.message);
      Alert.alert('Error fetching jobs', e.message);
    } finally {
      setLoading(false);
    }
  };

const renderItem = ({ item }: { item: Job }) => (
    <View style={styles.itemContainer}>
      {/* <Text style={styles.itemText}>Number: {item.job_number}</Text> // Removed - Assuming column does not exist */}
      <Text style={styles.itemText}>ID: {item.job_id}</Text> {/* Displaying ID for now */}
      <Text style={styles.itemText}>Status: {item.status ?? 'N/A'}</Text>
      {/* Ideally fetch and display customer name based on customer_id */}
      <Text style={styles.itemText}>Customer ID: {item.customer_id ?? 'N/A'}</Text>
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
      <Text style={styles.title}>Jobs Dashboard</Text>
      <FlatList
        data={jobs}
        renderItem={renderItem}
        keyExtractor={(item) => item.job_id}
        ListEmptyComponent={<Text style={styles.emptyText}>No jobs found.</Text>}
      />
      {/* TODO: Add '+' button for new job */}
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

export default JobsScreen;
