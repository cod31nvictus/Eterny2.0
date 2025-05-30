import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface AppHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  title = 'Eterny', 
  showBackButton = false, 
  onBackPress 
}) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const { logout } = useAuth();
  const navigation = useNavigation();

  const showConfigMenu = () => {
    console.log('🎯 AppHeader: Opening hamburger menu...');
    setMenuVisible(true);
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };

  const navigateToScreen = (screenName: string) => {
    console.log(`🎯 AppHeader: Navigating to ${screenName}...`);
    closeMenu();
    try {
      const parentNavigation = navigation.getParent();
      if (parentNavigation) {
        console.log(`🎯 AppHeader: Using parent navigation for ${screenName}`);
        parentNavigation.navigate(screenName);
      } else {
        console.log(`🎯 AppHeader: Using direct navigation for ${screenName}`);
        (navigation as any).navigate(screenName);
      }
      console.log(`🎯 AppHeader: Navigation to ${screenName} completed`);
    } catch (error) {
      console.error(`🎯 AppHeader: Navigation to ${screenName} failed:`, error);
    }
  };

  const handleLogout = () => {
    closeMenu();
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              Alert.alert('Success', 'Logged out successfully');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <>
      <View style={styles.header}>
        {showBackButton ? (
          <TouchableOpacity style={styles.leftButton} onPress={handleBackPress}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/eterny-logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}
        
        <Text style={styles.headerTitle}>{title}</Text>
        
        <TouchableOpacity style={styles.menuButton} onPress={showConfigMenu}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      {/* Hamburger Menu Modal */}
      <Modal
        visible={menuVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeMenu}
      >
        <View style={styles.menuContainer}>
          <View style={styles.menuHeader}>
            <Text style={styles.menuTitle}>Settings</Text>
            <TouchableOpacity onPress={closeMenu} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.menuContent}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateToScreen('Templates')}
            >
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Design Day Templates</Text>
                <Text style={styles.menuItemSubtitle}>Create daily schedules with time blocks</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateToScreen('Calendar')}
            >
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Plan Calendar</Text>
                <Text style={styles.menuItemSubtitle}>Schedule templates to specific dates</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.menuSeparator} />

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateToScreen('WellnessCategories')}
            >
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Wellness Categories</Text>
                <Text style={styles.menuItemSubtitle}>Manage wellness and drain categories</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateToScreen('ActivityTypes')}
            >
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Activity Types</Text>
                <Text style={styles.menuItemSubtitle}>Create and manage activity types</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateToScreen('DayDimensions')}
            >
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Day Dimensions</Text>
                <Text style={styles.menuItemSubtitle}>Configure day characteristics</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => navigateToScreen('Profile')}
            >
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>Profile</Text>
                <Text style={styles.menuItemSubtitle}>Manage your personal information</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.menuSeparator} />

            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <View style={styles.menuItemContent}>
                <Text style={[styles.menuItemTitle, styles.logoutText]}>Logout</Text>
                <Text style={styles.menuItemSubtitle}>Sign out of your account</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 8,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  leftButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
  },
  backIcon: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'normal',
  },
  headerTitle: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    flex: 1,
    textAlign: 'center',
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuIcon: {
    color: '#000000',
    fontSize: 24,
    fontWeight: 'normal',
  },
  // Hamburger Menu Styles
  menuContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#333333',
    fontWeight: 'bold',
  },
  menuContent: {
    flex: 1,
    padding: 16,
  },
  menuItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#333333',
  },
  menuSeparator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 16,
  },
  logoutItem: {
    marginTop: 16,
  },
  logoutText: {
    color: '#dc2626',
  },
});

export default AppHeader; 