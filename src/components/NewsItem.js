import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const NewsItem = ({ item }) => {
  // Format date to "DD/MM/YYYY, hh:mm AM/PM"
  const formatDateTime = timestamp => {
    const date = new Date(
      timestamp.seconds ? timestamp.seconds * 1000 : timestamp,
    );

    // Use Intl.DateTimeFormat to format the date to "DD/MM/YYYY, hh:mm AM/PM"
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
    };

    // Return formatted date string
    return new Intl.DateTimeFormat('en-GB', options).format(date);
  };

  return (
    <>
      <View>
        <Text style={styles.publishInfo}>
          {formatDateTime(item.timestamp)}
        </Text>
      </View>
      <View style={{ marginTop: 8, backgroundColor: '#D3D3D3', padding: 10, borderRadius: 10 }}>
        <Text style={styles.boxText}>{item.description}</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  boxText: {
    fontSize: 22,
    color: 'black',
    fontWeight: '500',
  },
  publishInfo: {
    fontSize: 12,
    color: 'grey',
    marginTop: 10,
  },
});

export default NewsItem;
