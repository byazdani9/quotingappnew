import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { JobStackParamList } from '../../../App'; // Import correct param list
import { supabase } from '../../lib/supabaseClient';
import { List, Card, Text, Button, Divider, Subheading, ActivityIndicator as PaperActivityIndicator, useTheme } from 'react-native-paper'; // Import Paper components

// Define specific types based on known DB columns and UI needs
type JobDetailsType = {
  job_id: string;
  name: string | null;
  number: string | null;
  status: string | null;
  customer_id: string | null;
  address: string | null; // Job site address
  city: string | null;
  postal_code: string | null;
  quote_id: string | null; // Link to estimate/quote
  original_estimate_id: string | null; // Alternative link
  amount: number | null; // Job amount/total
  // Add other relevant job fields as needed
};

type CustomerType = {
  customer_id: string;
  first_name: string | null;
  last_name: string | null;
  address: string | null; // Customer address
  city: string | null;
  postal_code: string | null;
  // Add other relevant customer fields
} | null;

// Define Props type using navigation types
type Props = NativeStackScreenProps<JobStackParamList, 'JobDetail'>;

const JobDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const jobId = route.params?.jobId; // Get optional jobId
  const theme = useTheme(); // Access theme for styling

  const [job, setJob] = useState<JobDetailsType | null>(null);
  const [customer, setCustomer] = useState<CustomerType | null>(null);
  const [estimateId, setEstimateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle create mode (no jobId)
    if (!jobId) {
      // TODO: Implement UI for creating a new job
      setError('Job creation UI not implemented yet.'); 
      setLoading(false);
      return;
    }

    // Fetch details if jobId exists (view/edit mode)
    const fetchJobDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch job details
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*') // Fetch all job columns for now
          .eq('job_id', jobId)
          .single();

        if (jobError) throw jobError;
        if (!jobData) throw new Error('Job not found');

        setJob(jobData as JobDetailsType); // Cast to specific type
        setEstimateId(jobData.quote_id || jobData.original_estimate_id || null);

        // Fetch customer details if customer_id exists
        if (jobData.customer_id) {
          const { data: customerData, error: customerError } = await supabase
            .from('customers')
            .select('customer_id, first_name, last_name, address, city, postal_code') // Select specific customer columns
            .eq('customer_id', jobData.customer_id)
            .single();
          if (customerError) {
             console.warn("Error fetching customer:", customerError.message); // Log warning instead of throwing
             setCustomer(null);
          } else {
             setCustomer(customerData as CustomerType);
          }
        } else {
            setCustomer(null); // No customer linked
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
      // Use 'as any' for cross-stack navigation type workaround
      navigation.navigate('EstimateBuilder' as any, { estimateId: estimateId }); 
    } else {
      Alert.alert('No Estimate Found', 'This job does not have an associated estimate.');
    }
  };

  // --- Render Logic ---

  if (loading) {
    return <View style={styles.centered}><PaperActivityIndicator animating={true} size="large" /></View>;
  }

  if (error) {
    // Display error, including the "Job creation UI not implemented" message
    return <View style={styles.centered}><Text style={[styles.errorText, { color: theme.colors.error }]}>Error: {error}</Text></View>;
  }

  if (!job && jobId) { 
     // Show "Job not found" only if we were trying to load one
     return <View style={styles.centered}><Text>Job not found.</Text></View>;
  }
  
  // If !jobId (create mode), we might render a different form component entirely
  // Or adapt this component. For now, let's assume we only render details if job exists.
  if (!job) {
      // This case handles when !jobId and loading/error are false
      // We should ideally show a "New Job" form here
      return <View style={styles.centered}><Text>Ready to create new job...</Text></View>; // Placeholder
  }


  // Format data for display (only if job exists)
  const jobIdentifier = job.name || `Job #${job.number || jobId?.substring(0, 8)}`;
  const jobStatus = job.status ?? 'N/A';
  const customerName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'N/A';
  const customerAddress = customer ? [customer.address, customer.city, customer.postal_code].filter(Boolean).join(', ') : 'N/A';
  const jobSiteAddress = job ? [job.address, job.city, job.postal_code].filter(Boolean).join(', ') : 'N/A';
  const estimateTotalString = job.amount?.toLocaleString(undefined, { style: 'currency', currency: 'CAD' }) ?? 'N/A'; // Assuming job.amount holds estimate total for now

  // Placeholder data for actions list - using List.Item from Paper
  const actions = [
      { key: 'job_info', title: 'Job Info', icon: 'information-outline', onPress: () => Alert.alert("TODO", "Navigate to Job Info Screen") }, // Example placeholder onPress
      { key: 'estimate', title: 'Estimate', description: estimateTotalString, onPress: handleNavigateToEstimate, disabled: !estimateId, icon: 'file-document-outline' },
      { key: 'change_orders', title: 'Change Orders', description: 'None', icon: 'file-sync-outline', onPress: () => navigation.navigate('ChangeOrders', { jobId: jobId! }) }, // Navigate to Change Orders
      { key: 'credits', title: 'Credits', description: 'None', icon: 'credit-card-minus-outline' },
      { key: 'job_total', title: 'Job Total', description: estimateTotalString, icon: 'calculator' }, // Placeholder
      { key: 'product_pricing', title: 'Product Pricing', description: 'None', icon: 'tag-outline' },
      { key: 'purchase_orders', title: 'Purchase Orders', description: 'None', icon: 'cart-outline' },
      { key: 'draw_schedule', title: 'Draw Schedule', icon: 'calendar-check-outline' },
      { key: 'invoices', title: 'Invoices', description: '$0.00', icon: 'receipt' }, // Placeholder
      { key: 'payments', title: 'Payments', description: 'None', icon: 'cash-multiple' },
      { key: 'job_reports', title: 'Job Reports', icon: 'chart-bar' },
      { key: 'export_job_data', title: 'Export Job Data', icon: 'export-variant' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        {/* Header Section (Placeholder - Actual header is part of Stack Navigator) */}
        {/* <Appbar.Header><Appbar.BackAction onPress={() => navigation.goBack()} /><Appbar.Content title="Job" /></Appbar.Header> */}

        <View style={styles.mainContent}>
            {/* Left Column */}
            <View style={styles.leftColumn}>
                {/* Job Info Block */}
                <Card style={styles.card} elevation={0}>
                    <Card.Content>
                        <Text style={[styles.jobIdentifier, { color: theme.colors.onSurface }]}>{jobIdentifier}</Text>
                        <Text style={[styles.jobStatus, { color: theme.colors.onSurfaceVariant }]}>{jobStatus}</Text>
                    </Card.Content>
                </Card>

                {/* Customer Block */}
                <Card style={styles.card} elevation={0}>
                    <Card.Title title="CUSTOMER" titleStyle={[styles.blockHeader, { color: theme.colors.onSurfaceVariant }]} />
                    <Card.Content>
                        <Text style={[styles.customerName, { color: theme.colors.onSurface }]}>{customerName}</Text>
                        <Text style={[styles.customerAddress, { color: theme.colors.onSurfaceVariant }]}>{customerAddress}</Text>
                        {/* TODO: Add Edit/Contacts buttons */}
                    </Card.Content>
                </Card>

                {/* Job Site Block */}
                <Card style={styles.card} elevation={0}>
                     <Card.Title title="JOB SITE" titleStyle={[styles.blockHeader, { color: theme.colors.onSurfaceVariant }]} />
                     <Card.Content>
                        <Text style={[styles.jobSiteAddress, { color: theme.colors.onSurfaceVariant }]}>{jobSiteAddress}</Text>
                        {/* TODO: Add '+' button */}
                     </Card.Content>
                </Card>
            </View>

            {/* Right Column (Actions List) */}
            <View style={styles.rightColumn}>
                <List.Section>
                    {actions.map((action, index) => (
                        <React.Fragment key={action.key}>
                            <List.Item
                                title={action.title} 
                                description={action.description}
                                left={props => action.icon ? <List.Icon {...props} icon={action.icon} /> : null}
                                right={props => (action.onPress && !action.disabled) ? <List.Icon {...props} icon="chevron-right" /> : null}
                                onPress={action.onPress}
                                disabled={!action.onPress || action.disabled}
                                titleStyle={[styles.actionLabel, { color: theme.colors.primary }, (!action.onPress || action.disabled) && styles.disabledText]}
                                descriptionStyle={[styles.actionValue, { color: theme.colors.onSurfaceVariant }, (!action.onPress || action.disabled) && styles.disabledText]}
                                style={styles.listItem}
                            />
                            {index < actions.length - 1 && <Divider style={{ backgroundColor: theme.colors.outline }} />}
                        </React.Fragment>
                    ))}
                </List.Section>
            </View>
        </View>

        {/* Footer Button */}
        <View style={styles.footer}>
            <Button 
                mode="contained" 
                onPress={() => Alert.alert('TODO', 'Implement Make Inactive')} 
                color={theme.colors.error} // Use theme color for error/red
                // style={{ elevation: 0 }} // Remove elevation style - This was removed in previous step
            >
                Make Inactive
            </Button>
        </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor applied inline using theme
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    // color: 'red', // Use theme color below
    fontSize: 16,
    textAlign: 'center',
  },
  mainContent: {
    flexDirection: 'row', // Arrange left and right columns side-by-side
    padding: 15,
  },
  leftColumn: {
    flex: 1, // Adjust flex ratio as needed
    marginRight: 15,
  },
  rightColumn: {
    flex: 1, // Adjust flex ratio as needed
    // Removed border, Paper components might provide visual separation
    // borderLeftWidth: 1,
    // borderLeftColor: '#eee',
    // paddingLeft: 15,
  },
  card: {
      marginBottom: 15,
      elevation: 0, // Remove shadow
      // Add border for separation
      borderWidth: 1, 
      borderColor: '#ddd', // Make border slightly darker
  },
  infoBlock: { // Kept for potential future use if Cards are removed
    marginBottom: 20,
  },
  blockHeader: { // Style for Card.Title
    fontSize: 12,
    marginBottom: 0, 
    paddingBottom: 0,
    fontWeight: 'bold',
    // Apply color inline
  },
  jobIdentifier: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    // Apply color inline
  },
  jobStatus: {
    fontSize: 14,
    textTransform: 'capitalize',
    // Apply color inline
  },
  customerName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 3,
  },
  customerAddress: {
    fontSize: 14,
    // Apply color inline
  },
  jobSiteAddress: {
     fontSize: 14,
     // Apply color inline
  },
  listItem: {
      paddingHorizontal: 0, // Remove default padding if using List.Section padding
  },
  actionLabel: {
    fontSize: 15,
    // Apply color inline
  },
  actionValue: {
    fontSize: 14,
    // Apply color inline
  },
  disabledText: {
      opacity: 0.5, // Standard way to show disabled
      // Apply color inline
  },
  footer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee', // Keep static border color for now
    marginTop: 10, 
    marginBottom: 10,
  }
});

export default JobDetailScreen;
