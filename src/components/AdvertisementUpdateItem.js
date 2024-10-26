import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faEdit, faTrash} from '@fortawesome/free-solid-svg-icons';
import Video from 'react-native-video';
const AdvertisementUpdateItem = ({item, onEdit, onDelete, isAdmin}) => {
  const renderImageItem = ({item: file}) => {
    if (file.type === 'video') {
      return (
        <Video
          source={{uri: file.url}}
          style={styles.itemMedia}
          controls={true} // Allows user to play/pause the video
          resizeMode="cover"
          onError={error => console.log('Error loading video:', error)}
        />
      );
    } else {
      return (
        <Image
          source={{uri: file.url}}
          style={styles.itemImage}
          onError={() => console.log('Error loading image')}
          resizeMode="cover"
        />
      );
    }
  };

  return (
    <View style={styles.container}>
      {item.files && item.files.length > 0 ? (
        <FlatList
          data={item.files}
          renderItem={renderImageItem}
          keyExtractor={file => file.url}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.imageListContainer}
        />
      ) : (
        <View style={styles.noImageContainer}>
          <Text style={styles.noImageText}>No Image Available</Text>
        </View>
      )}
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
  itemMedia: {
    width: 360, // Adjust the width of each media item
    height: 180, // Set height to match the container
    borderRadius: 5,
  },
  container: {
    width: '100%', // Ensure the container takes the full width
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#fff',
    height: 180,
    marginBottom: 8,
  },
  itemImage: {
    width: 360, // Adjust the width of each image (or use '100%' to take full width)
    height: 180,
    borderRadius: 5,
  },
  noImageContainer: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  noImageText: {
    fontSize: 14,
    color: '#888',
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
  imageListContainer: {
    alignItems: 'center',
  },
});

export default AdvertisementUpdateItem;
