// Polyfill moved to index.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env'; // Import from react-native-dotenv

// Basic check to ensure variables are loaded (can add more robust error handling)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'ERROR: Supabase URL or Anon Key is missing. Check your .env file and babel config.',
  );
  // You might want to throw an error or handle this more gracefully
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage, // Use AsyncStorage for session persistence in React Native
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native, disable URL session detection
  },
});
