import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet } from 'react-native';
import CalendarPicker from 'react-native-calendar-picker';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faFilterCircleXmark } from '@fortawesome/free-solid-svg-icons';

const DateFilter = ({ onApplyFilter }) => {
  const [isCalendarVisible, setCalendarVisibility] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);

  const showCalendar = () => {
    setCalendarVisibility(true);
  };

  const hideCalendar = () => {
    setCalendarVisibility(false);
    setSelectedStartDate(null);
    setSelectedEndDate(null);

  };

  const onDateChange = (date, type) => {
    if (type === 'START_DATE') {
      setSelectedStartDate(date);
      setSelectedEndDate(null); // Reset end date when new start date is selected
    } else {
      setSelectedEndDate(date);
    }
  };

  const handleApplyFilter = () => {
    if (selectedStartDate && selectedEndDate) {
      onApplyFilter(selectedStartDate, selectedEndDate);
    } else if (selectedStartDate) {
      onApplyFilter(selectedStartDate, selectedStartDate); // If only startDate is selected
    }
    hideCalendar();
  };

  return (
    <View>
      <TouchableOpacity onPress={showCalendar} style={styles.searchButton}>
        <View style={{ alignItems: 'center', justifyContent: 'center', }}>
          <FontAwesomeIcon icon={faFilterCircleXmark} size={12} color="green" />
          <Text style={styles.resetButtonText}>Filter</Text>
        </View>
      </TouchableOpacity>

      <Modal visible={isCalendarVisible} transparent={true} animationType="slide">
        <View style={styles.calendarContainer}>
          <CalendarPicker
            onDateChange={onDateChange}
            allowRangeSelection={true}
            selectedStartDate={selectedStartDate}
            selectedEndDate={selectedEndDate}
          />
          <TouchableOpacity onPress={handleApplyFilter} style={styles.applyButton}>
            <Text style={styles.applyButtonText}>Apply Filter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={hideCalendar} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  searchButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderWidth: 1,
    borderColor: '#A7A6BA',
    borderRadius: 5,
    marginLeft: 9,
    right: 3,
    height: 34,
  },
  filterButton: {
    backgroundColor: '#008CBA',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  calendarContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
    marginLeft: 8,
    marginRight: 8,
    borderRadius: 8,
  },
  applyButton: {
    backgroundColor: '#008CBA',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  resetButtonText: {
    fontSize: 10,
    fontWeight: '400',
    color: 'green',
  },
});

export default DateFilter;
