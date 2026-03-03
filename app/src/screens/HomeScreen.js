import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Platform
} from 'react-native';

// Web-compatible Google Sign-in
let GoogleSignin;
if (Platform.OS === 'web') {
  GoogleSignin = {
    signOut: () => Promise.resolve()
  };
} else {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
}

const HomeScreen = ({ navigation }) => {
  const signOut = async () => {
    try {
      await GoogleSignin.signOut();
      // Clear any stored user data from your app
      
      // Navigate back to login screen
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Eterny</Text>
        <Text style={styles.subtitle}>You are successfully logged in!</Text>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>What's Next?</Text>
          <Text style={styles.infoText}>
            This is where you would start building your schedule and activity tracking features.
          </Text>
        </View>
        
        <TouchableOpacity style={styles.button} onPress={signOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  infoSection: {
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 10,
    width: '100%',
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#f44336',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeScreen; 