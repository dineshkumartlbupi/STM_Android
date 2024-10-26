import React, {useState, useEffect} from 'react';
import {View, ScrollView, Text, StyleSheet, Alert} from 'react-native';
import LatestUpdateItem from '../components/LatestUpdateItem';
import NewsUpdateItem from '../components/NewsUpdateItem';
import AdvertisementUpdateItem from '../components/AdvertisementUpdateItem';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const ShowAllUpdates = ({route, navigation}) => {
  const {flag} = route.params || {};
  const [latestUpdateList, setLatestUpdateList] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [advertisementList, setAdvertisementList] = useState([]);

  useEffect(() => {
    fetchAndFilterPosts();
  }, []);

  const fetchAndFilterPosts = () => {
    firestore()
      .collection('post')
      .orderBy('timestamp', 'desc')
      .get()
      .then(querySnapshot => {
        const latestUpdates = [];
        const news = [];
        const advertisements = [];
        querySnapshot.forEach(documentSnapshot => {
          const data = documentSnapshot.data();
          if (data && data.category) {
            switch (data.category) {
              case 'latest_updates':
                latestUpdates.push({...data, id: documentSnapshot.id});
                break;
              case 'news':
                news.push({...data, id: documentSnapshot.id});
                break;
              case 'advertisement':
                advertisements.push({...data, id: documentSnapshot.id});
                break;
              default:
                console.warn(`Unknown category: ${data.category}`);
                break;
            }
          } else {
            console.warn(
              'Document missing required fields:',
              documentSnapshot.id,
            );
          }
        });

        setLatestUpdateList(latestUpdates);
        setNewsList(news);
        setAdvertisementList(advertisements);

        console.log('Data fetched and categorized successfully');
      })
      .catch(error => {
        console.error('Error fetching posts: ', error);
        Alert.alert('Error', 'Failed to fetch posts. Please try again.');
      });
  };

  const handleDeleteLatestUpdate = item => {
    firestore()
      .collection('post')
      .doc(item.id)
      .delete()
      .then(() => {
        Alert.alert('Deleted', 'Item has been deleted successfully.');
        fetchAndFilterPosts();
      })
      .catch(error => {
        console.error('Error deleting item: ', error);
        Alert.alert('Error', 'Failed to delete the item. Please try again.');
      });
  };

  const handleEditLatestUpdate = item => {
    navigation.navigate('EditPost', {item});
  };

  const handleDeleteLatestNews = item => {
    firestore()
      .collection('post')
      .doc(item.id)
      .delete()
      .then(() => {
        Alert.alert('Deleted', 'Item has been deleted successfully.');
        fetchAndFilterPosts();
      })
      .catch(error => {
        console.error('Error deleting item: ', error);
        Alert.alert('Error', 'Failed to delete the item. Please try again.');
      });
  };

  const handleEditLatestNews = item => {
    navigation.navigate('EditPost', {item});
  };

  const handleDeleteLatestAdvertisement = item => {
    firestore()
      .collection('post')
      .doc(item.id)
      .delete()
      .then(() => {
        Alert.alert('Deleted', 'Item has been deleted successfully.');
        fetchAndFilterPosts();
      })
      .catch(error => {
        console.error('Error deleting item: ', error);
        Alert.alert('Error', 'Failed to delete the item. Please try again.');
      });
  };

  const handleEditLatestAdvertisement = item => {
    navigation.navigate('EditPost', {item});
  };

  const renderList = () => {
    switch (flag) {
      case 'latest_updates':
        return (
          <ScrollView style={styles.scrollView}>
            {latestUpdateList.map((item, index) => (
              <LatestUpdateItem
                key={index}
                item={item}
                onEdit={handleEditLatestUpdate}
                onDelete={handleDeleteLatestUpdate}
                isAdmin={isAdmin()}
              />
            ))}
          </ScrollView>
        );
      case 'news':
        return (
          <ScrollView style={styles.scrollView}>
            {newsList.map((item, index) => (
              <NewsUpdateItem
                key={index}
                item={item}
                onEdit={handleEditLatestNews}
                onDelete={handleDeleteLatestNews}
                isAdmin={isAdmin()}
              />
            ))}
          </ScrollView>
        );
      case 'advertisement':
        return (
          <ScrollView horizontal={false} style={styles.scrollView}>
            {advertisementList.map((item, index) => (
              <AdvertisementUpdateItem
                key={index}
                item={item}
                onEdit={handleEditLatestAdvertisement}
                onDelete={handleDeleteLatestAdvertisement}
                isAdmin={isAdmin()}
              />
            ))}
          </ScrollView>
        );
      default:
        return <Text style={styles.noDataText}>No data available</Text>;
    }
  };

  const isAdmin = () => {
    const currentUser = auth().currentUser;
    return (
      currentUser &&
      ['+918790720978', '+919052288377', '+918853389395', '+917022863475'].includes(
        currentUser.phoneNumber,
      )
    );
  };

  return <View style={styles.container}>{renderList()}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  scrollView: {
    marginBottom: 20,
  },
  noDataText: {
    textAlign: 'center',
    fontSize: 18,
    color: 'grey',
  },
});

export default ShowAllUpdates;
