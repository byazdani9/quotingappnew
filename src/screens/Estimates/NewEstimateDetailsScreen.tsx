import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  Button, 
  ScrollView, 
  SafeAreaView,
  TouchableOpacity
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { JobStackParamList } from '../../../App';
import { Picker } from '@react-native-picker/picker';

// Define the component props
type Props = NativeStackScreenProps<JobStackParamList, 'NewEstimateDetails'>;

// Template type definition
type JobTemplate = {
  id: string;
  name: string;
  description: string;
};

// Mock templates - to be replaced with data from backend later
const MOCK_TEMPLATES: JobTemplate[] = [
  { 
    id: 'residential', 
    name: 'Residential Project', 
    description: 'Standard template for residential construction projects'
  },
  { 
    id: 'commercial', 
    name: 'Commercial Project', 
    description: 'Standard template for commercial construction projects'
  },
  { 
    id: 'blank', 
    name: 'Blank Template', 
    description: 'Start with a blank estimate'
  },
];

const NewEstimateDetailsScreen: React.FC<Props> = ({ navigation }) => {
  // Add console logging for debugging
  console.log('Rendering NewEstimateDetailsScreen');
  
  const [jobTitle, setJobTitle] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState('blank');
  const [titleError, setTitleError] = useState('');

  // Get the selected template object
  const selectedTemplate = MOCK_TEMPLATES.find(t => t.id === selectedTemplateId);

  const handleContinue = () => {
    // Validate inputs
    if (!jobTitle.trim()) {
      setTitleError('Job title is required');
      return;
    }
    
    // For now, we'll just pass the data as navigation params
    // In a future implementation, we may want to save this to Supabase first
    navigation.navigate('EstimateBuilder', {
      jobTitle: jobTitle.trim(),
      templateId: selectedTemplateId,
      // Note: No estimateId yet, as we haven't saved to database
    });
  };

  const handleCancel = () => {
    // Go back to wherever the user came from (likely EstimatesScreen)
    navigation.goBack();
  };

  // Log when rendering happens for debugging
  console.log('About to render NewEstimateDetailsScreen UI');
  
  // Restore the original UI but keep console logs
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>New Estimate</Text>
        </View>
        
        <View style={styles.formContainer}>
          {/* Job Title Input */}
          <Text style={styles.label}>Job Title</Text>
          <TextInput
            style={[styles.input, titleError ? styles.inputError : null]}
            value={jobTitle}
            onChangeText={(text) => {
              setJobTitle(text);
              if (text.trim()) setTitleError(''); // Clear error if valid
            }}
            placeholder="Enter job title"
            autoCapitalize="words"
          />
          {titleError ? <Text style={styles.errorText}>{titleError}</Text> : null}
          
          {/* Template Selection */}
          <Text style={styles.label}>Select Template</Text>
          <View style={styles.pickerContainer}>
            {/* Render a simplified picker if there are rendering issues */}
            <Picker
              selectedValue={selectedTemplateId}
              onValueChange={(itemValue: string) => setSelectedTemplateId(itemValue)}
              style={styles.picker}
            >
              <Picker.Item label="Residential Project" value="residential" />
              <Picker.Item label="Commercial Project" value="commercial" />
              <Picker.Item label="Blank Template" value="blank" />
            </Picker>
          </View>
          
          {/* Template Description */}
          {selectedTemplate && (
            <View style={styles.templateDescription}>
              <Text style={styles.descriptionLabel}>Description:</Text>
              <Text style={styles.descriptionText}>{selectedTemplate.description}</Text>
            </View>
          )}
          
          {/* Info Text */}
          <Text style={styles.infoText}>
            You'll be able to select a customer after setting up the basic estimate details.
          </Text>
          
          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={handleCancel}
            >
              <Text style={[styles.buttonText, { color: '#000' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.continueButton, !jobTitle.trim() ? styles.disabledButton : null]} 
              onPress={handleContinue}
              disabled={!jobTitle.trim()}
            >
              <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginTop: -12,
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  templateDescription: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  descriptionLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
  },
  infoText: {
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    height: 50,
  },
  cancelButton: {
    backgroundColor: '#f2f2f2',
    marginRight: 8,
  },
  continueButton: {
    backgroundColor: '#007bff',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NewEstimateDetailsScreen;
