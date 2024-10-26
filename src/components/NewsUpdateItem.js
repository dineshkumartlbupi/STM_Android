import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {faEdit, faTrash} from '@fortawesome/free-solid-svg-icons';

const NewsUpdateItem = ({ item, onEdit, onDelete,isAdmin }) => {
  const renderFileContent = () => {
    // Check if the file exists and is of type 'image'
    if (item.file && item.file.type === 'image' && item.file.url) {
      return <Image source={{ uri: item.file.url }} style={styles.itemImage} />;
    }
    // If the file is not an image or does not exist, return null or some placeholder
    return <Text style={styles.noImageText}>No Image Available</Text>;
  };

  const formatDateTime = (timestamp) => {
    // Convert the timestamp to milliseconds if it's in seconds
    const date = new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
  
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    };
  
    return date.toLocaleDateString(undefined, options);
  };
  return (
    <View style={styles.itemContainer}>
      {/* {renderFileContent()} */}
      <View style={styles.contentContainer}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <TouchableOpacity onPress={() => {
          // Linking.openURL(item.link)
        }}>
          <Text style={styles.itemLink}>Read more</Text>
        </TouchableOpacity>
        <Text style={styles.publishInfo}>
          Published on: {formatDateTime(item.timestamp)}
        </Text>
      </View>
      {isAdmin && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={styles.actionButton}>
            <FontAwesomeIcon icon={faEdit} size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(item)}
            style={styles.actionButton}>
            <FontAwesomeIcon icon={faTrash} size={18} color="white" />
          </TouchableOpacity>
        </View>
      )}
      
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'lightgrey',
    padding: 15,
    marginBottom:8,
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
  },
  noImageText: {
    fontSize: 14,
    color: 'grey',
    textAlign: 'center',
    marginVertical: 10,
  },
  contentContainer: {
    marginBottom: 40,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
  },
  itemDescription: {
    fontSize: 14,
    color: 'black',
    marginVertical: 5,
  },
  itemLink: {
    fontSize: 14,
    color: 'blue',
  },
  publishInfo: {
    fontSize: 12,
    color: 'grey',
    marginTop: 10,
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 5,
    padding: 5,
    marginLeft: 5,
  },
});
export default NewsUpdateItem;
