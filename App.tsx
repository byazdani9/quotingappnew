import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, Text, View } from 'react-native'; // Removed Button import
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Import GestureHandlerRootView
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer'; // Import Drawer Navigator
import { Session } from '@supabase/supabase-js';

import { supabase } from './src/lib/supabaseClient';
import LoginScreen from './src/screens/Auth/LoginScreen';
import SignUpScreen from './src/screens/Auth/SignUpScreen';
// Import Main App Screens
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';
import EstimatesScreen from './src/screens/Estimates/EstimatesScreen'; // Keep for EstimateStackNav if needed elsewhere
import EstimateBuilderScreen from './src/screens/Estimates/EstimateBuilderScreen'; // Import Builder
import JobsScreen from './src/screens/Jobs/JobsScreen';
import JobDetailScreen from './src/screens/Jobs/JobDetailScreen'; // Import Job Detail
import CostbooksScreen from './src/screens/Costbooks/CostbooksScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import CustomersScreen from './src/screens/Customers/CustomersScreen'; // Import CustomersScreen


// Define types for the navigation stack parameters
export type AuthStackParamList = {
  Login: undefined; // No params expected for Login route
  SignUp: undefined;
};

// Define types for the nested Estimate Stack
export type EstimateStackParamList = {
  EstimateList: undefined; // Route for EstimatesScreen
  EstimateBuilder: { estimateId?: string }; // Route for EstimateBuilderScreen, optional ID for editing
};

// Define types for the nested Job Stack
export type JobStackParamList = {
  JobList: undefined; // Route for JobsScreen
  JobDetail: { jobId?: string }; // Route for JobDetailScreen, make jobId optional for creation
  // EstimateBuilder might be navigated to from JobDetail, but defined elsewhere
};


// Define types for the Drawer navigator parameters
// Add EstimateBuilder here for the hidden screen
export type AppDrawerParamList = {
  Dashboard: undefined;
  // Estimates: undefined; // Removed from drawer
  Jobs: undefined; // This will point to the JobStack
  Costbooks: undefined;
  Customers: undefined; // Add Customers to drawer params
  Settings: undefined;
  EstimateBuilder: { estimateId?: string }; // Add EstimateBuilder route key
  // Add other main app screens here
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const EstimateStackNav = createNativeStackNavigator<EstimateStackParamList>(); // Uncomment - Still needed by EstimateStackNavigator
const JobStackNav = createNativeStackNavigator<JobStackParamList>(); // Job Stack Navigator
const Drawer = createDrawerNavigator<AppDrawerParamList>(); // Create Drawer Navigator instance

// Stack Navigator for Estimate related screens (Might still be needed if navigated to from elsewhere)
// Keep this definition for now, but it's not directly in the drawer
function EstimateStackNavigator() {
  return (
    <EstimateStackNav.Navigator screenOptions={{ headerShown: false }}>
      {/* Set headerShown to true if you want a header for the stack */}
      <EstimateStackNav.Screen name="EstimateList" component={EstimatesScreen} />
      <EstimateStackNav.Screen name="EstimateBuilder" component={EstimateBuilderScreen} />
    </EstimateStackNav.Navigator>
  );
}

// Stack Navigator for Job related screens
function JobStackNavigator() {
  return (
    <JobStackNav.Navigator screenOptions={{ headerShown: false }}>
       <JobStackNav.Screen name="JobList" component={JobsScreen} />
       <JobStackNav.Screen name="JobDetail" component={JobDetailScreen} />
       {/* We navigate to EstimateBuilder from JobDetail, but define EstimateBuilder screen at Drawer level */}
    </JobStackNav.Navigator>
  );
}


// Main App component using Drawer Navigator
function MainAppDrawer() {
  return (
    <Drawer.Navigator initialRouteName="Dashboard">
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      {/* Estimates screen removed from drawer - accessed via Jobs */}
      <Drawer.Screen name="Jobs">
         {() => <JobStackNavigator />}
      </Drawer.Screen>
      <Drawer.Screen name="Customers" component={CustomersScreen} />
      <Drawer.Screen name="Costbooks" component={CostbooksScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      {/* Add EstimateBuilder here so it can be navigated to from JobDetail */}
      {/* It won't appear in the drawer UI, but is part of the navigator */}
       <Drawer.Screen 
         name="EstimateBuilder" 
         component={EstimateBuilderScreen} 
         options={{ drawerItemStyle: { height: 0 } }} // Hide from drawer list visually
       />
      {/* Add other screens to the drawer */}
    </Drawer.Navigator>
  );
}


function App(): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check initial session state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth state changes (login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // No need to setLoading(false) here as initial load is handled above
    });

    // Cleanup subscription on unmount
    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    // Optional: Render a loading indicator while checking session
    return (
      <SafeAreaView>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <StatusBar barStyle={'dark-content'} />
        {session && session.user ? (
        // User is logged in - Show main app Drawer Navigator
        <MainAppDrawer />
      ) : (
        // User is not logged in - Show authentication stack
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen
            name="Login"
            component={LoginScreen}
            // options={{ headerShown: false }} // Moved to screenOptions
          />
          <AuthStack.Screen
            name="SignUp"
            component={SignUpScreen}
            // options={{ headerShown: false }} // Moved to screenOptions
          />
        </AuthStack.Navigator>
        )}
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

// Removed redundant Button import


export default App;
