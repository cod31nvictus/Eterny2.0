import React from 'react';
import { View, StyleSheet } from 'react-native';

interface DateTimePickerProps {
  value: Date;
  mode?: 'date' | 'time' | 'datetime';
  onChange: (event: any, selectedDate?: Date) => void;
  style?: any;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({ 
  value, 
  mode = 'date', 
  onChange, 
  style 
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const target = event.target as HTMLInputElement;
    const newDate = new Date(target.value);
    onChange(event, newDate);
  };

  const formatValue = () => {
    if (mode === 'time') {
      return value.toTimeString().slice(0, 5);
    } else if (mode === 'datetime') {
      return value.toISOString().slice(0, 16);
    } else {
      return value.toISOString().slice(0, 10);
    }
  };

  const getInputType = () => {
    switch (mode) {
      case 'time':
        return 'time';
      case 'datetime':
        return 'datetime-local';
      default:
        return 'date';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <input
        type={getInputType()}
        value={formatValue()}
        onChange={handleChange}
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 8,
  },
  input: {
    border: 'none',
    outline: 'none',
    fontSize: 16,
    padding: 4,
    width: '100%',
  } as any,
});

export default DateTimePicker; 