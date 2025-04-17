import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native'; // Import Alert
import { TextInput, Button, Text } from 'react-native-paper';

interface JobSetupFormProps {
  onCancel: () => void;
  onSubmit: (title: string, templateId?: string | null) => void; // templateId is optional for now
  initialTitle?: string; // Optional initial value for editing
  initialTemplateId?: string | null; // Optional initial value for editing
  submitButtonText?: string; // Optional text for the submit button (e.g., "Save")
}

/**
 * Form content for the New Job Setup or Edit Job modal.
 * Collects Job Title and (placeholder) Template selection.
 *
 * @param {function} onCancel Callback function when the cancel button is pressed.
 * @param {function} onSubmit Callback function when the submit button is pressed, passing title and templateId.
 * @param {string} [initialTitle] Optional initial title for editing.
 * @param {string|null} [initialTemplateId] Optional initial template ID for editing.
 * @param {string} [submitButtonText='Next'] Optional text for the submit button.
 */
const JobSetupForm: React.FC<JobSetupFormProps> = ({ 
  onCancel, 
  onSubmit, 
  initialTitle = '', 
  initialTemplateId = null,
  submitButtonText = 'Next' 
}) => {
  const [jobTitle, setJobTitle] = useState(initialTitle); // Use initial value
  const [templateId, setTemplateId] = useState<string | null>(initialTemplateId); // Use initial value

  const handleSubmit = () => { // Renamed from handleNext
    // Basic validation: ensure title is not empty
    if (jobTitle.trim()) {
      onSubmit(jobTitle.trim(), templateId);
    } else {
      // Use React Native Alert
      Alert.alert('Missing Title', 'Please enter a Job Title.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Job Title"
        value={jobTitle}
        onChangeText={setJobTitle}
        mode="outlined"
        style={styles.input}
      />

      {/* Placeholder for Template Selection */}
      <View style={styles.templateSection}>
        <Text style={styles.templateLabel}>Template:</Text>
        {/* Replace with Dropdown or Button later */}
        <Button
          mode="outlined"
          onPress={() => Alert.alert('Not Implemented', 'Template selection not implemented yet.')} // Use React Native Alert
          style={styles.templateButton}
        >
          {templateId ? `Selected: ${templateId}` : 'Select Template (Optional)'}
        </Button>
      </View>

      <View style={styles.buttonRow}>
        <Button mode="outlined" onPress={onCancel} style={styles.button}>
          Cancel
        </Button>
        <Button mode="contained" onPress={handleSubmit} style={styles.button}>
          {submitButtonText} 
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Add padding or styles if needed within the modal card
  },
  input: {
    marginBottom: 15,
  },
  templateSection: {
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  templateLabel: {
    fontSize: 16,
    marginRight: 10,
  },
  templateButton: {
    flexShrink: 1, // Allow button to shrink if needed
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Align buttons to the right
    marginTop: 10,
  },
  button: {
    marginLeft: 10, // Add space between buttons
  },
});

export default JobSetupForm;
