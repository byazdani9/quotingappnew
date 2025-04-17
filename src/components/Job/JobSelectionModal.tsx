import React, { useState, useEffect } from 'react';
import { Modal, View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { supabase } from '../../lib/supabaseClient';

type Job = {
  job_id: string;
  name: string | null;
  number: string | null;
  status: string | null;
};

type JobSelectionModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (job: Job) => void;
};

const JobSelectionModal: React.FC<JobSelectionModalProps> = ({ visible, onClose, onSelect }) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    supabase
      .from('jobs')
      .select('job_id, name, number, status')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setJobs(data as Job[]);
        setLoading(false);
      });
  }, [visible]);

  const filteredJobs = jobs.filter(job => {
    const term = searchTerm.toLowerCase();
    return (
      (job.name || '').toLowerCase().includes(term) ||
      (job.number || '').toLowerCase().includes(term)
    );
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Select Job</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search jobs..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            autoFocus
          />
          {loading ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
          ) : (
            <FlatList
              data={filteredJobs}
              keyExtractor={item => item.job_id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.item} onPress={() => onSelect(item)}>
                  <Text style={styles.itemText}>
                    {item.name || 'Untitled'} {item.number ? `(#${item.number})` : ''}
                  </Text>
                  <Text style={styles.statusText}>{item.status || ''}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No jobs found.</Text>}
              style={{ maxHeight: 300 }}
            />
          )}
          <Button title="Close" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center'
  },
  modal: {
    width: '90%', backgroundColor: '#fff', borderRadius: 10, padding: 20, alignItems: 'stretch'
  },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  searchInput: {
    height: 40, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, marginBottom: 10
  },
  item: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  itemText: { fontSize: 16 },
  statusText: { fontSize: 12, color: '#888' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 20 }
});

export default JobSelectionModal;
