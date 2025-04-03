import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import LoginScreen from './LoginScreen'; // Adjust the import path if necessary
import { supabase } from '../../lib/supabaseClient'; // Import the mocked client

// Mock AsyncStorage (required by Supabase client in React Native)
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock the supabase client module
jest.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      // Add other methods used by LoginScreen if needed, e.g., signUp, signOut
    },
    // Mock other Supabase features if LoginScreen uses them (e.g., from())
    // from: jest.fn(() => ({
    //   select: jest.fn(),
    //   insert: jest.fn(),
    //   update: jest.fn(),
    //   delete: jest.fn(),
    // })),
  },
}));

// Mock react-native-dotenv
// If LoginScreen directly imports from '@env', mock it here.
// Otherwise, the mock in supabaseClient.ts might be sufficient.
// jest.mock('@env', () => ({
//   SUPABASE_URL: 'mock_url',
//   SUPABASE_ANON_KEY: 'mock_key',
// }));

// Mock navigation if LoginScreen uses it
// Example using a simple mock navigator
const mockNavigation = {
  navigate: jest.fn(),
  // Add other navigation methods used by LoginScreen if needed
};

describe('LoginScreen', () => {
  it('renders email, password inputs and login button', () => {
    // Define a basic mock route object
    const mockRoute = { params: {} }; // Add necessary params if LoginScreen uses them

    // Render the component, passing mock navigation and route
    render(<LoginScreen navigation={mockNavigation as any} route={mockRoute as any} />); // Use 'as any' for simplicity or create proper mock types

    // Check for email input (using placeholder text)
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();

    // Check for password input (using placeholder text)
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();

    // Check for login button (using role and name)
    expect(screen.getByRole('button', { name: /Login/i })).toBeTruthy();
  });

  // Add more tests later:
  // - Test successful login attempt (mock API success)
  // - Test failed login attempt (mock API error)
  // - Test input validation (if any)
});

  // Mark the test function as async
  it('calls Supabase auth on login button press with correct credentials', async () => {
    // Mock the signInWithPassword function to return a resolved promise with a success object
    (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({ error: null });

    const mockRoute = { params: {} };
    render(<LoginScreen navigation={mockNavigation as any} route={mockRoute as any} />);

    const emailInput = screen.getByPlaceholderText('Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginButton = screen.getByRole('button', { name: /Login/i }); // Find button by role and name

    const testEmail = 'test@example.com';
    const testPassword = 'password123';

    // Simulate typing email and password (use await with fireEvent)
    await fireEvent.changeText(emailInput, testEmail);
    await fireEvent.changeText(passwordInput, testPassword);

    // Simulate pressing the login button (use await with fireEvent)
    await fireEvent.press(loginButton);

    // Check if the mocked Supabase function was called correctly
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledTimes(1);
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: testEmail,
      password: testPassword,
    });
  });
