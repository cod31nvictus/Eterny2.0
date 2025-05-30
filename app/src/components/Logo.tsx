import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'light' | 'dark';
  showText?: boolean;
  style?: any;
}

const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  variant = 'light',
  showText = false,
  style 
}) => {
  const logoSizes = {
    small: { width: 24, height: 24, fontSize: 16 },
    medium: { width: 32, height: 32, fontSize: 20 },
    large: { width: 48, height: 48, fontSize: 28 }
  };

  const colors = {
    light: '#ffffff',
    dark: '#1e293b'
  };

  // Load the Eterny logo
  const logoSource = require('../assets/images/eterny-logo.png');
  
  return (
    <View style={[styles.container, style]}>
      {/* Eterny Logo Image */}
      <Image 
        source={logoSource}
        style={[
          styles.logoImage,
          {
            width: logoSizes[size].width,
            height: logoSizes[size].height,
          }
        ]}
        resizeMode="contain"
      />
      
      {/* Optional text alongside logo */}
      {showText && (
        <Text 
          style={[
            styles.logoText,
            {
              fontSize: logoSizes[size].fontSize,
              color: colors[variant]
            }
          ]}
        >
          Eterny
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    // Image will be sized by props
  },
  logoText: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
    fontFamily: 'System',
    marginLeft: 8, // Space between logo and text
  },
});

export default Logo; 