import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { ActivityType, WellnessCategory } from '../types';
import { apiService } from '../services/api';

const ACTIVITY_ICONS = [
  '🏃', '💪', '🧘', '🍽️', '💼', '🏠', '📚', '🏥', 
  '🎵', '🎮', '🚗', '📞', '💻', '📖', '🎨', '⚽'
];

const ActivitiesScreen: React.FC = () => {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [categories, setCategories] = useState<WellnessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '🏃',
    estimatedDuration: 30,
    wellnessCategoryIds: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [activitiesData, categoriesData] = await Promise.all([
        apiService.getActivityTypes(),
        apiService.getWellnessCategories(),
      ]);
      setActivities(activitiesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load activities and categories');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (activity?: ActivityType) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        name: activity.name,
        icon: activity.icon,
        estimatedDuration: activity.estimatedDuration,
        wellnessCategoryIds: activity.wellnessCategoryIds,
      });
    } else {
      setEditingActivity(null);
      setFormData({
        name: '',
        icon: '🏃',
        estimatedDuration: 30,
        wellnessCategoryIds: [],
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingActivity(null);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Activity name is required');
      return;
    }

    if (formData.estimatedDuration <= 0) {
      Alert.alert('Error', 'Duration must be greater than 0');
      return;
    }

    try {
      if (editingActivity) {
        const updated = await apiService.updateActivityType(editingActivity._id, formData);
        setActivities(prev => prev.map(a => a._id === editingActivity._id ? updated : a));
      } else {
        const created = await apiService.createActivityType(formData);
        setActivities(prev => [...prev, created]);
      }
      closeModal();
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert('Error', 'Failed to save activity');
    }
  };

  const handleDelete = (activity: ActivityType) => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteActivityType(activity._id);
              setActivities(prev => prev.filter(a => a._id !== activity._id));
            } catch (error) {
              console.error('Error deleting activity:', error);
              Alert.alert('Error', 'Failed to delete activity');
            }
          },
        },
      ]
    );
  };

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      wellnessCategoryIds: prev.wellnessCategoryIds.includes(categoryId)
        ? prev.wellnessCategoryIds.filter(id => id !== categoryId)
        : [...prev.wellnessCategoryIds, categoryId],
    }));
  };

  const getWellnessCategories = (categoryIds: string[]) => {
    return categories.filter(cat => categoryIds.includes(cat._id) && cat.type === 'wellness');
  };

  const renderActivityCard = ({ item }: { item: ActivityType }) => {
    const wellnessCategories = getWellnessCategories(item.wellnessCategoryIds);

    return (
      <TouchableOpacity
        style={styles.activityCard}
        onPress={() => openModal(item)}
        onLongPress={() => handleDelete(item)}
      >
        <View style={styles.activityHeader}>
          <Text style={styles.activityIcon}>{item.icon}</Text>
          <View style={styles.activityInfo}>
            <Text style={styles.activityName}>{item.name}</Text>
            <Text style={styles.activityDuration}>{item.estimatedDuration} min</Text>
          </View>
        </View>
        
        {wellnessCategories.length > 0 && (
          <View style={styles.categoriesContainer}>
            {wellnessCategories.map(category => (
              <View
                key={category._id}
                style={[
                  styles.categoryTag,
                  { backgroundColor: category.color + '20', borderColor: category.color }
                ]}
              >
                <Text style={[styles.categoryTagText, { color: category.color }]}>
                  {category.name}
                </Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderIconSelector = () => (
    <View style={styles.iconSelector}>
      <Text style={styles.sectionTitle}>Select Icon</Text>
      <View style={styles.iconGrid}>
        {ACTIVITY_ICONS.map(icon => (
          <TouchableOpacity
            key={icon}
            style={[
              styles.iconOption,
              formData.icon === icon && styles.selectedIcon
            ]}
            onPress={() => setFormData(prev => ({ ...prev, icon }))}
          >
            <Text style={styles.iconText}>{icon}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCategorySelector = () => {
    const wellnessCategories = categories.filter(cat => cat.type === 'wellness');
    
    return (
      <View style={styles.categorySelector}>
        <Text style={styles.sectionTitle}>Wellness Categories</Text>
        <View style={styles.categoryGrid}>
          {wellnessCategories.map(category => (
            <TouchableOpacity
              key={category._id}
              style={[
                styles.categoryOption,
                formData.wellnessCategoryIds.includes(category._id) && styles.selectedCategory,
                { borderColor: category.color }
              ]}
              onPress={() => toggleCategory(category._id)}
            >
              <Text style={[
                styles.categoryOptionText,
                formData.wellnessCategoryIds.includes(category._id) && { color: category.color }
              ]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activities</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={activities}
        renderItem={renderActivityCard}
        keyExtractor={item => item._id}
        numColumns={2}
        contentContainerStyle={styles.activitiesList}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingActivity ? 'Edit Activity' : 'New Activity'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.saveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Activity Name</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter activity name"
              />
            </View>

            {renderIconSelector()}

            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Estimated Duration (minutes)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.estimatedDuration.toString()}
                onChangeText={(text) => {
                  const duration = parseInt(text) || 0;
                  setFormData(prev => ({ ...prev, estimatedDuration: duration }));
                }}
                placeholder="30"
                keyboardType="numeric"
              />
            </View>

            {renderCategorySelector()}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  activitiesList: {
    padding: 10,
  },
  activityCard: {
    flex: 1,
    backgroundColor: 'white',
    margin: 5,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  activityIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  activityDuration: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cancelButton: {
    fontSize: 16,
    color: '#666',
  },
  saveButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  iconSelector: {
    marginBottom: 25,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedIcon: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  iconText: {
    fontSize: 24,
  },
  categorySelector: {
    marginBottom: 25,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryOption: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#f9f9f9',
  },
  selectedCategory: {
    backgroundColor: '#f0f8f0',
  },
  categoryOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
});

export default ActivitiesScreen; 