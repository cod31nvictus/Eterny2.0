import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { DayDimension, TemplateDimensionValue, CreateTemplateForm } from '../types';
import { api } from '../services/api';

interface CreateTemplateScreenProps {
  navigation: any;
  route: any;
}

const CreateTemplateScreen: React.FC<CreateTemplateScreenProps> = ({ navigation, route }) => {
  const [dimensions, setDimensions] = useState<DayDimension[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<CreateTemplateForm, 'timeBlocks'>>({
    name: '',
    description: '',
    dimensionValues: [],
    tags: [],
  });

  const editingTemplate = route?.params?.template;

  useEffect(() => {
    fetchDimensions();
    
    // If editing, populate form data
    if (editingTemplate) {
      setFormData({
        name: editingTemplate.name,
        description: editingTemplate.description || '',
        dimensionValues: editingTemplate.dimensionValues,
        tags: editingTemplate.tags,
      });
    }
  }, [editingTemplate]);

  const fetchDimensions = async () => {
    try {
      setLoading(true);
      const dimensionsData = await api.dimensions.getAll();
      setDimensions(dimensionsData);
    } catch (error) {
      console.error('Failed to fetch dimensions:', error);
      Alert.alert('Error', 'Failed to load day dimensions');
    } finally {
      setLoading(false);
    }
  };

  const handleDimensionValueSelect = (dimensionId: string, valueId: string, valueName: string) => {
    const existingIndex = formData.dimensionValues.findIndex(
      dv => dv.dimensionId === dimensionId
    );

    const newDimensionValue: TemplateDimensionValue = {
      dimensionId,
      valueId,
      valueName,
    };

    if (existingIndex >= 0) {
      // Replace existing value for this dimension
      const updatedValues = [...formData.dimensionValues];
      updatedValues[existingIndex] = newDimensionValue;
      setFormData({ ...formData, dimensionValues: updatedValues });
    } else {
      // Add new dimension value
      setFormData({
        ...formData,
        dimensionValues: [...formData.dimensionValues, newDimensionValue],
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Template name is required');
      return;
    }

    try {
      setSubmitting(true);

      const templateData: CreateTemplateForm = {
        ...formData,
        timeBlocks: [], // Empty time blocks for step 1
      };

      let savedTemplate;
      if (editingTemplate) {
        // Update existing template (dimensions only)
        savedTemplate = await api.templates.update(editingTemplate._id, templateData);
      } else {
        // Create new template
        savedTemplate = await api.templates.create(templateData);
      }

      // Navigate to time blocks screen (Step 2)
      navigation.navigate('EditTimeBlocks', { 
        template: savedTemplate,
        isNewTemplate: !editingTemplate 
      });

    } catch (error) {
      console.error('Failed to save template:', error);
      Alert.alert('Error', 'Failed to save template');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading dimensions...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {editingTemplate ? 'Edit Template Info' : 'Create Template'}
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || !formData.name.trim()}
        >
          <Text style={[
            styles.nextText,
            (!formData.name.trim() || submitting) && styles.nextTextDisabled
          ]}>
            {submitting ? 'Saving...' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Template Name *</Text>
          <TextInput
            style={styles.formInput}
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
            placeholder="Enter template name"
            autoFocus={!editingTemplate}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Description (Optional)</Text>
          <TextInput
            style={[styles.formInput, styles.formTextArea]}
            value={formData.description}
            onChangeText={(text) => setFormData({ ...formData, description: text })}
            placeholder="Enter description"
            multiline
            numberOfLines={3}
          />
        </View>

        {dimensions.length > 0 && (
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>Day Dimensions</Text>
            <Text style={styles.formSubLabel}>
              Select values that describe this type of day
            </Text>
            
            {dimensions.map((dimension) => (
              <View key={dimension._id} style={styles.dimensionGroup}>
                <Text style={styles.dimensionLabel}>{dimension.name}</Text>
                {dimension.description && (
                  <Text style={styles.dimensionDescription}>{dimension.description}</Text>
                )}
                <View style={styles.dimensionValues}>
                  {dimension.values.map((value) => {
                    const isSelected = formData.dimensionValues.some(
                      dv => dv.dimensionId === dimension._id && dv.valueId === value._id
                    );
                    
                    return (
                      <TouchableOpacity
                        key={value._id}
                        style={[
                          styles.dimensionValueChip,
                          isSelected && styles.dimensionValueChipSelected
                        ]}
                        onPress={() => handleDimensionValueSelect(
                          dimension._id,
                          value._id,
                          value.name
                        )}
                      >
                        <Text style={[
                          styles.dimensionValueText,
                          isSelected && styles.dimensionValueTextSelected
                        ]}>
                          {value.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>Next Step</Text>
          <Text style={styles.infoText}>
            After saving the template info, you'll be able to add time blocks and activities to create your daily schedule.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  cancelText: {
    fontSize: 16,
    color: '#64748b',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
  },
  nextText: {
    fontSize: 16,
    color: '#6366f1',
    fontWeight: '600',
  },
  nextTextDisabled: {
    color: '#94a3b8',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  formSubLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  formInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    fontSize: 16,
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dimensionGroup: {
    marginBottom: 20,
  },
  dimensionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  dimensionDescription: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 8,
  },
  dimensionValues: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dimensionValueChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dimensionValueChipSelected: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  dimensionValueText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  dimensionValueTextSelected: {
    color: '#fff',
  },
  infoBox: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369a1',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#0369a1',
    lineHeight: 20,
  },
});

export default CreateTemplateScreen; 