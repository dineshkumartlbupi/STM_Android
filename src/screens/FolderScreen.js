import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faTrash, faSearch} from '@fortawesome/free-solid-svg-icons';
import {useFocusEffect, useNavigation} from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Toast from 'react-native-toast-message';

const FolderScreen = ({route}) => {
  const navigation = useNavigation();
  const [search, setSearch] = useState('');
  const {folder} = route.params;
  const [inputText, setInputText] = useState('');
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [filteredPhoneNumbers, setFilteredPhoneNumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  useEffect(() => {
    const filterDataBySearch = list => {
      return list.filter(item => {
        // Perform the actual filtering
        return item.includes(search);
      });
    };

    setFilteredPhoneNumbers(filterDataBySearch(phoneNumbers));
  }, [search, phoneNumbers]);

  
  const handleAddNumbers = () => {
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please enter valid numbers.');
      return;
    }
  
    const numbersArray = inputText
      .split(/[\n,]/)
      .map(number => number.trim())
      .filter(number => number);
  
    // Find duplicates
    const duplicates = numbersArray.filter(number =>
      phoneNumbers.includes(number),
    );
  
    // Remove duplicates from the new numbers
    const uniqueNumbers = numbersArray.filter(
      number => !phoneNumbers.includes(number),
    );
  
    if (duplicates.length > 0) {
      Alert.alert('Duplicate Numbers', `These numbers are already in the list: ${duplicates.join(', ')}`);
    }
  
    setPhoneNumbers([...phoneNumbers, ...uniqueNumbers]);
    setInputText('');

    // Set success message
    setSuccessMessage('Successfully added new contact');
    setTimeout(() => {
      setSuccessMessage(''); // Clear message after 3 seconds
    }, 3000);
  };
  

  useFocusEffect(
    React.useCallback(() => {
      const fetchUsersByPackageId = async packageId => {
        try {
          const usersCollection = firestore().collection('users');
          const querySnapshot = await usersCollection.get();

          const users = [];
          querySnapshot.forEach(doc => {
            const userData = doc.data();
            if (
              userData.packages &&
              userData.packages[packageId] !== undefined
            ) {
              users.push(userData.phoneNumber);
            }
          });

          setPhoneNumbers(users); // Set the filtered phone numbers in state
        } catch (error) {
          console.error('Error fetching users:', error);
          Alert.alert('Error', 'Failed to fetch users. Please try again.');
        }
      };
      if (folder.id !== null) {
        fetchUsersByPackageId(folder.id);
      }
    }, [folder]),
  );
  useFocusEffect(
    React.useCallback(() => {
      const createOrUpdateAccount = async (number, id) => {
        console.log(
          'Creating/updating account for:',
          number,
          'with package:',
          id,
        );
        setLoading(true); // Start loading
        try {
          const usersCollection = firestore().collection('users');

          // Query Firestore to check if the user already exists
          const userSnapshot = await usersCollection
            .where('phoneNumber', '==', number)
            .get();

          if (!userSnapshot.empty) {
            // User exists, update the existing user's packages
            const userDoc = userSnapshot.docs[0];
            const userData = userDoc.data();
            // console.log('User exists. Updating packages for:', number);

            // Update the user's packages
            const updatedPackages = {
              ...userData.packages,
              [id]: '', // Add the new package ID
            };

            await usersCollection
              .doc(userDoc.id)
              .update({packages: updatedPackages});
            // console.log('User data updated in Firestore!');
          } else {
            // User does not exist, create a new account
            const randomId = generateRandomuid();

            await usersCollection.doc(randomId).set({
              surname: 'Doe',
              name: 'John',
              phoneNumber: number,
              shopName: 'Shop Name',
              address: {
                villageCity: 'City',
                street: 'Street',
                mandal: 'Mandal',
                district: 'District',
                state: 'State',
              },
              packages: {
                [id]: '',
              },
              userid: randomId,
            });

            console.log('User data added to Firestore!');
          }
          //   Alert.alert('Success!', 'Data has been saved successfully.');
        } catch (error) {
          console.error(
            'Error adding/updating user data in Firestore: ',
            error,
          );
          //   Alert.alert('Error', 'Failed to save data. Please try again.');
        } finally {
          setLoading(false);
        }
      };
      if (phoneNumbers.length > 0) {
        phoneNumbers.forEach(number => {
          createOrUpdateAccount(number, folder.id);
        });
      }
    }, [phoneNumbers]),
  );

  const generateRandomuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  };

  const handleDeleteNumber = async index => {
    const numberToDelete = phoneNumbers[index];
    console.log('Going to Delete Number  : ', numberToDelete);
    setLoading(true); // Start loading
    try {
      const usersCollection = firestore().collection('users');

      const userSnapshot = await usersCollection
        .where('phoneNumber', '==', numberToDelete)
        .get();

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        await usersCollection.doc(userDoc.id).delete();
        console.log('User data deleted from Firestore!');
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Contact deleted successfully!',
          position: 'top',
        });
      }
      setPhoneNumbers(phoneNumbers.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Error deleting user data from Firestore: ', error);
      Alert.alert('Error', 'Failed to delete data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{flexDirection: 'row', marginBottom: 10}}>
        <View style={styles.textInputContainerForSearch}>
          <TextInput
            style={styles.textInputForSearch}
            placeholder="Search for Mobile Number."
            placeholderTextColor="black"
            onChangeText={setSearch}
            value={search}
          />
        </View>
        <TouchableOpacity style={styles.searchButton}>
          <FontAwesomeIcon icon={faSearch} size={18} color="black" />
        </TouchableOpacity>
      </View>
      <Text style={styles.header}>{folder.name}</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter phone numbers..."
        placeholderTextColor="black"
        value={inputText}
        onChangeText={setInputText}
        multiline
      />
      <TouchableOpacity style={styles.addButton} onPress={handleAddNumbers}>
        <Text style={styles.addButtonText}>Add Numbers</Text>
      </TouchableOpacity>
      {/* Success Message */}
      {successMessage ? (
        <Text style={styles.successMessage}>{successMessage}</Text>
      ) : null}
      <ScrollView contentContainerStyle={styles.numbersContainer}>
        {filteredPhoneNumbers.map((number, index) => (
          <View key={index} style={styles.numberRow}>
            <Text style={styles.numberText}>{number}</Text>
            <TouchableOpacity onPress={() => handleDeleteNumber(index)}>
              <FontAwesomeIcon icon={faTrash} size={20} color="red" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
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
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  textInputContainerForSearch: {
    backgroundColor: '#fff',
    flex: 1,
    flexDirection: 'row',
    borderRadius: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#A7A6BA',
    height: 44,
  },
  textInputForSearch: {
    fontSize: 16,
    color: 'black',
  },
  searchButton: {
    backgroundColor: '#fff',
    padding: 10,
    borderWidth: 1,
    borderColor: '#A7A6BA',
    borderRadius: 5,
    marginLeft: 9,
    right: 3,
    height: 44,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: 'black',
  },
  input: {
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
    color: 'black',
  },
  addButton: {
    backgroundColor: '#DE0A1E',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  numbersContainer: {
    flexDirection: 'column',
  },
  numberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'grey',
  },
  numberText: {
    fontSize: 16,
    color: 'black',
  },
  successMessage: {
    color: 'green', // Green font color
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
});

export default FolderScreen;
