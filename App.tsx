import React, { useState, useEffect } from 'react';
import { SafeAreaView, StatusBar, Text, View } from 'react-native'; // Removed Button import
import { GestureHandlerRootView } from 'react-native-gesture-handler'; // Import GestureHandlerRootView
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer'; // Import Drawer Navigator
import { Session } from '@supabase/supabase-js';
import { Provider as PaperProvider } from 'react-native-paper'; // Import PaperProvider
import { theme } from './src/theme'; // Import custom theme
import { EstimateBuilderProvider } from './src/contexts/EstimateBuilderContext'; // Import the context provider

import { supabase } from './src/lib/supabaseClient';
import LoginScreen from './src/screens/Auth/LoginScreen';
import SignUpScreen from './src/screens/Auth/SignUpScreen';
// Import Main App Screens
import DashboardScreen from './src/screens/Dashboard/DashboardScreen';
import EstimatesScreen from './src/screens/Estimates/EstimatesScreen'; // Keep for EstimateStackNav if needed elsewhere
import EstimateBuilderScreen from './src/screens/Estimates/EstimateBuilderScreen'; // Import Builder
import NewEstimateDetailsScreen from './src/screens/Estimates/NewEstimateDetailsScreen'; // Import new screen
import JobsScreen from './src/screens/Jobs/JobsScreen';
import JobDetailScreen from './src/screens/Jobs/JobDetailScreen'; // Import Job Detail
import ChangeOrdersScreen from './src/screens/Jobs/ChangeOrdersScreen'; // Import Change Orders
import CostbooksScreen from './src/screens/Costbooks/CostbooksScreen';
import SettingsScreen from './src/screens/Settings/SettingsScreen';
import CustomersScreen from './src/screens/Customers/CustomersScreen'; // Import CustomersScreen
// Import the CustomerModalScreen with correct path
import CustomerModalScreen from './src/screens/Customers/CustomerModalScreen'; // Correct path
import CustomerSelectionScreen from './src/screens/Customers/CustomerSelectionScreen'; // Import the selection screen
import CustomerDetailScreen from './src/screens/Customers/CustomerDetailScreen'; // Import Customer Detail Screen

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
  JobDetail: { jobId?: string, estimateId?: string }; // Route for JobDetailScreen, make jobId optional for creation, add estimateId
  ChangeOrders: { jobId: string }; // Add ChangeOrders route, requires jobId
  CustomerModalScreen: { customerToEdit?: any, onSaveSuccessRoute?: string, jobTitle?: string, templateId?: string }; // Screen for Customer Modal form, now supports jobTitle/templateId
  // Update CustomerSelectionScreen to accept jobTitle and templateId
  CustomerSelectionScreen: { jobTitle: string; templateId?: string }; 
  EstimateBuilder: { estimateId?: string, jobId?: string, selectedCustomer?: any, jobTitle?: string, templateId?: string }; // Updated params
  NewEstimateDetails: undefined; // New screen for job title and template selection
};

// Define types for the nested Customer Stack
export type CustomerStackParamList = {
  CustomerList: undefined;
  CustomerDetail: { customerId: string };
  // Ensure CustomerModalScreen is defined here for the stack
  CustomerModalScreen: { customerToEdit?: any, onSaveSuccessRoute?: string, jobTitle?: string, templateId?: string };
};

import { NavigatorScreenParams } from '@react-navigation/native'; // Import NavigatorScreenParams

// Define types for the Drawer navigator parameters
// Add EstimateBuilder here for the hidden screen
export type AppDrawerParamList = {
  Dashboard: undefined;
  // Estimates: undefined; // Removed from drawer
  // Update Jobs to accept JobStackParamList parameters
  Jobs: NavigatorScreenParams<JobStackParamList> | undefined;
  Costbooks: undefined;
  // Update Customers to use CustomerStackParamList
  Customers: NavigatorScreenParams<CustomerStackParamList> | undefined;
  Settings: undefined;
  // EstimateBuilder: { estimateId?: string }; // REMOVE EstimateBuilder from Drawer params
  // Add other main app screens here
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const EstimateStackNav = createNativeStackNavigator<EstimateStackParamList>(); // Uncomment - Still needed by EstimateStackNavigator
const JobStackNav = createNativeStackNavigator<JobStackParamList>(); // Job Stack Navigator
const CustomerStackNav = createNativeStackNavigator<CustomerStackParamList>(); // Customer Stack Navigator
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

// Stack Navigator for Customer related screens
function CustomerStackNavigator() {
  return (
    <CustomerStackNav.Navigator>
      {/* Main Customer List */}
      <CustomerStackNav.Screen
        name="CustomerList"
        component={CustomersScreen}
        options={{ title: 'Customers' }} // Set header title for the list
      />
      {/* Customer Detail Screen */}
      <CustomerStackNav.Screen
        name="CustomerDetail"
        component={CustomerDetailScreen}
        // Title will be set dynamically in the component
      />
      {/* Modal for Adding/Editing Customers */}
      <CustomerStackNav.Group screenOptions={{ presentation: 'modal', headerShown: false }}>
        <CustomerStackNav.Screen name="CustomerModalScreen" component={CustomerModalScreen} />
      </CustomerStackNav.Group>
    </CustomerStackNav.Navigator>
  );
}
// Stack Navigator for Job related screens
function JobStackNavigator() {
  return (
    // Wrap the navigator with the context provider - REVERTED
    <EstimateBuilderProvider>
      <JobStackNav.Navigator>
        {/* Removed headerShown: false from screenOptions to show default header */}
        <JobStackNav.Group>
          <JobStackNav.Screen
            name="JobList"
            component={JobsScreen}
            options={{ title: "Jobs Dashboard" }}
          />
          <JobStackNav.Screen name="JobDetail" component={JobDetailScreen} />
          <JobStackNav.Screen name="ChangeOrders" component={ChangeOrdersScreen} />
          {/* Add CustomerSelectionScreen as a regular screen within this stack */}
          <JobStackNav.Screen name="CustomerSelectionScreen" component={CustomerSelectionScreen} />
          {/* Add EstimateBuilderScreen to this stack - Provider now wraps navigator */}
          <JobStackNav.Screen name="EstimateBuilder" component={EstimateBuilderScreen} />
          {/* Add new screen for job title and template selection */}
          <JobStackNav.Screen name="NewEstimateDetails" component={NewEstimateDetailsScreen} />
        </JobStackNav.Group>
        {/* Define Modal Screens in a separate group */}
        <JobStackNav.Group screenOptions={{ presentation: 'modal', headerShown: false }}>
          <JobStackNav.Screen name="CustomerModalScreen" component={CustomerModalScreen} />
          {/* Add other modal screens for this stack here if needed */}
        </JobStackNav.Group>
      </JobStackNav.Navigator>
    </EstimateBuilderProvider> // REVERTED Provider closing tag
  );
}


// Main App component using Drawer Navigator
function MainAppDrawer() {
  return (
    <Drawer.Navigator initialRouteName="Dashboard">
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      {/* Estimates screen removed from drawer - accessed via Jobs */}
      <Drawer.Screen name="Jobs" component={JobStackNavigator} />
      {/* Replace direct CustomersScreen with CustomerStackNavigator */}
      <Drawer.Screen name="Customers" component={CustomerStackNavigator} />
      <Drawer.Screen name="Costbooks" component={CostbooksScreen} />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
      {/* EstimateBuilder screen removed from Drawer */}
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

  // Logs removed
  return (
    <PaperProvider theme={theme}>
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
    </PaperProvider>
  );
}

export default App;
