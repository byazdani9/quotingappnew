import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
// Assuming it will be part of JobStackParamList, adjust if needed
// import { JobStackParamList } from '../../../App'; 

// Placeholder type for route params
type ChangeOrdersScreenProps = {
    route: { params?: { jobId?: string } };
    navigation: any;
};
// type Props = NativeStackScreenProps<JobStackParamList, 'ChangeOrders'>; // Use this when stack is updated

const ChangeOrdersScreen: React.FC<ChangeOrdersScreenProps> = ({ route }) => {
  const jobId = route.params?.jobId;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Change Orders</Text>
      <Text>Job ID: {jobId ?? 'N/A'}</Text>
      {/* TODO: Implement Change Order list UI and functionality */}
      <Text style={{ marginTop: 20 }}>(Change Order List Placeholder)</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
});

export default ChangeOrdersScreen;
