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
import storage from '@react-native-firebase/storage';
import {launchImageLibrary} from 'react-native-image-picker';
import Video from 'react-native-video';

const packageData = [
  {label: 'All', value: '0'},
  {label: 'Bullion rates', value: '1'},
  {label: 'Agri rates', value: '2'},
  {label: 'MCX tips', value: '3'},
  {label: 'NCDX tips', value: '4'},
];

const categoryData = [
  {label: 'Latest Updates', value: 'latest_updates'},
  {label: 'News', value: 'news'},
  {label: 'Advertisement', value: 'advertisement'},
];

const EditPost = ({route}) => {
  const {item} = route.params;
  const navigation = useNavigation();
  const [description, setDescription] = useState(item.description || '');
  const [selectedFiles, setSelectedFiles] = useState(item.files || []);
  const [uploading, setUploading] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState(item.packages || []);
  const [categoryValue, setCategoryValue] = useState(item.category || null);
  const [isPackageDropdownVisible, setPackageDropdownVisible] = useState(false);
  const [isCategoryDropdownVisible, setCategoryDropdownVisible] =
    useState(false);

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

  const validateFields = () => {
    if (description === '') {
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

  const handleUpdatePost = async () => {
    if (validateFields()) {
      try {
        setUploading(true);
        const userId = auth().currentUser.uid;
        let uploadedFiles = [...selectedFiles];

        // Upload new files and get their URLs
        for (const file of selectedFiles) {
          if (!file.url) {
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
              type: file.type,
            });
          }
        }

        // Update the post in Firestore
        await firestore()
          .collection('post')
          .doc(item.id)
          .update({
            description: description,
            category: categoryValue,
            packages: selectedPackages.filter(pkg => pkg !== '0'),
            files: uploadedFiles.filter(file => file.url), // Keep only files with URLs
          });

        setUploading(false);
        Alert.alert('Success!', 'Post updated successfully.');
        navigation.navigate('Home');
      } catch (error) {
        setUploading(false);
        console.error('Error updating post data in Firestore: ', error);
        Alert.alert('Error', 'Failed to update data. Please try again.');
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

  const selectFile = () => {
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
  const togglePackageSelection = item => {
    if (item.value === '0') {
      if (selectedPackages.includes('0')) {
        setSelectedPackages([]);
      } else {
        setSelectedPackages(packageData.map(pkg => pkg.value));
      }
    } else {
      setSelectedPackages(prevSelectedPackages => {
        const newSelectedPackages = prevSelectedPackages.includes(item.value)
          ? prevSelectedPackages.filter(value => value !== item.value)
          : [...prevSelectedPackages, item.value];

        if (
          newSelectedPackages.length === packageData.length - 1 &&
          !newSelectedPackages.includes('0')
        ) {
          newSelectedPackages.push('0');
        } else if (
          newSelectedPackages.includes('0') &&
          newSelectedPackages.length < packageData.length
        ) {
          return newSelectedPackages.filter(value => value !== '0');
        }
        return newSelectedPackages;
      });
    }
  };

  const renderPackageItem = item => (
    <TouchableOpacity
      key={item.value}
      style={styles.item}
      onPress={() => togglePackageSelection(item)}>
      <Text style={styles.textItem}>{item.label}</Text>
      {selectedPackages.includes(item.value) && (
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
        <View style={styles.formContainer}>
          <View style={{paddingVertical: 10}}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setCategoryDropdownVisible(true)}>
              <View
                style={{
                  flexDirection: 'row',
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
                    alignItems: 'center',
                  }}>
                  <Text style={styles.selectedTextStyle}>
                    {selectedPackages.length > 0
                      ? selectedPackages
                          .map(
                            pkg =>
                              packageData.find(item => item.value === pkg)
                                ?.label,
                          )
                          .join(', ')
                      : 'Select Package'}
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
          <View style={{paddingVertical: 10}}>
            <TextInput
              style={styles.textArea}
              value={description}
              onChangeText={setDescription}
              placeholder="Enter Description"
              multiline
            />
          </View>

          <ScrollView horizontal style={styles.selectedFilesContainer}>
            {selectedFiles.map((file, index) => (
              <View key={index} style={styles.fileContainer}>
                {file.type === 'image' && (
                  <Image
                    source={{uri: file.uri || file.url}}
                    style={styles.filePreview}
                  />
                )}
                {file.type === 'video' && (
                  <Video
                    source={{uri: file.uri || file.url}}
                    style={styles.filePreview}
                    useNativeControls
                    resizeMode="contain"
                  />
                )}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => {
                    setSelectedFiles(prevFiles =>
                      prevFiles.filter((_, i) => i !== index),
                    );
                  }}>
                  <FontAwesomeIcon
                    icon={faTrash}
                    style={styles.removeButtonIcon}
                    color="red"
                    size={20}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <View style={styles.iconContainer}>
            <View style={styles.iconButtonContainer}>
              <TouchableOpacity style={styles.iconButton} onPress={selectImage}>
                <FontAwesomeIcon
                  icon={faImage}
                  size={24}
                  color="black"
                  style={{marginTop: 12}}
                />
              </TouchableOpacity>
              <Text style={styles.iconLabel}>Image</Text>
            </View>
            <View style={styles.iconButtonContainer}>
              <TouchableOpacity style={styles.iconButton} onPress={selectVideo}>
                <FontAwesomeIcon
                  icon={faVideo}
                  size={24}
                  color="black"
                  style={{marginTop: 12}}
                />
              </TouchableOpacity>
              <Text style={styles.iconLabel}>Video</Text>
            </View>
            <View style={styles.iconButtonContainer}>
              <TouchableOpacity style={styles.iconButton} onPress={selectFile}>
                <FontAwesomeIcon
                  icon={faFileText}
                  size={24}
                  color="black"
                  style={{marginTop: 12}}
                />
              </TouchableOpacity>
              <Text style={styles.iconLabel}>File</Text>
            </View>
          </View>

          {uploading && (
            <ActivityIndicator
              size="large"
              color="#0000ff"
              style={styles.activityIndicator}
            />
          )}
          <TouchableOpacity
            style={styles.addPostButton}
            onPress={handleUpdatePost}>
            <Text style={styles.addPostButtonText}>Update Post</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addPostButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.addPostButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <Modal
        isVisible={isCategoryDropdownVisible}
        onBackdropPress={() => setCategoryDropdownVisible(false)}>
        <View style={styles.modalContent}>
          {categoryData.map(renderCategoryItem)}
        </View>
      </Modal>
      <Modal
        isVisible={isPackageDropdownVisible}
        onBackdropPress={() => setPackageDropdownVisible(false)}>
        <View style={styles.modalContent}>
          {packageData.map(renderPackageItem)}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 5,
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 5,
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
  selectedFilesContainer: {
    flexDirection: 'row',
  },
  selectedFile: {
    width: '30%',
    marginBottom: 10,
    position: 'relative',
  },
  filePreview: {
    width: 200,
    height: 100,
    borderRadius: 5,
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
    width: '100%',
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 8,
    flexDirection: 'row',
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
    padding: 8,
  },
  fileDelete: {
    marginLeft: 10,
    height: 48,
    alignItems: 'center',
    padding: 8,
  },
  iconContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 20,
    marginLeft: 8,
    alignContent: 'center',
    width: '100%',
  },
  iconButtonContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: 16,
    alignContent: 'center',
    alignSelf: 'center',
  },
  iconButton: {
    width: 50,
    height: 50,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    elevation: 5,
  },
  iconLabel: {
    color: 'black',
    fontWeight: '600',
    fontSize: 12,
    marginTop: 5,
  },
  addPostButton: {
    marginTop: 30,
    padding: 15,
    alignItems: 'center',
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

export default EditPost;
