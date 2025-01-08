import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';

import {
  faFileText,
  faImage,
  faTrash,
  faVideo,
  faChevronCircleDown,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import Modal from 'react-native-modal';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import GroupFolder from '../components/GroupFolder';

import storage from '@react-native-firebase/storage';
import {launchImageLibrary} from 'react-native-image-picker';

import {Video} from 'expo-av';

const categoryData = [
  {label: 'Latest Updates', value: 'latest_updates'},
  {label: 'News', value: 'news'},
  {label: 'Advertisement', value: 'advertisement'},
];

const CreatePost = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState([]);
  const [categoryValue, setCategoryValue] = useState(null);
  const [isPackageDropdownVisible, setPackageDropdownVisible] = useState(false);
  const [isCategoryDropdownVisible, setCategoryDropdownVisible] =
    useState(false);
  const [packages, setPackages] = useState([]);
  const [hyperlink, setHyperlink] = useState('');

  // Fetch packages from Firestore
  useEffect(() => {
    let isMounted = true; // Prevent state updates after unmount
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const snapshot = await firestore()
          .collection('folders')
          .orderBy('id', 'asc')
          .limit(10) // Adjust the limit as needed
          .get();

        if (isMounted) {
          const fetchedPackages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));

          fetchedPackages.unshift({label: 'All', value: '0'});
          setPackages(fetchedPackages);
        }
      } catch (error) {
        console.error('Error fetching data from Firestore:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPackages();
    return () => {
      isMounted = false; // Cleanup
    };
  }, []);

  useEffect(() => {
    async function requestStoragePermission() {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to your storage to read files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Storage permission granted');
        } else {
          console.log('Storage permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
    requestStoragePermission();
  }, []);

  const handleFolderPress = folderName => {
    Alert.alert(`You pressed ${folderName}`);
  };

  const validateFields = () => {
    if (categoryValue !== 'advertisement' && description === '') {
      Alert.alert('Error', 'Please Enter Description');
      return false;
    }
    if (!categoryValue) {
      Alert.alert('Error', 'Please select a category.');
      return false;
    }
    if (selectedPackages.length === 0) {
      Alert.alert('Error', 'Please select a package.');
      return false;
    }
    return true;
  };

  const handleAddPost = async () => {
    if (validateFields()) {
      try {
        setUploading(true);
        const userId = auth().currentUser.uid;
        let uploadedFiles = [];

        for (const file of selectedFiles) {
          const uploadUri = file.uri;
          let filename = uploadUri.substring(uploadUri.lastIndexOf('/') + 1);
          const fileExtension = filename.split('.').pop();
          const fileNameWithoutExtension = filename.replace(
            `.${fileExtension}`,
            '',
          );
          filename = `${fileNameWithoutExtension}_${Date.now()}.${fileExtension}`;

          const storageRef = storage().ref(`posts/${userId}/${filename}`);
          const task = storageRef.putFile(uploadUri);

          await task;

          const fileUrl = await storageRef.getDownloadURL();
          uploadedFiles.push({
            url: fileUrl,
            type: file.type || 'unknown',
          });
        }

        // Ensure filteredPackages does not include undefined
        const filteredPackages = selectedPackages.includes('0')
          ? packages.map(pkg => pkg.id).filter(id => id !== '0') // Remove '0' if 'All' is selected
          : selectedPackages.filter(id => id !== '0'); // Filter out '0' if not needed

        // Remove any undefined values
        const cleanedPackages = filteredPackages.filter(id => id !== undefined);

        const postData = {
          description: description || '',
          category: categoryValue || '',
          packages: cleanedPackages, // Ensure no undefined values
          postedBy: userId,
          timestamp: firestore.FieldValue.serverTimestamp(),
          files: uploadedFiles,
          hyperlink: hyperlink || '',
        };

        await firestore().collection('post').add(postData);

        setUploading(false);
        Alert.alert('Success!', 'Post Data submitted successfully.');
        navigation.navigate('Home');
      } catch (error) {
        setUploading(false);
        console.error('Error adding post data to Firestore: ', error);
        Alert.alert('Error', 'Failed to save data. Please try again.');
      }
    }
  };

  const selectImage = () => {
    launchImageLibrary({mediaType: 'photo'}, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else {
        setSelectedFiles(prevFiles => [
          ...prevFiles,
          {uri: response.assets[0].uri, type: 'image'},
        ]);
      }
    });
  };

  const selectVideo = () => {
    launchImageLibrary({mediaType: 'video'}, response => {
      if (response.didCancel) {
        console.log('User cancelled video picker');
      } else if (response.errorMessage) {
        console.log('VideoPicker Error: ', response.errorMessage);
      } else {
        setSelectedFiles(prevFiles => [
          ...prevFiles,
          {uri: response.assets[0].uri, type: 'video'},
        ]);
      }
    });
  };

  const togglePackageSelection = item => {
    if (item.value === '0') {
      // 'All' is selected
      if (selectedPackages.includes('0')) {
        // Deselect 'All' which should deselect all packages
        setSelectedPackages([]);
      } else {
        // Select 'All' which means selecting all packages
        setSelectedPackages(
          packages.map(pkg => pkg.id).filter(id => id !== '0'),
        );
      }
    } else {
      // Specific package is selected/deselected
      setSelectedPackages(prevSelectedPackages => {
        const newSelectedPackages = prevSelectedPackages.includes(item.id)
          ? prevSelectedPackages.filter(value => value !== item.id)
          : [...prevSelectedPackages, item.id];

        // Ensure 'All' option reflects current selection
        if (
          newSelectedPackages.length === packages.length - 1 &&
          !newSelectedPackages.includes('0')
        ) {
          newSelectedPackages.push('0');
        } else if (
          newSelectedPackages.includes('0') &&
          newSelectedPackages.length < packages.length
        ) {
          return newSelectedPackages.filter(value => value !== '0');
        }
        return newSelectedPackages;
      });
    }
  };

  const renderPackageItem = item => (
    <TouchableOpacity
      key={item.id}
      style={styles.item}
      onPress={() => togglePackageSelection(item)}>
      <Text style={styles.textItem}>
        {item.value === '0' ? item.label : item.name}
      </Text>
      {selectedPackages.includes(item.id) && (
        <FontAwesomeIcon
          icon={faCheck}
          style={styles.icon}
          color="black"
          size={20}
        />
      )}
    </TouchableOpacity>
  );

  const renderCategoryItem = item => (
    <TouchableOpacity
      key={item.value}
      style={styles.item}
      onPress={() => {
        setCategoryValue(item.value);
        setSelectedPackages([]); // reset selected packages
        setCategoryDropdownVisible(false);
      }}>
      <Text style={styles.textItem}>{item.label}</Text>
      {item.value === categoryValue && (
        <FontAwesomeIcon
          icon={faCheck}
          style={styles.icon}
          color="black"
          size={20}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        ) : packages.length > 0 ? (
          <GroupFolder onFolderPress={handleFolderPress} packages={packages} />
        ) : (
          <View />
        )}

        <View style={styles.formContainer}>
          <View style={{paddingVertical: 10}}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setCategoryDropdownVisible(true)}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text style={styles.selectedTextStyle}>
                  {categoryData.find(item => item.value === categoryValue)
                    ?.label || 'Select category'}
                </Text>
                <FontAwesomeIcon
                  icon={faChevronCircleDown}
                  style={styles.icon}
                  color="black"
                  size={20}
                />
              </View>
            </TouchableOpacity>
          </View>
          {categoryValue && (
            <View style={{paddingVertical: 10}}>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setPackageDropdownVisible(true)}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <Text style={styles.selectedTextStyle}>
                    {selectedPackages.length > 0
                      ? selectedPackages
                          .map(
                            value =>
                              packages.find(item => item.id === value)?.name,
                          )
                          .join(', ')
                      : 'Select Group'}
                  </Text>
                  <FontAwesomeIcon
                    icon={faChevronCircleDown}
                    style={styles.icon}
                    color="black"
                    size={20}
                  />
                </View>
              </TouchableOpacity>
            </View>
          )}
          <Modal
            isVisible={isCategoryDropdownVisible}
            onBackdropPress={() => setCategoryDropdownVisible(false)}
            style={{margin: 0, justifyContent: 'flex-end'}}>
            <View style={styles.modalContent}>
              {categoryData.map(renderCategoryItem)}
            </View>
          </Modal>
          <Modal
            isVisible={isPackageDropdownVisible}
            onBackdropPress={() => setPackageDropdownVisible(false)}
            style={{margin: 0, justifyContent: 'flex-end'}}>
            <View style={styles.modalContent}>
              {packages.map(renderPackageItem)}
            </View>
          </Modal>
          <Text style={styles.label}>Post Description</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Add Message"
            placeholderTextColor={'black'}
            onChangeText={setDescription}
            value={description}
            multiline
          />

          {selectedFiles.length > 0 && (
            <View style={styles.fileContainer}>
              <ScrollView>
                {selectedFiles.map((file, index) => (
                  <View style={styles.fileWrapper} key={index}>
                    {file.mediaType === 'video' ? (
                      <Video
                        source={{uri: file.uri}}
                        style={styles.videoStyle}
                        useNativeControls
                        isLooping={false}
                      />
                    ) : (
                      <Image
                        source={{uri: file.uri}}
                        style={styles.postImage}
                        resizeMode="stretch"
                      />
                    )}
                    <View style={styles.fileName}>
                      <Text>File selected</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        setSelectedFiles(prevFiles =>
                          prevFiles.filter((_, i) => i !== index),
                        );
                      }}>
                      <FontAwesomeIcon icon={faTrash} size={16} color="red" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          {categoryValue && categoryValue === 'advertisement' && (
            <View style={styles.iconContainer}>
              <Text style={styles.label}>Hyperlink</Text>
              <TextInput
                style={styles.textArea}
                placeholder="Add hyperlink"
                placeholderTextColor={'black'}
                onChangeText={setHyperlink}
                value={hyperlink}
                multiline
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-evenly',
                  alignItems: 'center',
                }}>
                <View style={styles.iconButtonContainer}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={selectImage}>
                    <FontAwesomeIcon icon={faImage} size={24} color="black" />
                  </TouchableOpacity>
                  <Text style={styles.iconLabel}>Image</Text>
                </View>
                <View style={styles.iconButtonContainer}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={selectVideo}>
                    <FontAwesomeIcon icon={faVideo} size={24} color="black" />
                  </TouchableOpacity>
                  <Text style={styles.iconLabel}>Video</Text>
                </View>
              </View>
            </View>
          )}
          {uploading && (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color="#0000ff" />
              <Text style={styles.uploadingText}>Uploading...</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.addPostButton}
            onPress={handleAddPost}>
            <Text style={styles.addPostButtonText}>Add Post</Text>
          </TouchableOpacity>
        </View>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  selectedFilesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  selectedFile: {
    width: '30%',
    marginBottom: 10,
    position: 'relative',
  },
  filePreview: {
    width: '100%',
    height: 100,
    borderRadius: 5,
  },
  deleteButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 5,
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  formContainer: {
    padding: 16,
    borderRadius: 10,
  },
  label: {
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  textArea: {
    fontSize: 16,
    borderColor: '#CCCCCC',
    borderWidth: 1,
    padding: 10,
    height: 100,
    textAlignVertical: 'top',
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    marginTop: 5,
  },
  fileContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
  },
  postImage: {
    width: 48,
    height: 48,
    resizeMode: 'cover',
  },
  videoStyle: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  fileWrapper: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileName: {
    width: '50%',
    marginLeft: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  fileDelete: {
    marginLeft: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  iconContainer: {
    marginTop: 20,
    marginBottom: 20,
  },
  iconButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    elevation: 5,
  },
  iconLabel: {
    marginLeft: 10,
    color: 'black',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 5,
  },
  addPostButton: {
    marginTop: 30,
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DE0A1E',
    borderRadius: 10,
  },
  addPostButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  dropdown: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
  },
  selectedTextStyle: {
    color: 'black',
    fontWeight: '600',
    fontSize: 16,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
  },
  item: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textItem: {
    color: 'black',
    fontWeight: '500',
    fontSize: 16,
  },
  icon: {
    marginLeft: 10,
  },
});

export default CreatePost;
