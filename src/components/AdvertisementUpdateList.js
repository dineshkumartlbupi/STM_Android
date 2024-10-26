import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import AdvertisementUpdateItem from './AdvertisementItem';

const AdvertisementUpdateList = ({ advertisementList }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef(null);

  // Scroll to next or previous post
  const scrollToNext = () => {
    if (currentIndex < advertisementList.length - 1) {
      scrollViewRef.current.scrollTo({ x: (currentIndex + 1) * 360, animated: true });
      setCurrentIndex(currentIndex + 1);
    }
  };

  const scrollToPrevious = () => {
    if (currentIndex > 0) {
      scrollViewRef.current.scrollTo({ x: (currentIndex - 1) * 360, animated: true });
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <View style={styles.container}>
      {/* Scrollable list of posts */}
      <ScrollView
        horizontal
        pagingEnabled
        ref={scrollViewRef}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / 360); // Adjust width as per item
          setCurrentIndex(index);
        }}
        contentContainerStyle={styles.scrollContainer}>
        {advertisementList.map((item, index) => (
          <View key={index} style={styles.itemWrapper}>
            <AdvertisementUpdateItem item={item} />
          </View>
        ))}
      </ScrollView>

      {/* Left and Right Arrows for navigation */}
      {currentIndex > 0 && (
        <TouchableOpacity style={styles.leftArrow} onPress={scrollToPrevious}>
          <FontAwesomeIcon icon={faChevronLeft} size={20} color="white" />
        </TouchableOpacity>
      )}
      {currentIndex < advertisementList.length - 1 && (
        <TouchableOpacity style={styles.rightArrow} onPress={scrollToNext}>
          <FontAwesomeIcon icon={faChevronRight} size={20} color="white" />
        </TouchableOpacity>
      )}

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {advertisementList.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor:'#fff',
    position: 'relative',
    paddingVertical: 10,
  },
  scrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemWrapper: {
    width: 340, // Adjust to the width of your post item
    marginHorizontal: 10,
    backgroundColor:"#fff"
  },
  // Arrow buttons
  leftArrow: {
    position: 'absolute',
    top: '45%',
    left: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 15,
    zIndex: 1,
  },
  rightArrow: {
    position: 'absolute',
    top: '45%',
    right: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    borderRadius: 15,
    zIndex: 1,
  },
  // Pagination dots
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#1E90FF',
  },
  inactiveDot: {
    backgroundColor: '#ccc',
  },
});

export default AdvertisementUpdateList;
