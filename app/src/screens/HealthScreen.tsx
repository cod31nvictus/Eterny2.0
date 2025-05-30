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
          <View style={styles.iconContainer}>
            <Text style={styles.comingSoonIcon}>🚧</Text>
          </View>
          
          <Text style={styles.comingSoonTitle}>Coming Soon</Text>
          <Text style={styles.comingSoonDescription}>
            We're working on bringing you comprehensive health tracking features including:
          </Text>

          {/* Feature List */}
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>💓</Text>
              <Text style={styles.featureText}>Heart rate monitoring</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>😴</Text>
              <Text style={styles.featureText}>Sleep quality tracking</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>🏃‍♂️</Text>
              <Text style={styles.featureText}>Activity and fitness metrics</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>🧘‍♀️</Text>
              <Text style={styles.featureText}>Stress and mindfulness insights</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>📊</Text>
              <Text style={styles.featureText}>Health trends and analytics</Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureBullet}>🎯</Text>
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
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  comingSoonContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginBottom: 16,
  },
  comingSoonIcon: {
    fontSize: 48,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366f1',
    marginBottom: 12,
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#64748b',
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
    fontSize: 20,
    marginRight: 12,
    width: 32,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  stayTunedText: {
    fontSize: 14,
    color: '#6366f1',
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