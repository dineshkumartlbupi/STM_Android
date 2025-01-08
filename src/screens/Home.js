import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  BackHandler,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faEdit,
  faFilterCircleXmark,
  faSearch,
  faTrash,
  faL,
  faEnvelope,
  faFolder,
} from '@fortawesome/free-solid-svg-icons';
import {ScrollView} from 'react-native-gesture-handler';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import NewsItem from '../components/NewsItem';
import LatestItem from '../components/LatestItem';
import DateFilter from '../components/DateFilter';
import AdvertisementUpdateList from '../components/AdvertisementUpdateList';
import debounce from 'lodash.debounce';
const Home = () => {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const [latestUpdateList, setLatestUpdateList] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [advertisementList, setAdvertisementList] = useState([]);
  const [filteredLatestUpdateList, setFilteredLatestUpdateList] = useState([]);
  const [filteredNewsList, setFilteredNewsList] = useState([]);
  const [filteredAdvertisementList, setFilteredAdvertisementList] = useState(
    [],
  );
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [exitAlertShown, setExitAlertShown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const handleBackPress = () => {
        if (exitAlertShown) {
          BackHandler.exitApp();
          return false;
        }

        setExitAlertShown(true);
        Alert.alert(
          'Exit App',
          'Press OK to exit or Cancel to stay',
          [
            {
              text: 'OK',
              onPress: () => BackHandler.exitApp(),
            },
            {
              text: 'Cancel',
              onPress: () => setExitAlertShown(false),
            },
          ],
          {cancelable: true},
        );
        setTimeout(() => setExitAlertShown(false), 2000);
        return true;
      };
      BackHandler.addEventListener('hardwareBackPress', handleBackPress);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
      };
    }, [exitAlertShown]),
  );

  const handleResetFilter = () => {
    setFromDate(null);
    setToDate(null);
    setFilteredLatestUpdateList(latestUpdateList);
    setFilteredNewsList(newsList);
    setFilteredAdvertisementList(advertisementList);
    setIsFilterActive(false);
  };

  const setupPostListener = async (
    setLoading,
    setLatestUpdateList,
    setNewsList,
    setAdvertisementList,
    fromDate,
    toDate,
  ) => {
    try {
      setLoading(true);
      const isAdmin = await checkIfAdmin();
      const userPackages = await fetchUserPackages();

      let query;
      const postsCollection = firestore().collection('post');

      if (isAdmin) {
        query = postsCollection.orderBy('timestamp', 'desc');
      } else {
        if (!userPackages || userPackages.length === 0) {
          console.warn('No packages found for the user');
          setLoading(false);
          return;
        } else {
          query = postsCollection
            .where('packages', 'array-contains-any', userPackages)
            .orderBy('timestamp', 'desc');
        }
      }

      // Set up the listener
      const unsubscribe = query.onSnapshot(querySnapshot => {
        const latestUpdates = [];
        const news = [];
        const advertisements = [];

        // Ensure fromDate and toDate are Date objects, and adjust toDate to the end of the day
        const adjustedFromDate = fromDate ? new Date(fromDate) : null;
        const adjustedToDate = toDate ? new Date(toDate) : null;

        if (adjustedToDate) {
          adjustedToDate.setHours(23, 59, 59, 999); // Set to the end of the day
        }

        querySnapshot.forEach(documentSnapshot => {
          const data = documentSnapshot.data();
          const timestamp = data.timestamp.toDate();

          if (data && data.category) {
            let withinDateRange = true;

            // Log date information for debugging
            console.log('Document ID:', documentSnapshot.id);
            console.log('Timestamp:', timestamp);
            if (adjustedFromDate) console.log('From Date:', adjustedFromDate);
            if (adjustedToDate) console.log('To Date:', adjustedToDate);

            // Check date conditions based on fromDate and toDate
            if (adjustedFromDate && adjustedToDate) {
              withinDateRange =
                timestamp >= adjustedFromDate && timestamp <= adjustedToDate;
            } else if (adjustedFromDate && !adjustedToDate) {
              withinDateRange = timestamp >= adjustedFromDate;
            } else if (!adjustedFromDate && adjustedToDate) {
              withinDateRange = timestamp <= adjustedToDate;
            }

            // If data is within the date range, categorize it
            if (withinDateRange) {
              switch (data.category) {
                case 'latest_updates':
                  latestUpdates.push(data);
                  break;
                case 'news':
                  news.push(data);
                  break;
                case 'advertisement':
                  advertisements.push(data);
                  break;
                default:
                  console.warn(`Unknown category: ${data.category}`);
                  break;
              }
            }
          } else {
            console.warn(
              'Document missing required fields:',
              documentSnapshot.id,
            );
          }
        });

        // Update the UI with filtered data
        setLoading(false);
        setLatestUpdateList(latestUpdates);
        setNewsList(news);
        setAdvertisementList(advertisements);
      });

      return unsubscribe;
    } catch (error) {
      setLoading(false);
      console.error('Error setting up listener:', error);
      Alert.alert(
        'Error',
        'Failed to set up real-time listener. Please try again.',
      );
    }
  };

  const checkIfAdmin = async () => {
    return (
      (auth().currentUser &&
        auth().currentUser.phoneNumber === '+918790720978') ||
      auth().currentUser.phoneNumber === '+919052288377' ||
      auth().currentUser.phoneNumber === '+918853389395' ||
      auth().currentUser.phoneNumber === '+919455791624' ||
      auth().currentUser.phoneNumber === '+919839204763' ||
      auth().currentUser.phoneNumber === '+917022863475' // New Admin phone number
    );
  };

  const fetchUserPackages = async () => {
    const phoneNumber = auth().currentUser.phoneNumber;
    try {
      setLoading(true);
      const usersCollection = firestore().collection('users');
      const packageSet = new Set();
      const cleanedPhoneNumber = phoneNumber.replace('+91', '');

      const querySnapshot = await usersCollection
        .where('phoneNumber', '==', cleanedPhoneNumber)
        .get();

      querySnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.packages) {
          Object.keys(userData.packages).forEach(packageId => {
            packageSet.add(packageId);
          });
        }
      });
      setLoading(false);
      const uniquePackages = Array.from(packageSet).map(pkg => Number(pkg)); // Convert to numbers
      console.log('Unique Packages:', uniquePackages); // Ensure they are numbers
      return uniquePackages;
    } catch (error) {
      setLoading(false);
      console.error('Error fetching packages:', error);
      Alert.alert('Error', 'Failed to fetch packages. Please try again.');
      return [];
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let unsubscribe;

      const initializeListener = async () => {
        unsubscribe = await setupPostListener(
          setLoading,
          setLatestUpdateList,
          setNewsList,
          setAdvertisementList,
          fromDate,
          toDate,
        );
      };

      initializeListener();

      return () => {
        if (unsubscribe && typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }, [fromDate, toDate]),
  );

  useEffect(() => {
    const filterDataBySearch = list => {
      return list.filter(item =>
        item.description.toLowerCase().includes(search.toLowerCase()),
      );
    };

    setFilteredLatestUpdateList(filterDataBySearch(latestUpdateList));
    setFilteredNewsList(filterDataBySearch(newsList));
    setFilteredAdvertisementList(filterDataBySearch(advertisementList));
  }, [search, latestUpdateList, newsList, advertisementList]);

  const applyDateFilter = () => {
    const filteredLatest = latestUpdateList.filter(item => {
      const itemDate = item.timestamp.toDate();
      console.log('itemDate : ', itemDate);
      console.log('from date', fromDate);
      console.log('toDate : ', toDate);
      return (
        (!fromDate || itemDate >= fromDate) &&
        (!toDate ||
          itemDate <= toDate ||
          itemDate.getTime() === toDate.getTime())
      );
    });

    const filteredNews = newsList.filter(item => {
      const itemDate = item.timestamp.toDate();
      return (
        (!fromDate || itemDate >= fromDate) &&
        (!toDate ||
          itemDate <= toDate ||
          itemDate.getTime() === toDate.getTime())
      );
    });

    const filteredAdvertisements = advertisementList.filter(item => {
      const itemDate = item.timestamp.toDate();
      return (
        (!fromDate || itemDate >= fromDate) &&
        (!toDate ||
          itemDate <= toDate ||
          itemDate.getTime() === toDate.getTime())
      );
    });

    setFilteredLatestUpdateList(filteredLatest);
    setFilteredNewsList(filteredNews);
    setFilteredAdvertisementList(filteredAdvertisements);
  };

  const handleApplyFilter = (fromDate, toDate) => {
    console.log('fromDate :: ', fromDate);
    console.log('toDate:: ', toDate);
    setFromDate(fromDate);
    setToDate(toDate);
    // applyDateFilter();
    setIsFilterActive(true);
  };

  const handleEditLatestUpdate = () => {
    navigation.navigate('ShowAllUpdates', {flag: 'latest_updates'});
  };

  const handleDeleteLatestUpdate = item => {
    navigation.navigate('ShowAllUpdates', {flag: 'latest_updates'});
  };

  const handleEditLatestNews = item => {
    navigation.navigate('ShowAllUpdates', {flag: 'news'});
  };
  const handleDeleteLatestNews = item => {
    navigation.navigate('ShowAllUpdates', {flag: 'news'});
  };

  const handleEditLatestAdvirtaisement = item => {
    navigation.navigate('ShowAllUpdates', {flag: 'advertisement'});
  };
  const handleDeleteLatestAdvertisement = item => {
    navigation.navigate('ShowAllUpdates', {flag: 'advertisement'});
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <ImageBackground
              source={require('../assets/user.png')}
              style={{
                width: 30,
                height: 30,
                alignSelf: 'flex-start', // Align to the start of the row
                marginRight: 10, // Optional: space between image and text
              }}
              imageStyle={{borderRadius: 15}} // Adjusted for better visibility
            />
          </TouchableOpacity>
          <Text style={{fontSize: 16, color: 'black', fontWeight: '600'}}>
            Profile
          </Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.updatesText}>Sathwika Trade Media</Text>
          <Text
            style={{
              fontSize: 12,
              color: 'blue',
              alignSelf: 'flex-end',
              fontWeight: '600',
            }}>
            7799062722
          </Text>
        </View>
      </View>

      <View style={styles.boxContainer}>
        <View style={[styles.updateBox, styles.box1]}>
          <View style={{height: 34, flexDirection: 'row', marginBottom: 2}}>
            <View style={styles.textInputContainerForSearch}>
              <TextInput
                style={styles.textInputForSearch}
                placeholder="Search for information."
                placeholderTextColor="black"
                onChangeText={setSearch}
                value={search}
              />
            </View>
            {isFilterActive ? (
              <TouchableOpacity onPress={handleResetFilter}>
                <View style={styles.resetButton}>
                  <FontAwesomeIcon
                    icon={faFilterCircleXmark}
                    size={12}
                    color="red"
                  />
                  <Text style={styles.resetButtonText}>Reset</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <DateFilter onApplyFilter={handleApplyFilter} />
            )}
          </View>
          <View
            style={{
              paddingHorizontal: 10,
              backgroundColor: 'black',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: 'white',
                alignSelf: 'center',
              }}>
              Latest Updates
            </Text>
            {auth().currentUser &&
              (auth().currentUser.phoneNumber === '+918790720978' ||
                auth().currentUser.phoneNumber === '+919052288377' ||
                auth().currentUser.phoneNumber === '+917022863475' ||
                auth().currentUser.phoneNumber === '+919455791624' ||
                auth().currentUser.phoneNumber === '+919839204763' ||
                auth().currentUser.phoneNumber === '+918853389395') && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                  }}>
                  <TouchableOpacity onPress={handleEditLatestUpdate}>
                    <View style={{flexDirection: 'row'}}>
                      <Text
                        style={{
                          fontSize: 12,
                          color: 'white',
                          marginRight: 10,
                          fontWeight: '500',
                        }}>
                        Edit
                      </Text>
                      <FontAwesomeIcon icon={faEdit} size={12} color="white" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleDeleteLatestUpdate}>
                    <View style={{flexDirection: 'row'}}>
                      <Text
                        style={{
                          fontSize: 12,
                          color: 'white',
                          marginRight: 10,
                          marginLeft: 10,
                          fontWeight: '500',
                        }}>
                        Delete
                      </Text>
                      <FontAwesomeIcon icon={faTrash} size={12} color="white" />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
          </View>
          <ScrollView showsVerticalScrollIndicator={true}>
            {filteredLatestUpdateList.map((item, index) => {
              return <LatestItem key={index} item={item} />;
            })}
          </ScrollView>
        </View>

        <View style={[styles.updateBox, styles.box2]}>
          <View
            style={{
              paddingHorizontal: 10,
              backgroundColor: 'blue',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 16, fontWeight: '800', color: 'white'}}>
              News
            </Text>
            {auth().currentUser &&
              (auth().currentUser.phoneNumber === '+918790720978' ||
                auth().currentUser.phoneNumber === '+919052288377' ||
                auth().currentUser.phoneNumber === '+917022863475' ||
                auth().currentUser.phoneNumber === '+919455791624' ||
                auth().currentUser.phoneNumber === '+919839204763' ||
                auth().currentUser.phoneNumber === '+918853389395') && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                  }}>
                  <TouchableOpacity onPress={handleEditLatestNews}>
                    <View style={{flexDirection: 'row'}}>
                      <Text
                        style={{
                          fontSize: 12,
                          color: 'white',
                          marginRight: 10,
                          fontWeight: '500',
                        }}>
                        Edit
                      </Text>
                      <FontAwesomeIcon icon={faEdit} size={12} color="white" />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDeleteLatestNews}>
                    <View style={{flexDirection: 'row'}}>
                      <Text
                        style={{
                          fontSize: 12,
                          color: 'white',
                          marginRight: 10,
                          marginLeft: 10,
                          fontWeight: '500',
                        }}>
                        Delete
                      </Text>
                      <FontAwesomeIcon icon={faTrash} size={12} color="white" />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
          </View>
          <ScrollView showsVerticalScrollIndicator={true}>
            {filteredNewsList.map((item, index) => {
              return <NewsItem key={index} item={item} />;
            })}
          </ScrollView>
        </View>

        <View style={[styles.updateBox, styles.box3]}>
          <View
            style={{
              paddingHorizontal: 10,
              backgroundColor: 'green',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            <Text style={{fontSize: 16, fontWeight: '800', color: 'white'}}>
              Advertisement
            </Text>
            {auth().currentUser &&
              (auth().currentUser.phoneNumber === '+918790720978' ||
                auth().currentUser.phoneNumber === '+919052288377' ||
                auth().currentUser.phoneNumber === '+917022863475' ||
                auth().currentUser.phoneNumber === '+919455791624' ||
                auth().currentUser.phoneNumber === '+919839204763' ||
                auth().currentUser.phoneNumber === '+918853389395') && (
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                  <TouchableOpacity onPress={handleEditLatestAdvirtaisement}>
                    <View style={{flexDirection: 'row'}}>
                      <Text
                        style={{
                          fontSize: 12,
                          color: 'white',
                          marginRight: 10,
                          fontWeight: '500',
                        }}>
                        Edit
                      </Text>
                      <FontAwesomeIcon icon={faEdit} size={12} color="white" />
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleDeleteLatestAdvertisement}>
                    <View style={{flexDirection: 'row'}}>
                      <Text
                        style={{
                          fontSize: 12,
                          color: 'white',
                          marginRight: 10,
                          marginLeft: 10,
                          fontWeight: '500',
                        }}>
                        Delete
                      </Text>
                      <FontAwesomeIcon icon={faTrash} size={12} color="white" />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
          </View>
          <ScrollView
            horizontal={true}
            showsHorizontalScrollIndicator={true}
            contentContainerStyle={styles.scrollContainer}>
            {filteredAdvertisementList.map((item, index) => (
              <View key={index} style={styles.itemWrapper}>
                <AdvertisementUpdateList
                  advertisementList={filteredAdvertisementList}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>

      {auth().currentUser &&
        (auth().currentUser.phoneNumber === '+918790720978' ||
          auth().currentUser.phoneNumber === '+919052288377' ||
          auth().currentUser.phoneNumber === '+917022863475' ||
          auth().currentUser.phoneNumber === '+919455791624' ||
          auth().currentUser.phoneNumber === '+919839204763' ||
          auth().currentUser.phoneNumber === '+918853389395') && (
          <TouchableOpacity
            style={styles.postButton}
            onPress={() => navigation.navigate('CreatePost')}
            activeOpacity={0.8}>
            <FontAwesomeIcon icon={faEnvelope} size={20} color="#fff" />
          </TouchableOpacity>
        )}

      {auth().currentUser &&
        (auth().currentUser.phoneNumber === '+918790720978' ||
          auth().currentUser.phoneNumber === '+919052288377' ||
          auth().currentUser.phoneNumber === '+917022863475' ||
          auth().currentUser.phoneNumber === '+919455791624' ||
          auth().currentUser.phoneNumber === '+919839204763' ||
          auth().currentUser.phoneNumber === '+918853389395') && (
          <TouchableOpacity
            style={styles.packageButton}
            onPress={() => navigation.navigate('AdminPackageManagement')}
            activeOpacity={0.8}>
            <FontAwesomeIcon icon={faFolder} size={20} color="#fff" />
          </TouchableOpacity>
        )}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scrollContainer: {
    flexDirection: 'row',
  },
  itemWrapper: {
    height: 'auto',
    width: 360,
    marginRight: 8,
  },
  scrollViewContainer: {
    flexGrow: 1,
    paddingBottom: 65,
  },
  container: {
    flex: 1,
    padding: 5,
    backgroundColor: '#ADD8E6',
  },
  container: {
    flex: 1,
    padding: 5,
    backgroundColor: '#ADD8E6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Aligns items to the start
    marginBottom: 10,
  },
  textContainer: {
    alignItems: 'center', // Center text in the middle of its container
  },
  updatesText: {
    fontSize: 14, // Adjust as needed
    textAlign: 'center', // Center text within its container
    color: 'black',
    fontWeight: '600',
  },

  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 12,
    fontWeight: '800',
    color: 'black',
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 3,
    width: 80,
  },
  dropdownText: {
    fontSize: 14,
    color: 'red',
    fontWeight: '900',
  },
  boxContainer: {
    flex: 2,
  },
  box: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  updateBox: {
    padding: 5,
  },

  box1: {
    borderRadius: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'black',
    flex: 4,
    marginBottom: 2,
  },
  box2: {
    flex: 2,
    marginBottom: 2,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: '#fff',
    borderColor: 'blue',
  },
  box3: {
    flex: 3.5,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: '#fff',
    borderColor: 'green',
    height: 'auto',
  },
  boxText: {
    fontSize: 18,
    color: 'black',
    fontWeight: '500',
  },
  textInputContainerForSearch: {
    backgroundColor: '#fff',
    flex: 1,
    flexDirection: 'row',
    borderRadius: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#A7A6BA',
    height: 34,
  },
  textInputForSearch: {
    fontSize: 10,
    color: 'black',
  },
  calendarContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#A7A6BA',
  },
  closeButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  closeButtonText: {
    fontSize: 16,
    color: 'black',
  },
  postButton: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 300,
    right: 20,
    backgroundColor: 'orange',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  packageButton: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 250,
    right: 20,
    backgroundColor: 'orange',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  textData: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 10,
    color: '#fff',
  },
  resetButton: {
    marginLeft: 5,
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    height: 34,
    borderColor: 'red',
  },
  resetButtonText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'red',
  },
});

export default Home;
