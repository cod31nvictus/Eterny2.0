import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import Logo from '../components/Logo';

const HealthScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Health Insights</Text>
          <Text style={styles.subtitle}>
            Track your wellness metrics and health trends
          </Text>
        </View>

        {/* Coming Soon Section */}
        <View style={styles.comingSoonContainer}>
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonDescription}>
            We're working on bringing you comprehensive health tracking features including:
          </Text>

          {/* Feature List */}
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>●</Text>
              <Text style={styles.featureText}>Heart rate monitoring</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>●</Text>
              <Text style={styles.featureText}>Sleep quality tracking</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>●</Text>
              <Text style={styles.featureText}>Activity and fitness metrics</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>●</Text>
              <Text style={styles.featureText}>Stress and mindfulness insights</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>●</Text>
              <Text style={styles.featureText}>Health trends and analytics</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>●</Text>
              <Text style={styles.featureText}>Personalized health goals</Text>
            </View>
          </View>

          <Text style={styles.stayTunedText}>
            Stay tuned for these exciting features!
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Logo size="small" variant="dark" showText={true} />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
  },
  comingSoonContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  featureBullet: {
    fontSize: 16,
    color: '#000000',
    marginRight: 12,
    width: 20,
  },
  featureText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  stayTunedText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingVertical: 16,
  },
});

export default HealthScreen; 