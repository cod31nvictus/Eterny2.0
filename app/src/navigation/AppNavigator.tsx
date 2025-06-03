import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import NowScreen from '../screens/NowScreen';
import TodayScreen from '../screens/TodayScreen';
import HealthScreen from '../screens/HealthScreen';
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
import HabitTrackerScreen from '../screens/HabitTrackerScreen';
import MenuBuilderScreen from '../screens/MenuBuilderScreen';
import ToDoScreen from '../screens/ToDoScreen';
import { ActivityIndicator, View, StyleSheet, Text, Image } from 'react-native';
import api from '../services/api';
import AppHeader from '../components/AppHeader';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Custom Header Component for different screens
const CustomHeader = ({ route, navigation }: any) => {
  const getHeaderTitle = () => {
    switch (route.name) {
      case 'MainTabs':
        // For tab screens, we'll determine the title based on the active tab
        const state = route.state;
        if (state && state.routes && state.routes[state.index]) {
          const activeTab = state.routes[state.index].name;
          switch (activeTab) {
            case 'Now':
              return 'Right Now';
            case 'Schedule':
              return "Today's Schedule";
            case 'Health':
              return 'Health';
            case 'Wellness':
              return 'Analytics';
            default:
              return 'Eterny';
          }
        }
        return 'Eterny';
      case 'Templates':
        return 'Day Templates';
      case 'CreateTemplate':
        return 'Create Template';
      case 'EditTimeBlocks':
        return 'Edit Time Blocks';
      case 'Calendar':
        return 'Plan Calendar';
      case 'WellnessCategories':
        return 'Wellness Categories';
      case 'ActivityTypes':
        return 'Activity Types';
      case 'DayDimensions':
        return 'Day Dimensions';
      case 'Categories':
        return 'Categories';
      case 'Activities':
        return 'Activities';
      case 'Settings':
        return 'Settings';
      case 'Progress':
        return 'Progress';
      case 'Dashboard':
        return 'Dashboard';
      case 'Profile':
        return 'Profile';
      case 'HabitTracker':
        return 'Habit Tracker';
      case 'MenuBuilder':
        return 'Meal Builder';
      case 'ToDo':
        return 'To Do';
      default:
        return 'Eterny';
    }
  };

  const isMainTabs = route.name === 'MainTabs';
  
  return (
    <AppHeader 
      title={getHeaderTitle()}
      showBackButton={!isMainTabs}
      onBackPress={!isMainTabs ? () => navigation.goBack() : undefined}
    />
  );
};

// Custom Tab Icon Component
const TabIcon = ({ iconName, color, size }: { iconName: string; color: string; size: number }) => {
  const getIconSource = () => {
    switch (iconName) {
      case 'now':
        return null; // Keep the current dot icon
      case 'schedule':
        return require('../assets/images/eterny-sun.png');
      case 'health':
        return require('../assets/images/eterny-heart.png');
      case 'wellness':
        return require('../assets/images/eterny-infinity.png');
      default:
        return null;
    }
  };

  const getIconSize = () => {
    // Make heart icon 75% of normal size
    if (iconName === 'health') {
      return size * 0.75;
    }
    return size;
  };

  const iconSource = getIconSource();
  const iconSize = getIconSize();

  if (iconSource) {
    return (
      <View style={styles.tabIconContainer}>
        <Image 
          source={iconSource} 
          style={[
            styles.tabIconImage, 
            { 
              width: iconSize, 
              height: iconSize,
              tintColor: color 
            }
          ]} 
          resizeMode="contain"
        />
      </View>
    );
  }

  // Fallback for 'now' icon (dot)
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIconText, { color }]}>●</Text>
    </View>
  );
};

// Tab Navigator for main screens (Now, Schedule, Health, Wellness)
const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingBottom: 8,
        paddingTop: 8,
        height: 70,
      },
      tabBarActiveTintColor: '#000000',
      tabBarInactiveTintColor: '#333333',
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
          <TabIcon iconName="now" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen 
      name="Schedule" 
      component={TodayScreen}
      options={{
        tabBarLabel: 'Schedule',
        tabBarIcon: ({ color, size }) => (
          <TabIcon iconName="schedule" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen 
      name="Health" 
      component={HealthScreen}
      options={{
        tabBarLabel: 'Health',
        tabBarIcon: ({ color, size }) => (
          <TabIcon iconName="health" color={color} size={size} />
        ),
      }}
    />
    <Tab.Screen 
      name="Wellness" 
      component={AnalyticsScreen}
      options={{
        tabBarLabel: 'Wellness',
        tabBarIcon: ({ color, size }) => (
          <TabIcon iconName="wellness" color={color} size={size} />
        ),
      }}
    />
  </Tab.Navigator>
);

// Main Stack Navigator containing tabs and all other screens
const MainStackNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      header: ({ route, navigation }) => <CustomHeader route={route} navigation={navigation} />,
    }}
  >
    <Stack.Screen 
      name="MainTabs" 
      component={TabNavigator}
    />
    
    {/* Template Management Screens */}
    <Stack.Screen 
      name="Templates" 
      component={TemplatesScreen}
    />
    <Stack.Screen 
      name="CreateTemplate" 
      component={CreateTemplateScreen}
    />
    <Stack.Screen 
      name="EditTimeBlocks" 
      component={EditTimeBlocksScreen}
    />
    
    {/* Calendar and Planning Screens */}
    <Stack.Screen 
      name="Calendar" 
      component={CalendarScreen}
    />
    
    {/* Configuration Screens */}
    <Stack.Screen 
      name="WellnessCategories" 
      component={WellnessCategoriesScreen}
    />
    <Stack.Screen 
      name="ActivityTypes" 
      component={ActivityTypesScreen}
    />
    <Stack.Screen 
      name="DayDimensions" 
      component={DayDimensionsScreen}
    />
    <Stack.Screen 
      name="Categories" 
      component={CategoriesScreen}
    />
    <Stack.Screen 
      name="Activities" 
      component={ActivitiesScreen}
    />
    
    {/* Other Screens */}
    <Stack.Screen 
      name="Settings" 
      component={SettingsScreen}
    />
    <Stack.Screen 
      name="Progress" 
      component={ProgressScreen}
    />
    <Stack.Screen 
      name="Dashboard" 
      component={DashboardScreen}
    />
    <Stack.Screen 
      name="Profile" 
      component={ProfileScreen}
    />
    
    {/* Quick Access Screens */}
    <Stack.Screen 
      name="HabitTracker" 
      component={HabitTrackerScreen}
    />
    <Stack.Screen 
      name="MenuBuilder" 
      component={MenuBuilderScreen}
    />
    <Stack.Screen 
      name="ToDo" 
      component={ToDoScreen}
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
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333333',
  },
  tabIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabIconText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tabIconImage: {
    // Image sizing handled by props
  },
});

export default AppNavigator; 