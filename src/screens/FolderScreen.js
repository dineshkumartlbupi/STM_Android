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
  const [processedNumbers, setProcessedNumbers] = useState(new Set());
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  useEffect(() => {
    const debouncedFilter = debounce(() => {
      const filtered = phoneNumbers.filter(number => number.includes(search));
      setFilteredPhoneNumbers(filtered);
    }, 0);
  
    debouncedFilter();
  }, [search, phoneNumbers]);
  
  useFocusEffect(
    React.useCallback(() => {
      const fetchUsersByPackageId = async packageId => {
        console.log('Step 1: fetchUsersByPackageId called with packageId:', packageId); // Log when function is called
        try {
          setLoading(true);
          console.log('Step 2: Loading state set to true'); // Log when loading starts
  
          // Firestore query with filter
          const usersCollection = firestore().collection('users');
          console.log('Step 3: Accessed Firestore collection "users"'); // Log Firestore access
  
          const querySnapshot = await usersCollection
            .where(`packages.${packageId}`, '!=', null) // Filter documents where the packageId exists in packages
            .get();
  
          console.log('Step 4: Query executed successfully'); // Log successful query execution
          console.log('QuerySnapshot size:', querySnapshot.size); // Log the number of documents 
          setLoading(false);
          // found
          const users = [];
          querySnapshot.forEach(doc => {
            setLoading(false);
            const userData = doc.data();
            console.log('Step 5: Processing document:', doc.id); // Log each document being processed
            console.log('Document data:', userData); // Log document data
            users.push(userData.phoneNumber); // Collect phone numbers of filtered users
          });
          console.log('Step 6: Collected phone numbers:', users); // Log the collected phone numbers
          setPhoneNumbers(users); // Set the filtered phone numbers in state
          setFilteredPhoneNumbers(users)
          setLoading(false);
          console.log('Step 7: Loading state set to false'); // Log when loading ends
        } catch (error) {
          setLoading(false);
          console.error('Step 8: Error fetching users:', error); // Log the error
          Alert.alert('Error', 'Failed to fetch users. Please try again.');
        }
      };
      if (folder.id !== null) {
        setLoading(false);
        console.log('Step 9: folder.id is not null, fetching users for packageId:', folder.id); 
        fetchUsersByPackageId(folder.id);
      } else {
        setLoading(false);
        console.log('Step 10: folder.id is null, skipping fetchUsersByPackageId'); // Log when folder.id is null
      }
    }, [folder])
  );



  
  const generateRandomuid = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  // Debugging wrapper for logging
  const debugLog = (label, data) => {
    console.log(`[DEBUG] ${label}:`, data);
  };

  const handleAddNumbers = async () => {
    debugLog('handleAddNumbers inputText', inputText);
  
    if (!inputText.trim()) {
      Alert.alert('Error', 'Please enter valid numbers.');
      return;
    }
  
    const numbersArray = inputText
      .split(/[\n,]/) // Split input on newline or comma
      .map(number => number.trim()) // Trim each number
      .filter(number => /^[0-9]+$/.test(number)); // Validate numbers
  
    debugLog('Parsed numbersArray', numbersArray);
  
    if (numbersArray.length > 500) {  
      Alert.alert('Error', 'You can only add up to 500 users at a time.');
      return;
    }

    const newNumbersSet = new Set(phoneNumbers); // Use Set for efficient duplicate checks
    const duplicates = [];
    const uniqueNumbers = [];
  
    numbersArray.forEach(number => {
      // Ensure each phone number starts with +91 if not already present
      let formattedNumber = number.startsWith('+91') ? number : `+91${number}`;
  
      if (newNumbersSet.has(formattedNumber)) {
        duplicates.push(formattedNumber);
      } else {
        uniqueNumbers.push(formattedNumber);
        newNumbersSet.add(formattedNumber); // Add to the set for tracking
      }
    });
  
    debugLog('Unique Numbers', uniqueNumbers);
    debugLog('Duplicates', duplicates);
  
    if (uniqueNumbers.length > 0) {
      setLoading(true);
      try {
        const usersCollection = firestore().collection('users');
        const id=folder.id;
        // Process Firestore additions for unique numbers
        console.log('FolderId :: ',id);
        await Promise.all(
          uniqueNumbers.map(async number => {
            debugLog('Adding number to Firestore', number);
  
            const userSnapshot = await usersCollection.where('phoneNumber', '==', number)
            .get();  
            console.log("Its working ::  ",userSnapshot.docs[0] &&
              userSnapshot.docs[0].data());
            if (
              !userSnapshot.empty &&
              userSnapshot.docs[0] &&
              userSnapshot.docs[0].data() &&
              userSnapshot.docs[0].data().packages &&
              userSnapshot.docs[0].data().packages[id]
            )  {
              debugLog('Number already exists in Firestore', );
            } else {
              const randomId = generateRandomuid();
              const id=folder.id;
              const newUser = {
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
              };
              await usersCollection.doc(randomId).set(newUser);
              debugLog('Added new user to Firestore', newUser);
            }
          }),
        );

        // Update local state after successful additions
        setPhoneNumbers(prevNumbers => [...prevNumbers, ...uniqueNumbers]);
        setInputText('');
        setSuccessMessage('Successfully added new contacts.');
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
  
      } catch (error) {
        console.error('Error adding numbers to Firestore:', error);
        Alert.alert('Error', 'An error occurred while adding numbers to Firestore.');
      } finally {
        setLoading(false);
      }
    }
  
    if (duplicates.length > 0) {
      Alert.alert(
        'Duplicate Numbers',
        `These numbers are already in the list: ${duplicates.join(', ')}`,
      );
    }
  
    if (uniqueNumbers.length === 0 && duplicates.length === 0) {
      Alert.alert('No Valid Numbers', 'No valid or unique numbers found to add.');
    }
  };
  




  const handleDeleteNumber = async numberToDelete => {
    console.log('Going to Delete Number:', numberToDelete);
  
    try {
      setLoading(true); // Start loading
      const usersCollection = firestore().collection('users');
      const userSnapshot = await usersCollection
        .where('phoneNumber', '==', numberToDelete)
        .limit(1) // Optimize query by limiting results
        .get();
  
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        await usersCollection.doc(userDoc.id).delete(); // Delete the document
        console.log('User data deleted from Firestore!');
  
        // Show success message
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Contact deleted successfully!',
          position: 'top',
        });
  
        // Update local state to remove the deleted number
        setPhoneNumbers(phoneNumbers.filter(number => number !== numberToDelete));
      } else {
        Alert.alert('Not Found', 'Number not found in Firestore.');
      }
    } catch (error) {
      console.error('Error deleting user data from Firestore:', error);
      Alert.alert('Error', 'Failed to delete data. Please try again.');
    } finally {
      setLoading(false); // End loading
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
         textAlignVertical="top"
         numberOfLines={100}
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
            <TouchableOpacity onPress={() => handleDeleteNumber(number)}>
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
    height:250
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
