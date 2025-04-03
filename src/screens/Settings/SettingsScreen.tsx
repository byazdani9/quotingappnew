import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { supabase } from '../../lib/supabaseClient'; // Import Supabase client for sign out

const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings Screen</Text>
      {/* TODO: Implement Settings UI */}
      <View style={{ marginTop: 20 }}>
         <Button title="Sign Out" onPress={() => supabase.auth.signOut()} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
