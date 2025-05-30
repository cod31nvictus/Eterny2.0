import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    // Show splash screen for 3 seconds
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Background Image */}
      <Image
        source={require('../assets/images/splash-background.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Overlay for better text visibility */}
      <View style={styles.overlay} />
      
      {/* Content */}
      <View style={styles.content}>
        <Image
          source={require('../assets/images/eterny-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
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
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // Dark overlay for better text visibility
  },
  content: {
    alignItems: 'center',
    zIndex: 1,
  },
  logo: {
    width: 260,
    height: 156,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '300',
    letterSpacing: 1,
    textAlign: 'center',
  },
});

export default SplashScreen; 