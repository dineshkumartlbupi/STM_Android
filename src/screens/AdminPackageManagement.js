import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import {
  faEdit,
  faTrash,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import Toast from 'react-native-toast-message';
const AdminPackageManagement = () => {
  const [createPackageModalVisible, setCreatePackageModalVisible] =
    useState(false);
  const [newPackageName, setNewPackageName] = useState('');
  const [newPackageDurations, setNewPackageDurations] = useState([]);
  const [nextPackageId, setNextPackageId] = useState(1);

  const [packages, setPackages] = useState([]);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState(0);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection('packages')
      .orderBy('id', 'asc')
      .onSnapshot(snapshot => {
        const fetchedPackages = snapshot.docs.map(doc => ({
          id: doc.data().id,
          ...doc.data(),
        }));
        setPackages(fetchedPackages);
        // Set the next package ID based on the last package in the list
        if (fetchedPackages.length > 0) {
          setNextPackageId(fetchedPackages[fetchedPackages.length - 1].id + 1);
        }
      });

    return () => unsubscribe();
  }, []);

  const openModal = (pkg, dur = null) => {
    // Set the selected package and duration
    setSelectedPackage(pkg);
    setSelectedDuration(dur);

    // Safely set duration and price
    setDuration(dur ? dur.duration : '');

    // Ensure price is either a string or empty
    const priceValue = dur && typeof dur.price !== 'undefined'
      ? dur.price.toString()  // Convert number to string if necessary
      : '';

    setPrice(priceValue);  // Set price to the state

    // Open the modal
    setModalVisible(true);
  };

  const addOrUpdateDuration = async () => {
    if (duration && price) {
      const newDuration = {
        id: selectedDuration ? selectedDuration.id : `${Math.random()}`,
        duration,
        price: price,
      };

      // Check if we're updating an existing duration or adding a new one
      const updatedDurations = selectedDuration
        ? selectedPackage.durations.map(dur =>
          dur.id === selectedDuration.id ? newDuration : dur,
        )
        : [...selectedPackage.durations, newDuration];

      try {
        // Update the package in Firestore
        await firestore()
          .collection('packages')
          .doc(selectedPackage.id.toString())
          .update({
            durations: updatedDurations,
          });

        setPackages(prevPackages =>
          prevPackages.map(pkg =>
            pkg.id === selectedPackage.id
              ? { ...pkg, durations: updatedDurations }
              : pkg,
          ),
        );

        setModalVisible(false);
        setSelectedDuration(null);
        setDuration('');
        setPrice(0);
        Toast.show({
          type: 'success',
          text1: 'Duration',
          text2: 'Duration Added successfully.',
          position: 'top',
        });

      } catch (error) {
        console.error('Error adding/updating duration: ', error);
        Alert.alert(
          'Error',
          'Failed to add/update duration. Please try again.',
        );
      }
    } else {
      Alert.alert('Error', 'Please enter both duration and price.');
    }
  };

  const editDuration = (packageId, durationId) => {
    const pkg = packages.find(p => p.id === packageId);
    const dur = pkg?.durations?.find(d => d.id === durationId);

    if (!dur) {
      // Show error toast if duration is not found
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Duration not found!',
        position: 'bottom',
      });
      return;
    }

    // Open modal with the selected package and duration
    openModal(pkg, dur);
  };


  const deleteDuration = async (pkgId, durationId) => {
  
    const pkg = packages.find(pkg => pkg.id === pkgId);
    const updatedDurations = pkg.durations.filter(dur => dur.id !== durationId);

    try {
      await firestore().collection('packages').doc(pkgId.toString()).update({
        durations: updatedDurations,
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Duration deleted successfully',
        position: 'top',
      });

    } catch (error) {
      console.error('Error deleting duration: ', error);
      Alert.alert('Error', 'Failed to delete duration. Please try again.');
    }
  };

  const deletePackage = async pkg => {
    try {
      await firestore().collection('packages').doc(pkg.id.toString()).delete();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Package deleted successfully!',
      });

    } catch (error) {
      console.error('Error deleting package: ', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete package. Please try again.',
      });
      // Alert.alert('Error', 'Failed to delete package. Please try again.');
    }
  };

  const [editPackageModalVisible, setEditPackageModalVisible] = useState(false);
  const [packageToEdit, setPackageToEdit] = useState(null);
  const [editedPackageName, setEditedPackageName] = useState('');
  const openEditPackageModal = pkg => {
    setPackageToEdit(pkg);
    setEditedPackageName(pkg.name);
    setEditPackageModalVisible(true);
  };

  const updatePackage = async () => {
    if (editedPackageName) {
      try {
        await firestore()
          .collection('packages')
          .doc(packageToEdit.id.toString())
          .update({ name: editedPackageName });

        setEditPackageModalVisible(false);
        setPackageToEdit(null);
        setEditedPackageName('');

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Package Edited successfully!',
        });
      } catch (error) {
        console.error('Error updating package: ', error);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to Edit package. Please try again.',
        });

      }
    } else {
      Alert.alert('Error', 'Please enter a package name.');
    }
  };

  const renderDuration = (durationItem, packageId) => (
    <View style={styles.durationContainer}>
      <Text style={styles.durationText}>
        {durationItem.duration} - {durationItem.price}
      </Text>
      <View style={styles.durationActions}>
        <TouchableOpacity
          onPress={() => editDuration(packageId, durationItem.id)}
          style={styles.actionButton}>
          <FontAwesomeIcon icon={faEdit} size={20} color="#4CAF50" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => deleteDuration(packageId, durationItem.id)}
          style={styles.actionButton}>
          <FontAwesomeIcon icon={faTrash} size={20} color="#FF5722" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPackage = ({ item }) => (
    <View style={styles.packageContainer}>
      <Text style={styles.packageTitle}>{item.name}</Text>
      <FlatList
        data={item.durations}
        renderItem={({ item: durationItem }) =>
          renderDuration(durationItem, item.id)
        }
        keyExtractor={durationItem => durationItem.id.toString()}
      />
      <View style={{ justifyContent: "center", alignItems: "center" }}>
        <View style={{ width: "50%" }}>
          <TouchableOpacity
            onPress={() => openModal(item)}
            style={styles.addButton}>
            <FontAwesomeIcon icon={faPlus} size={20} color="#fff" />
            <Text style={styles.addButtonText}>Add Duration</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => openEditPackageModal(item)}
            style={styles.editButton}>
            <FontAwesomeIcon icon={faEdit} size={20} color="#fff" />
            <Text style={styles.editButtonText}>Edit Package</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => deletePackage(item)}
            style={styles.deleteButton}>
            <FontAwesomeIcon icon={faTrash} size={20} color="#fff" />
            <Text style={styles.deleteButtonText}>Delete Package</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  const addNewPackageDuration = () => {
    if (duration && price) {
      const newDurationId = newPackageDurations.length + 1;
      setNewPackageDurations([
        ...newPackageDurations,
        { id: newDurationId, duration, price: parseInt(price) },
      ]);
      setDuration('');
      setPrice(0);
    } else {
      Alert.alert('Error', 'Please enter both duration and price.');
    }
  };

  const createNewPackage = async () => {
    if (newPackageName && newPackageDurations.length > 0) {
      try {
        await firestore()
          .collection('packages')
          .doc(nextPackageId.toString())
          .set({
            id: nextPackageId,
            name: newPackageName,
            durations: newPackageDurations,
          });

        setCreatePackageModalVisible(false);
        setNewPackageName('');
        setNewPackageDurations([]);
        setNextPackageId(nextPackageId + 1);

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Package Created successfully!',
        });

      } catch (error) {
        console.error('Error creating package: ', error);
        Alert.alert('Error', 'Failed to create package. Please try again.');
      }
    } else {
      Alert.alert(
        'Error',
        'Please enter a package name and at least one duration.',
      );
    }
  };

  return (
    <View style={styles.container}>
      {packages.length > 0 ? (
        <FlatList
          data={packages}
          renderItem={renderPackage}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.emptyView}>
          <Text style={styles.emptyText}>
            Package Not Available
          </Text>
          <Text style={styles.emptySubtitle}>Create your first Package</Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => setCreatePackageModalVisible(true)}
        style={styles.createPackageButton}>
        <Text style={styles.createPackageButtonText}>Create New Package</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={editPackageModalVisible}
        onRequestClose={() => setEditPackageModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Package</Text>
            <TextInput
              placeholder="Enter Package Name"
              value={editedPackageName}
              onChangeText={setEditedPackageName}
              style={styles.input}
            />
            <TouchableOpacity onPress={updatePackage} style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Update Package</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditPackageModalVisible(false)}
              style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Add Duration for {selectedPackage?.name}
            </Text>
            <TextInput
              placeholder="Enter Duration"
              value={duration}
              onChangeText={setDuration}
              style={styles.input}
            />
            <TextInput
              placeholder="Enter Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              style={styles.input}
            />
            <TouchableOpacity
              onPress={addOrUpdateDuration}
              style={styles.saveButton}>
              <Text style={styles.saveButtonText}>
                {selectedDuration ? 'Update' : 'Save'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={createPackageModalVisible}
        onRequestClose={() => setCreatePackageModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Package</Text>
            <TextInput
              placeholder="Enter Package Name"
              value={newPackageName}
              onChangeText={setNewPackageName}
              style={styles.input}
            />
            <TextInput
              placeholder="Enter Duration"
              value={duration}
              onChangeText={setDuration}
              style={styles.input}
            />
            <TextInput
              placeholder="Enter Price"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
              style={styles.input}
            />
            <TouchableOpacity
              onPress={addNewPackageDuration}
              style={styles.addButton}>
              <Text style={styles.addButtonText}>Add Duration to Package</Text>
            </TouchableOpacity>

            <FlatList
              data={newPackageDurations}
              renderItem={({ item }) => (
                <View style={styles.durationContainer}>
                  <Text style={styles.durationText}>
                    {item.duration} - {item.price}
                  </Text>
                </View>
              )}
              keyExtractor={item => item.id.toString()}
              style={styles.durationsList}
            />

            <TouchableOpacity
              onPress={createNewPackage}
              style={styles.saveButton}>
              <Text style={styles.saveButtonText}>Create Package</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setCreatePackageModalVisible(false)}
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
  container: { flex: 1, padding: 20, backgroundColor: '#f0f0f0' },
  listContent: { paddingBottom: 20 },
  packageContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  packageTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  durationText: { fontSize: 16 },
  addButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  addButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  deleteButton: {
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  deleteButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },

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
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
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
  saveButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  cancelButton: {
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  cancelButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  durationsList: { marginTop: 10 },
  container: { flex: 1, padding: 20, backgroundColor: '#f0f0f0' },
  listContent: { paddingBottom: 20 },
  packageContainer: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  packageTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  durationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  durationText: { fontSize: 16 },
  durationActions: { flexDirection: 'row', alignItems: 'center' },
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
  createPackageButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
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
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
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
  saveButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  cancelButton: {
    backgroundColor: '#FF5722',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  cancelButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  durationsList: { marginTop: 10 },
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
});

export default AdminPackageManagement;
