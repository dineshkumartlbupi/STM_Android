import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; 
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import Video from 'react-native-video';

const AdvertisementUpdateItem = ({ item, onEdit, onDelete, isAdmin }) => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(null);
  const [aspectRatio, setAspectRatio] = useState(16 / 9); // Default aspect ratio

  useFocusEffect(
    useCallback(() => {
      return () => {
        setActiveVideoIndex(null); // Pause all videos when screen loses focus
      };
    }, [])
  );

  const renderMediaItem = ({ item: file, index }) => {
    if (file.type === 'video') {
      const isPlaying = activeVideoIndex === index;

      return (
        <TouchableOpacity
          onPress={() => setActiveVideoIndex(isPlaying ? null : index)}
          style={styles.videoContainer}
        >
          <Video
            source={{ uri: file.url }}
            style={[styles.video, { aspectRatio }]}
            paused={!isPlaying}
            controls={true}
            resizeMode="contain"
            onLoad={(data) => {
              const videoAspectRatio = data.naturalSize.width / data.naturalSize.height;
              setAspectRatio(videoAspectRatio);
            }}
            onError={(error) => console.log('Error loading video:', error)}
          />
          {/* {!isPlaying && (
            <View style={styles.playButtonOverlay}>
              <Text style={styles.playButtonText}>▶</Text>
            </View>
          )} */}
        </TouchableOpacity>
      );
    } else {
      return (
        <Image
          source={{ uri: file.url }}
          style={styles.image}
          onError={() => console.log('Error loading image')}
          resizeMode="contain"
        />
      );
    }
  };

  const handleLinkPress = () => {
    if (item.hyperlink) {
      Linking.openURL(item.hyperlink).catch((err) =>
        console.error('Failed to open link:', err)
      );
    }
  };

  const hasFiles = item.files && item.files.length > 0;

  return (
    <View style={styles.container}>
      {item.description && (
        <View style={styles.textContainer}>
          <Text style={styles.descriptionText}>{item.description}</Text>
        </View>
      )}

      {hasFiles ? (
        <FlatList
          data={item.files}
          renderItem={renderMediaItem}
          keyExtractor={(file) => file.url}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mediaListContainer}
        />
      ) : item.hyperlink ? (
        <View style={styles.textContainer}>
          <TouchableOpacity onPress={handleLinkPress}>
            <Text style={styles.hyperlinkText}>Click to Watch Video</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.noMediaContainer}>
          <Text style={styles.noMediaText}>No Media Available</Text>
        </View>
      )}

      {isAdmin && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            onPress={() => onEdit(item)}
            style={styles.actionButton}
          >
            <FontAwesomeIcon icon={faEdit} size={18} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDelete(item)}
            style={styles.actionButton}
          >
            <FontAwesomeIcon icon={faTrash} size={18} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '95%',
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 8,
    padding: 5,
  },
  videoContainer: {
    width: 330,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: 'black',
  },
  video: {
    width: '100%',
    height: undefined, // Keep height undefined to maintain aspect ratio
  },
  image: {
    width: 330,
    height: 180,
    borderRadius: 5,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  playButtonText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
  },
  noMediaContainer: {
    width: '100%',
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  noMediaText: {
    fontSize: 14,
    color: '#888',
  },
  textContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  hyperlinkText: {
    fontSize: 14,
    color: '#1E90FF',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  actionsContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 5,
    padding: 5,
    marginLeft: 5,
  },
  mediaListContainer: {
    alignItems: 'center',
  },
});

export default AdvertisementUpdateItem;
