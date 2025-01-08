import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import firestore from '@react-native-firebase/firestore';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {faEdit, faTrash, faPlus} from '@fortawesome/free-solid-svg-icons';
import Toast from 'react-native-toast-message';

const GroupFolder = () => {
  const navigation = useNavigation();
  const [createFolderModalVisible, setCreateFolderModalVisible] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState(null);
  const [loadingCounts, setLoadingCounts] = useState({});
  const [folderCounts, setFolderCounts] = useState({});
  const [nextFolderId, setNextFolderId] = useState(1);
  const [folders, setFolders] = useState([]);

  // Fetch folders and phone counts when component mounts
  useEffect(() => {
    setLoading(true);
    const unsubscribe = firestore()
      .collection('folders')
      .orderBy('id', 'asc')
      .onSnapshot(snapshot => {
        const fetchedFolders = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFolders(fetchedFolders);
        fetchPhoneNumbersCount(fetchedFolders);
        setNextFolderId(
          fetchedFolders.length > 0
            ? fetchedFolders[fetchedFolders.length - 1].id + 1
            : 1,
        );
        setLoading(false);
      });
      setLoading(false);
    return () => unsubscribe();
  }, []);

  // Re-fetch phone number counts when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchPhoneNumbersCount(folders);
    }, [folders]),
  );
  const fetchPhoneNumbersCount = useCallback(async fetchedFolders => {
    const counts = {};
    const loadingState = {};

    const fetchCounts = fetchedFolders.map(async folder => {
      loadingState[folder.id] = true;
      try {
        setLoading(true);
        const usersCollection = firestore().collection('users');
        const querySnapshot = await usersCollection
          .where(`packages.${folder.id}`, '!=', null)
          .get();

        counts[folder.id] = querySnapshot.size;
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.error(`Error fetching count for folder ${folder.id}:`, error);
        Alert.alert(
          'Error',
          'Failed to fetch phone numbers. Please try again.',
        );
      } finally {
        setLoading(false);
        loadingState[folder.id] = false;
      }
    });

    await Promise.all(fetchCounts);
    setFolderCounts(counts);
    setLoadingCounts(loadingState);
  }, []);

  const deleteFolder = async folder => {
    try {
      if (!folder || typeof folder.id === 'undefined') {
        console.error('Invalid folder object:', folder);
        showToast('error', 'Error', 'Invalid folder object provided.');
        return;
      }
  
      const folderId = String(folder.id); // Ensure folderId is a string
  
      setLoading(true);
  
      // Check if folder exists before deletion
      const folderDoc = await firestore().collection('folders').doc(folderId).get();
      if (!folderDoc.exists) {
        console.error('Folder does not exist:', folderId);
        showToast('error', 'Error', 'Folder does not exist.');
        setLoading(false);
        return;
      }
  
      // Proceed with deletion
      await firestore().collection('folders').doc(folderId).delete();
      setFolders(prev => prev.filter(f => f.id !== folder.id)); // Remove from local state
      showToast('success', 'Success', 'Folder deleted successfully!');
    } catch (error) {
      console.error('Error deleting folder:', error);
      showToast('error', 'Error', 'Failed to delete folder. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  

  const createNewFolder = async () => {
    if (!newFolderName) {
      showToast('error', 'Error', 'Please enter a folder name.');
      return;
    }

    try {
      setLoading(true);
      await firestore().collection('folders').doc(nextFolderId.toString()).set({
        id: nextFolderId,
        name: newFolderName,
      });
      setCreateFolderModalVisible(false);
      setNewFolderName('');
      setNextFolderId(prevId => prevId + 1);
      showToast('success', 'Success', 'Folder created successfully!');
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error creating folder:', error);
      showToast('error', 'Error', 'Failed to create folder. Please try again.');
    }
  };

  const [editFolderModalVisible, setEditFolderModalVisible] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState(null);
  const [editedFolderName, setEditedFolderName] = useState('');

  const openEditFolderModal = folder => {
    setFolderToEdit(folder);
    setEditedFolderName(folder.name);
    setEditFolderModalVisible(true);
  };

  const updateFolder = async () => {
    if (!editedFolderName) {
      showToast('error', 'Error', 'Please enter a folder name.');
      return;
    }

    try {
      setLoading(true);
      await firestore()
        .collection('folders')
        .doc(folderToEdit.id.toString())
        .update({name: editedFolderName});
      setEditFolderModalVisible(false);
      setFolderToEdit(null);
      setEditedFolderName('');
      showToast('success', 'Success', 'Folder updated successfully!');
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('Error updating folder:', error);
      showToast('error', 'Error', 'Failed to update folder. Please try again.');
    }
  };

  const showToast = (type, title, message) => {
    Toast.show({type, text1: title, text2: message, position: 'top'});
  };

  const [showFolder, setShowFolder] = useState(false);
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowFolder(!showFolder)}>
          <Text style={styles.headerText}>Show All Folders</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setCreateFolderModalVisible(true)}
          style={{flexDirection: 'row'}}>
          <FontAwesomeIcon icon={faPlus} size={20} style={{marginRight: 8}} />
          <Text style={styles.headerText}>Create Folder</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={editFolderModalVisible}
        onRequestClose={() => setEditFolderModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Folder</Text>
            <TextInput
              placeholder="Enter Folder Name"
              value={editedFolderName}
              onChangeText={setEditedFolderName}
              style={styles.input}
            />
            <TouchableOpacity onPress={updateFolder} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Update Folder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditFolderModalVisible(false)}
              style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {showFolder && (
        <View style={styles.foldersContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#000" />
          ) : (
            <View style={styles.foldersContainer}>
              {folders.map(folder => (
                <View key={folder.id} style={styles.folderContainer}>
                  <TouchableOpacity
                    style={styles.folderContent}
                    onPress={() =>
                      navigation.navigate('FolderScreen', {folder})
                    }>
                    <Image
                      source={require('../assets/folders.jpg')}
                      style={styles.icon}
                    />
                    <View style={styles.folderInfo}>
                      {/* Folder name with phone number count */}
                      <Text style={styles.text}>{folder.name}</Text>
                      {loadingCounts[folder.id] ? (
                        <Text>Loading...</Text>
                      ) : (
                        <Text style={styles.countText}>
                          [
                          <Text style={styles.countNumber}>
                            {folderCounts[folder.id] || 0}
                            {/* Show count of phone numbers */}
                          </Text>{' '}
                          Contacts]
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                  <View style={styles.iconButtons}>
                    <TouchableOpacity
                      onPress={() => openEditFolderModal(folder)}>
                      <FontAwesomeIcon icon={faEdit} style={styles.iconEdit} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteFolder(folder)}>
                      <FontAwesomeIcon
                        icon={faTrash}
                        style={styles.iconDelete}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={createFolderModalVisible}
        onRequestClose={() => setCreateFolderModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Package</Text>
            <TextInput
              placeholder="Enter Folder Name"
              value={newFolderName}
              onChangeText={setNewFolderName}
              style={styles.input}
            />

            <TouchableOpacity
              onPress={createNewFolder}
              style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Create Folder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCreateFolderModalVisible(false)}
              style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f0f0f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  foldersContainer: {
    marginTop: 20,
  },
  folderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // For Android shadow
  },
  folderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    width: 50,
    height: 50,
    marginRight: 16,
  },
  folderInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
  },
  iconButtons: {
    flexDirection: 'row',
  },
  iconEdit: {
    fontSize: 24,
    color: '#007bff',
    marginRight: 16,
  },
  iconDelete: {
    fontSize: 24,
    color: '#ff4d4f',
  },
  modalView: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 20,
    borderRadius: 8,
    elevation: 5,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 20,
    padding: 10,
    fontSize: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    padding: 10,
    backgroundColor: '#007bff',
    borderRadius: 5,
  },

  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },

  emptyView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0', // Optional: background color for better visibility
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
  },
  container: {flex: 1, padding: 20, backgroundColor: '#f0f0f0'},
  listContent: {paddingBottom: 20},
  packageContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  packageTitle: {fontSize: 20, fontWeight: 'bold', marginBottom: 10},
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  durationText: {fontSize: 16},
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  addButtonText: {color: '#fff', textAlign: 'center', fontWeight: 'bold'},
  deleteButton: {
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  deleteButtonText: {color: '#fff', textAlign: 'center', fontWeight: 'bold'},

  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 15},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  saveButtonText: {color: '#fff', textAlign: 'center', fontWeight: 'bold'},
  cancelButton: {
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  cancelButtonText: {color: '#fff', textAlign: 'center', fontWeight: 'bold'},
  durationsList: {marginTop: 10},
  container: {flex: 1, padding: 20, backgroundColor: '#f0f0f0'},
  listContent: {paddingBottom: 20},
  packageContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  packageTitle: {fontSize: 20, fontWeight: 'bold', marginBottom: 10},
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  durationText: {fontSize: 16},
  durationActions: {flexDirection: 'row', alignItems: 'center'},
  actionButton: {
    marginHorizontal: 5,
    padding: 5,
    borderRadius: 5,
    backgroundColor: '#e0e0e0',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  addButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  deleteButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  createPackageButton: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    position: 'absolute',
    bottom: 10,
    left: 16,
    right: 16,
  },
  createPackageButtonText: {color: '#fff', fontSize: 18, fontWeight: 'bold'},
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {fontSize: 18, fontWeight: 'bold', marginBottom: 15},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  saveButtonText: {color: '#fff', textAlign: 'center', fontWeight: 'bold'},
  cancelButton: {
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  cancelButtonText: {color: '#fff', textAlign: 'center', fontWeight: 'bold'},
  durationsList: {marginTop: 10},
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFC107',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  editButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  countText: {
    fontSize: 14,
    color: 'blue',
    marginLeft: 10,
    fontWeight: '500',
  },
  countNumber: {
    marginLeft: 5,
    fontSize: 14,
    color: 'red',
    fontWeight: 'bold',
  },
});

export default GroupFolder;
