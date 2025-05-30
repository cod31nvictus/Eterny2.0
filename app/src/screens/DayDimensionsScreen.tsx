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
import { DayDimension, DimensionValue } from '../types';

interface CreateDimensionForm {
  name: string;
  description?: string;
  values: { name: string; description?: string }[];
}

const DayDimensionsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [dimensions, setDimensions] = useState<DayDimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingDimension, setEditingDimension] = useState<DayDimension | null>(null);
  const [formData, setFormData] = useState<CreateDimensionForm>({
    name: '',
    description: '',
    values: [{ name: '', description: '' }],
  });

  useEffect(() => {
    fetchDimensions();
  }, []);

  const fetchDimensions = async () => {
    try {
      setLoading(true);
      const data = await api.dimensions.getAll();
      setDimensions(data);
    } catch (error) {
      console.error('Error fetching dimensions:', error);
      Alert.alert('Error', 'Failed to load day dimensions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (dimension?: DayDimension) => {
    if (dimension) {
      setEditingDimension(dimension);
      setFormData({
        name: dimension.name,
        description: dimension.description || '',
        values: dimension.values.map(v => ({ name: v.name, description: v.description || '' })),
      });
    } else {
      setEditingDimension(null);
      setFormData({
        name: '',
        description: '',
        values: [{ name: '', description: '' }],
      });
    }
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingDimension(null);
    setFormData({
      name: '',
      description: '',
      values: [{ name: '', description: '' }],
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Dimension name is required');
      return;
    }

    const validValues = formData.values.filter(value => value.name.trim() !== '');
    if (validValues.length === 0) {
      Alert.alert('Error', 'Please add at least one dimension value');
      return;
    }

    try {
      const dataToSave = {
        name: formData.name.trim(),
        description: formData.description?.trim(),
        values: validValues.map(value => ({
          name: value.name.trim(),
          description: value.description?.trim(),
        })),
      };

      if (editingDimension) {
        await api.dimensions.update(editingDimension._id, dataToSave);
      } else {
        await api.dimensions.create(dataToSave);
      }
      
      closeModal();
      fetchDimensions();
      Alert.alert('Success', `Dimension ${editingDimension ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error saving dimension:', error);
      Alert.alert('Error', `Failed to ${editingDimension ? 'update' : 'create'} dimension`);
    }
  };

  const handleDelete = (dimension: DayDimension) => {
    if (dimension.isDefault) {
      Alert.alert('Cannot Delete', 'Default dimensions cannot be deleted');
      return;
    }

    Alert.alert(
      'Delete Dimension',
      `Are you sure you want to delete "${dimension.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.dimensions.delete(dimension._id);
              fetchDimensions();
              Alert.alert('Success', 'Dimension deleted successfully');
            } catch (error) {
              console.error('Error deleting dimension:', error);
              Alert.alert('Error', 'Failed to delete dimension');
            }
          },
        },
      ]
    );
  };

  const addValue = () => {
    setFormData(prev => ({
      ...prev,
      values: [...prev.values, { name: '', description: '' }],
    }));
  };

  const removeValue = (index: number) => {
    if (formData.values.length > 1) {
      setFormData(prev => ({
        ...prev,
        values: prev.values.filter((_, i) => i !== index),
      }));
    }
  };

  const updateValue = (index: number, field: 'name' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      values: prev.values.map((v, i) => i === index ? { ...v, [field]: value } : v),
    }));
  };

  const renderDimensionItem = ({ item }: { item: DayDimension }) => (
    <View style={styles.dimensionItem}>
      <View style={styles.dimensionHeader}>
        <Text style={styles.dimensionName}>{item.name}</Text>
        <View style={styles.dimensionActions}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => openModal(item)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
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
        <Text style={styles.dimensionDescription}>{item.description}</Text>
      )}
      
      <View style={styles.valuesContainer}>
        <Text style={styles.valuesLabel}>Values:</Text>
        <View style={styles.valuesList}>
          {item.values.map((value, index) => (
            <View key={index} style={styles.valueChip}>
              <Text style={styles.valueText}>{value.name}</Text>
            </View>
          ))}
        </View>
      </View>
      
      {item.isDefault && (
        <Text style={styles.defaultLabel}>Default Dimension</Text>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000000" />
        <Text style={styles.loadingText}>Loading day dimensions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {dimensions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No day dimensions found</Text>
          <Text style={styles.emptySubtext}>Create your first dimension to get started</Text>
        </View>
      ) : (
        <FlatList
          data={dimensions}
          renderItem={renderDimensionItem}
          keyExtractor={(item) => item._id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
        <Text style={styles.addButtonText}>+ Add Dimension</Text>
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
              {editingDimension ? 'Edit Dimension' : 'New Dimension'}
            </Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Dimension Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter dimension name"
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
              <Text style={styles.label}>Dimension Values *</Text>
              {formData.values.map((value, index) => (
                <View key={index} style={styles.valueInputContainer}>
                  <View style={styles.valueInputs}>
                    <TextInput
                      style={[styles.input, styles.valueNameInput]}
                      value={value.name}
                      onChangeText={(text) => updateValue(index, 'name', text)}
                      placeholder={`Value ${index + 1} name`}
                      placeholderTextColor="#94a3b8"
                    />
                    <TextInput
                      style={[styles.input, styles.valueDescInput]}
                      value={value.description}
                      onChangeText={(text) => updateValue(index, 'description', text)}
                      placeholder="Description (optional)"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  {formData.values.length > 1 && (
                    <TouchableOpacity
                      style={styles.removeValueButton}
                      onPress={() => removeValue(index)}
                    >
                      <Text style={styles.removeValueText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
              
              <TouchableOpacity style={styles.addValueButton} onPress={addValue}>
                <Text style={styles.addValueText}>+ Add Value</Text>
              </TouchableOpacity>
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
  dimensionItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dimensionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dimensionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
  },
  dimensionActions: {
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
  dimensionDescription: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 12,
    lineHeight: 20,
  },
  valuesContainer: {
    marginBottom: 8,
  },
  valuesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  valuesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  valueChip: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  valueText: {
    fontSize: 12,
    color: '#000000',
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
  valueInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  valueInputs: {
    flex: 1,
    gap: 8,
  },
  valueNameInput: {
    marginBottom: 0,
  },
  valueDescInput: {
    marginBottom: 0,
  },
  removeValueButton: {
    backgroundColor: '#ef4444',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginTop: 8,
  },
  removeValueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  addValueButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  addValueText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DayDimensionsScreen; 