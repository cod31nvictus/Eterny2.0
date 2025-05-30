import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { api } from '../services/api';
import { ActivityType, WellnessCategory } from '../types';

interface CreateActivityForm {
  name: string;
  description: string;
  wellnessTagIds: string[];
}

const ActivityTypesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [categories, setCategories] = useState<WellnessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityType | null>(null);
  const [formData, setFormData] = useState<CreateActivityForm>({
    name: '',
    description: '',
    wellnessTagIds: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [activitiesData, categoriesData] = await Promise.all([
        api.activities.getAll(),
        api.categories.getAll(),
      ]);
      setActivities(activitiesData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (activity?: ActivityType) => {
    if (activity) {
      setEditingActivity(activity);
      setFormData({
        name: activity.name,
        description: activity.description || '',
        wellnessTagIds: activity.wellnessTagIds.map(tag => tag._id),
      });
    } else {
      setEditingActivity(null);
      setFormData({
        name: '',
        description: '',
        wellnessTagIds: [],
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingActivity(null);
    setFormData({
      name: '',
      description: '',
      wellnessTagIds: [],
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Activity name is required');
      return;
    }

    if (formData.wellnessTagIds.length === 0) {
      Alert.alert('Error', 'Please select at least one wellness category');
      return;
    }

    try {
      if (editingActivity) {
        await api.activities.update(editingActivity._id, formData);
      } else {
        await api.activities.create(formData);
      }
      
      closeModal();
      fetchData();
      Alert.alert('Success', `Activity ${editingActivity ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving activity:', error);
      Alert.alert('Error', `Failed to ${editingActivity ? 'update' : 'create'} activity`);
    }
  };

  const handleDelete = (activity: ActivityType) => {
    if (activity.isDefault) {
      Alert.alert('Cannot Delete', 'Default activities cannot be deleted');
      return;
    }

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
              await api.activities.delete(activity._id);
              fetchData();
              Alert.alert('Success', 'Activity deleted successfully');
            } catch (error) {
              console.error('Error deleting activity:', error);
              Alert.alert('Error', 'Failed to delete activity');
            }
          },
        },
      ]
    );
  };

  const toggleCategorySelection = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      wellnessTagIds: prev.wellnessTagIds.includes(categoryId)
        ? prev.wellnessTagIds.filter(id => id !== categoryId)
        : [...prev.wellnessTagIds, categoryId],
    }));
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat._id === categoryId);
    return category ? category.name : 'Unknown';
  };

  const renderActivityItem = ({ item }: { item: ActivityType }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityHeader}>
        <Text style={styles.activityName}>{item.name}</Text>
        <View style={styles.activityActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openModal(item)}
            disabled={item.isDefault}
          >
            <Text style={[styles.editButtonText, item.isDefault && styles.disabledText]}>
              {item.isDefault ? 'Locked' : 'Edit'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
            disabled={item.isDefault}
          >
            <Text style={[styles.deleteButtonText, item.isDefault && styles.disabledText]}>
              {item.isDefault ? 'Locked' : 'Delete'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {item.description && (
        <Text style={styles.activityDescription}>{item.description}</Text>
      )}
      
      <View style={styles.tagsContainer}>
        {item.wellnessTagIds.map((tag, index) => (
          <View key={index} style={[styles.tag, { backgroundColor: tag.color }]}>
            <Text style={styles.tagText}>{tag.name}</Text>
          </View>
        ))}
      </View>
      
      {item.isDefault && (
        <Text style={styles.defaultLabel}>Default Activity</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Loading activity types...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No activity types found</Text>
          <Text style={styles.emptySubtext}>Create your first activity type to get started</Text>
        </View>
      ) : (
        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item._id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
        <Text style={styles.addButtonText}>+ Add Activity</Text>
      </TouchableOpacity>

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeModal}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editingActivity ? 'Edit Activity' : 'New Activity'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Activity Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter activity name"
                placeholderTextColor="#94a3b8"
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter description (optional)"
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Wellness Categories * (Select at least one)</Text>
              <View style={styles.categoriesContainer}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    style={[
                      styles.categoryOption,
                      formData.wellnessTagIds.includes(category._id) && styles.categorySelected,
                      { borderColor: category.color }
                    ]}
                    onPress={() => toggleCategorySelection(category._id)}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      formData.wellnessTagIds.includes(category._id) && styles.categorySelectedText
                    ]}>
                      {category.name}
                    </Text>
                    <Text style={styles.categoryType}>({category.type})</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
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
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  activityItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
  },
  activityActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  editButtonText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#ef4444',
    fontWeight: '500',
  },
  disabledText: {
    opacity: 0.5,
  },
  activityDescription: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 12,
    lineHeight: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  tagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  defaultLabel: {
    fontSize: 12,
    color: '#333333',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#333333',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoriesContainer: {
    gap: 12,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  categorySelected: {
    backgroundColor: '#F5F5F5',
    borderColor: '#000000',
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  categorySelectedText: {
    color: '#000000',
  },
  categoryType: {
    fontSize: 12,
    color: '#333333',
    textTransform: 'capitalize',
  },
});

export default ActivityTypesScreen; 