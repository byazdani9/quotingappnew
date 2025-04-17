import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from 'react-native-paper'; // Import useTheme
// Import supabase client
import { supabase } from '../../lib/supabaseClient'; 

// Placeholder data structure
type JobStatusSummary = {
  status: string;
  count: number;
  amount: number;
};

const DashboardScreen = () => {
  const theme = useTheme(); // Get theme object
  // TODO: Replace with state for fetched data
  const [summaryData, setSummaryData] = useState<JobStatusSummary[]>([
    { status: 'Leads', count: 0, amount: 0 },
    { status: 'Contract Signed', count: 0, amount: 0 },
    { status: 'Work Started', count: 0, amount: 0 },
    { status: 'Work Completed', count: 0, amount: 0 },
    { status: 'Closed', count: 0, amount: 0 },
  ]);
  const [loading, setLoading] = useState(true); // Start loading on mount
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from Supabase
  useEffect(() => {
    const fetchSummary = async () => {
      // setLoading(true); // Already set to true initially
      setError(null);
      try {
        // Call the simplified V1 Supabase function
        const { data, error: rpcError } = await supabase.rpc('get_dashboard_summary_v1');

        if (rpcError) throw rpcError;

        // Ensure data is an array before setting state
        if (Array.isArray(data)) {
           // TODO: Might need to map/transform data if function returns different structure
           setSummaryData(data as JobStatusSummary[]); 
        } else {
           console.warn('Received unexpected data format from get_job_status_summary:', data);
           setSummaryData([]); // Set to empty array if format is wrong
        }

      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []); // Empty dependency array means run once on mount

  return (
    <ScrollView style={[styles.scrollView, { backgroundColor: theme.colors.background }]}>
      {/* Logo */}
      <Image 
        source={require('../../assets/images/logo.png')} 
        style={styles.logo}
        resizeMode="contain" 
      />

      <View style={styles.container}>
        {/* Job Status Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Status</Text>
          <View style={styles.summaryHeader}>
            <Text style={[styles.summaryHeaderText, styles.statusCol]}>Status</Text>
            <Text style={[styles.summaryHeaderText, styles.countCol]}>Jobs</Text>
            <Text style={[styles.summaryHeaderText, styles.amountCol]}>Amount</Text>
          </View>
          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : error ? (
            <Text style={styles.errorText}>Error loading summary: {error}</Text>
          ) : (
            summaryData.map((item) => (
              <View key={item.status} style={styles.summaryRow}>
                <Text style={[styles.summaryCell, styles.statusCol]}>{item.status}</Text>
                <Text style={[styles.summaryCell, styles.countCol]}>{item.count}</Text>
                <Text style={[styles.summaryCell, styles.amountCol]}>${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
              </View>
            ))
          )}
        </View>

        {/* Chart Placeholder - REMOVED */}

        {/* Calendar Placeholder */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Schedule</Text>
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>[Google Calendar Placeholder]</Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}; // End of DashboardScreen component

// Styles should be defined outside the component
const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    // backgroundColor applied inline using theme
  },
  container: {
    flex: 1,
    padding: 15,
  },
  logo: {
    height: 40, // 50% of original, larger than tiny version
    alignSelf: 'center', // Align logo to the left
    marginTop: 10, // Add some top margin
    marginBottom: 10, // Add back smaller bottom margin
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  summaryHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 5,
    marginBottom: 5,
  },
  summaryHeaderText: {
    fontWeight: 'bold',
    color: '#555',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  summaryCell: {
    fontSize: 14,
  },
  statusCol: {
    flex: 3, // Adjust flex ratio as needed
  },
  countCol: {
    flex: 1,
    textAlign: 'right',
    paddingHorizontal: 10,
  },
  amountCol: {
    flex: 2,
    textAlign: 'right',
  },
  placeholderBox: {
    height: 150, // Adjust as needed
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  placeholderText: {
    color: '#888',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  }
});

export default DashboardScreen;
