import React from 'react';
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
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator for main screens (Now, Today, Report)
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

// Main Stack Navigator containing tabs and template screens
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (isAuthenticated) {
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