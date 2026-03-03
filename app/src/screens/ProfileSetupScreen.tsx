import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import DatePicker from 'react-native-date-picker';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface ProfileData {
  fullName: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say' | '';
}

interface ProfileSetupScreenProps {
  navigation: any;
  onComplete: () => void;
}

const ProfileSetupScreen: React.FC<ProfileSetupScreenProps> = ({ navigation, onComplete }) => {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: user?.name || '',
    dateOfBirth: '',
    gender: '',
  });

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    
    const birth = new Date(birthDate);
    const today = new Date();
    
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();
    
    if (days < 0) {
      months--;
      const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += lastMonth.getDate();
    }
    
    if (months < 0) {
      years--;
      months += 12;
    }
    
    return { years, months, days };
  };

  const formatAge = (age: { years: number; months: number; days: number } | null) => {
    if (!age) return '';
    
    const parts = [];
    if (age.years > 0) parts.push(`${age.years} year${age.years !== 1 ? 's' : ''}`);
    if (age.months > 0) parts.push(`${age.months} month${age.months !== 1 ? 's' : ''}`);
    if (age.days > 0) parts.push(`${age.days} day${age.days !== 1 ? 's' : ''}`);
    
    return parts.join(', ');
  };

  const handleDateConfirm = (date: Date) => {
    setSelectedDate(date);
    const formattedDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    setProfileData(prev => ({ ...prev, dateOfBirth: formattedDate }));
    setShowDatePicker(false);
  };

  const handleComplete = async () => {
    if (!profileData.fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    if (!profileData.dateOfBirth.trim()) {
      Alert.alert('Error', 'Date of birth is required');
      return;
    }

    if (!profileData.gender) {
      Alert.alert('Error', 'Please select your gender');
      return;
    }

    try {
      setSaving(true);
      // Ensure gender is not empty string when saving
      const dataToSave = {
        ...profileData,
        gender: profileData.gender as 'male' | 'female' | 'other' | 'prefer_not_to_say'
      };
      await api.profile.update(dataToSave);
      Alert.alert('Success', 'Profile setup completed!', [
        { text: 'OK', onPress: () => navigation.replace('Main') }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const genderOptions = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' },
    { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  ];

  const age = calculateAge(profileData.dateOfBirth);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Welcome to Eterny!</Text>
          <Text style={styles.subtitle}>
            Let's set up your profile to personalize your experience
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tell us about yourself</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={profileData.fullName}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, fullName: text }))}
              placeholder="Enter your full name"
              placeholderTextColor="#94a3b8"
              autoFocus
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Date of Birth *</Text>
            <TouchableOpacity
              style={styles.datePickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.datePickerText, !profileData.dateOfBirth && styles.placeholderText]}>
                {profileData.dateOfBirth || 'Select your date of birth'}
              </Text>
              <Text style={styles.datePickerIcon}>📅</Text>
            </TouchableOpacity>
            
            {age && (
              <View style={styles.ageContainer}>
                <Text style={styles.ageLabel}>Age: </Text>
                <Text style={styles.ageText}>{formatAge(age)}</Text>
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Gender *</Text>
            <View style={styles.genderContainer}>
              {genderOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.genderOption,
                    profileData.gender === option.value && styles.genderOptionSelected,
                  ]}
                  onPress={() => setProfileData(prev => ({ ...prev, gender: option.value as any }))}
                >
                  <View style={[
                    styles.radioButton,
                    profileData.gender === option.value && styles.radioButtonSelected,
                  ]}>
                    {profileData.gender === option.value && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                  <Text style={[
                    styles.genderOptionText,
                    profileData.gender === option.value && styles.genderOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.accountSection}>
          <Text style={styles.accountTitle}>Account Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{user?.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Type:</Text>
            <Text style={styles.infoValue}>Google Account</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.completeButton, saving && styles.completeButtonDisabled]} 
          onPress={handleComplete}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.completeButtonText}>Complete Setup</Text>
          )}
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          You can update this information anytime from your profile settings
        </Text>
      </View>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerModal}>
          <View style={styles.datePickerContainer}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerCancel}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>Select Date of Birth</Text>
              <TouchableOpacity onPress={() => handleDateConfirm(selectedDate)}>
                <Text style={styles.datePickerConfirm}>Done</Text>
              </TouchableOpacity>
            </View>
            <DatePicker
              date={selectedDate}
              onDateChange={setSelectedDate}
              mode="date"
              maximumDate={new Date()}
              minimumDate={new Date(1900, 0, 1)}
              style={styles.datePicker}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingTop: 40,
    paddingBottom: 32,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#1f2937',
  },
  helpText: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 6,
  },
  genderContainer: {
    gap: 12,
  },
  genderOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  genderOptionSelected: {
    borderColor: '#6366f1',
    backgroundColor: '#f0f9ff',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#6366f1',
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  genderOptionText: {
    fontSize: 16,
    color: '#374151',
  },
  genderOptionTextSelected: {
    color: '#6366f1',
    fontWeight: '600',
  },
  accountSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  accountTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
  },
  completeButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  completeButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
    elevation: 0,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerNote: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  datePickerButton: {
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  datePickerText: {
    fontSize: 16,
    color: '#374151',
  },
  placeholderText: {
    color: '#94a3b8',
  },
  datePickerIcon: {
    fontSize: 16,
    color: '#374151',
  },
  ageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  ageLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  ageText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '600',
  },
  datePickerModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  datePickerConfirm: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  datePicker: {
    width: 320,
    height: 320,
  },
});

export default ProfileSetupScreen; 