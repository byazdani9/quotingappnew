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
type LoginScreenProps = NativeStackScreenProps<AuthStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: LoginScreenProps) => { // Destructure navigation prop
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Login Error', error.message);
    }
    // On successful login, Supabase client handles the session.
    // Navigation to the main app should be handled by a listener checking auth state,
    // typically in your main App component or navigation setup.
    setLoading(false);
    setLoading(false);
  };

  const handleSignUp = () => {
    navigation.navigate('SignUp'); // Navigate to the SignUp screen
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}>
        <Text style={styles.title}>Login</Text>
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
        <View style={styles.buttonContainer}>
          <Button title="Login" onPress={handleLogin} disabled={loading} />
        </View>
        <View style={styles.buttonContainer}>
          <Button
            title="Don't have an account? Sign Up"
            onPress={handleSignUp}
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

export default LoginScreen;
