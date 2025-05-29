import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import NowScreen from '../screens/NowScreen';
import TodayScreen from '../screens/TodayScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import TemplatesScreen from '../screens/TemplatesScreen';
import CreateTemplateScreen from '../screens/CreateTemplateScreen';
import EditTimeBlocksScreen from '../screens/EditTimeBlocksScreen';
import CalendarScreen from '../screens/CalendarScreen';
import WellnessCategoriesScreen from '../screens/WellnessCategoriesScreen';
import ActivityTypesScreen from '../screens/ActivityTypesScreen';
import DayDimensionsScreen from '../screens/DayDimensionsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProgressScreen from '../screens/ProgressScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileSetupScreen from '../screens/ProfileSetupScreen';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import api from '../services/api';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for main screens (Now, Today, Report, Templates)
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingBottom: 8,
        paddingTop: 8,
        height: 70,
      },
      tabBarActiveTintColor: '#6366f1',
      tabBarInactiveTintColor: '#64748b',
      tabBarLabelStyle: {
        fontSize: 12,
        fontWeight: '600',
      },
    }}
  >
    <Tab.Screen 
      name="Now" 
      component={NowScreen}
      options={{
        tabBarLabel: 'Now',
        tabBarIcon: ({ color, size }) => (
          <View style={[styles.tabIcon, { backgroundColor: color + '20' }]}>
            <Text style={[styles.tabIconText, { color }]}>●</Text>
          </View>
        ),
      }}
    />
    <Tab.Screen 
      name="Today" 
      component={TodayScreen}
      options={{
        tabBarLabel: 'Today',
        tabBarIcon: ({ color, size }) => (
          <View style={[styles.tabIcon, { backgroundColor: color + '20' }]}>
            <Text style={[styles.tabIconText, { color }]}>📅</Text>
          </View>
        ),
      }}
    />
    <Tab.Screen 
      name="Report" 
      component={AnalyticsScreen}
      options={{
        tabBarLabel: 'Report',
        tabBarIcon: ({ color, size }) => (
          <View style={[styles.tabIcon, { backgroundColor: color + '20' }]}>
            <Text style={[styles.tabIconText, { color }]}>📊</Text>
          </View>
        ),
      }}
    />
    <Tab.Screen 
      name="Templates" 
      component={TemplatesScreen}
      options={{
        tabBarLabel: 'Templates',
        tabBarIcon: ({ color, size }) => (
          <View style={[styles.tabIcon, { backgroundColor: color + '20' }]}>
            <Text style={[styles.tabIconText, { color }]}>📋</Text>
          </View>
        ),
      }}
    />
  </Tab.Navigator>
);

// Main Stack Navigator containing tabs and all other screens
const MainStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: '#6366f1',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    }}
  >
    <Stack.Screen 
      name="MainTabs" 
      component={TabNavigator}
      options={{ 
        title: 'Eterny',
        headerTitle: 'Eterny'
      }}
    />
    
    {/* Template Management Screens */}
    <Stack.Screen 
      name="CreateTemplate" 
      component={CreateTemplateScreen}
      options={{ title: 'Create Template' }}
    />
    <Stack.Screen 
      name="EditTimeBlocks" 
      component={EditTimeBlocksScreen}
      options={{ title: 'Edit Time Blocks' }}
    />
    
    {/* Calendar and Planning Screens */}
    <Stack.Screen 
      name="Calendar" 
      component={CalendarScreen}
      options={{ title: 'Plan Calendar' }}
    />
    
    {/* Configuration Screens */}
    <Stack.Screen 
      name="WellnessCategories" 
      component={WellnessCategoriesScreen}
      options={{ title: 'Wellness Categories' }}
    />
    <Stack.Screen 
      name="ActivityTypes" 
      component={ActivityTypesScreen}
      options={{ title: 'Activity Types' }}
    />
    <Stack.Screen 
      name="DayDimensions" 
      component={DayDimensionsScreen}
      options={{ title: 'Day Dimensions' }}
    />
    <Stack.Screen 
      name="Categories" 
      component={CategoriesScreen}
      options={{ title: 'Categories' }}
    />
    <Stack.Screen 
      name="Activities" 
      component={ActivitiesScreen}
      options={{ title: 'Activities' }}
    />
    
    {/* Other Screens */}
    <Stack.Screen 
      name="Settings" 
      component={SettingsScreen}
      options={{ title: 'Settings' }}
    />
    <Stack.Screen 
      name="Progress" 
      component={ProgressScreen}
      options={{ title: 'Progress' }}
    />
    <Stack.Screen 
      name="Dashboard" 
      component={DashboardScreen}
      options={{ title: 'Dashboard' }}
    />
    <Stack.Screen 
      name="Profile" 
      component={ProfileScreen}
      options={{ title: 'Profile' }}
    />
  </Stack.Navigator>
);

// Auth Stack
const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
  </Stack.Navigator>
);

// Main App Content
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (isAuthenticated && !loading) {
        try {
          const completion = await api.profile.checkCompletion();
          setNeedsProfileSetup(!completion.hasProfile || !completion.isComplete);
        } catch (error) {
          console.error('Error checking profile completion:', error);
          // If there's an error, assume profile setup is needed
          setNeedsProfileSetup(true);
        } finally {
          setProfileLoading(false);
        }
      } else {
        setProfileLoading(false);
      }
    };

    checkProfileCompletion();
  }, [isAuthenticated, loading]);

  const handleProfileSetupComplete = () => {
    setNeedsProfileSetup(false);
  };

  if (loading || profileLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isAuthenticated) {
    if (needsProfileSetup) {
      return <ProfileSetupScreen navigation={null} onComplete={handleProfileSetupComplete} />;
    }
    return <MainStackNavigator />;
  } else {
    return <AuthStack />;
  }
};

// Root App Navigator
const AppNavigator = () => {
  console.log('🌍 AppNavigator rendering...');
  
  return (
    <NavigationContainer>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  tabIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AppNavigator; 