import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { supabase } from '../../lib/supabaseClient'; // Import the Supabase client
import { NativeStackScreenProps } from '@react-navigation/native-stack'; // Import navigation types
import { AuthStackParamList } from '../../../App'; // Import stack param list type (adjust path if needed)

// Define screen props type
type SignUpScreenProps = NativeStackScreenProps<AuthStackParamList, 'SignUp'>;

const SignUpScreen = ({ navigation }: SignUpScreenProps) => { // Destructure navigation prop
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          // Set default role or other metadata here if needed during signup
          // user_role: 'sales_rep' // Example: Assign role on signup
        },
      },
    });

    if (error) {
      Alert.alert('Sign Up Error', error.message);
    } else if (!data.session && data.user) {
      // Check if email confirmation is required in your Supabase settings
      Alert.alert('Success', 'Please check your email for verification link!');
    }
    // On successful signup and login (if email confirmation is off or auto-confirmed),
    // Supabase client handles the session. Navigation handled by auth state listener.
    setLoading(false);
    setLoading(false);
  };

  const handleLogin = () => {
    navigation.navigate('Login'); // Navigate to the Login screen
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}>
        <Text style={styles.title}>Sign Up</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password" 
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
        />
        <View style={styles.buttonContainer}>
          <Button title="Sign Up" onPress={handleSignUp} disabled={loading} />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Already have an account? Login"
            onPress={handleLogin}
            disabled={loading}
            color="#888" // Optional: different color for secondary action
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    marginTop: 10,
  },
});

export default SignUpScreen;
