import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
  faCheck,
  faChevronCircleDown,
  faChevronCircleLeft,
  faCross,
  faPhone,
  faShop,
  faUser,
  faWindowClose,
} from '@fortawesome/free-solid-svg-icons';
import * as Animatable from 'react-native-animatable';
import Button from '../components/Button';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import Modal from 'react-native-modal';
const {width} = Dimensions.get('window');
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import {getFCMToken} from '../utils/notification';

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState([]);
  const navigation = useNavigation();
  const [confirmResult, setConfirmResult] = useState(null);
  const [otp, setOtp] = useState('');
  const [resendTimeout, setResendTimeout] = useState(60);

  const [surname, setSurname] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shopName, setShopName] = useState('');
  const [villageCity, setVillageCity] = useState('');
  const [street, setStreet] = useState('');
  const [mandal, setMandal] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');

  const [selectedPackages, setSelectedPackages] = useState([]);
  const [selectedDurations, setSelectedDurations] = useState({});
  const [isPackageDropdownVisible, setPackageDropdownVisible] = useState(false);
  const [isDurationDropdownVisible, setDurationDropdownVisible] = useState({});

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
      });

    return () => unsubscribe();
  }, []);

  const validateFields = () => {
    if (
      !surname ||
      !name ||
      !phoneNumber ||
      !shopName ||
      !villageCity ||
      !street ||
      !mandal ||
      !district ||
      !state
    ) {
      Alert.alert('Error', 'Please fill in all fields.');
      return false;
    }

    if (!/^\d{10}$/.test(phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number.');
      return false;
    }

    if (selectedPackages.length === 0) {
      Alert.alert('Error', 'Please select at least one package.');
      return false;
    }

    for (const pkg of selectedPackages) {
      if (!selectedDurations[pkg]) {
        Alert.alert(
          'Error',
          `Please select a duration for the package: ${
            packages.find(p => p.id === pkg)?.name || ''
          }`,
        );
        return false;
      }
    }

    return true;
  };

  const toggleDurationDropdown = packageValue => {
    setDurationDropdownVisible(prevState => ({
      ...prevState,
      [packageValue]: !prevState[packageValue],
    }));
  };

  const closeDurationDropdown = packageValue => {
    setDurationDropdownVisible(prevState => ({
      ...prevState,
      [packageValue]: false,
    }));
  };

  const handlePackageSelection = value => {
    setSelectedPackages(prev => {
      if (prev.includes(value)) {
        const updatedPackages = prev.filter(pkg => pkg !== value);
        setSelectedDurations(prevDurations => {
          const {[value]: _, ...rest} = prevDurations;
          return rest;
        });
        return updatedPackages;
      } else {
        return [...prev, value];
      }
    });
  };

  const handleDurationSelection = (packageValue, durationValue) => {
    setSelectedDurations(prev => ({
      ...prev,
      [packageValue]: durationValue,
    }));
  };

  const validateInDB = async phoneNumber => {
    try {
      setLoading(true);
      const usersCollection = firestore().collection('users');
      const querySnapshot = await usersCollection
        .where('phoneNumber', '==', phoneNumber)
        .get();
      setLoading(false);
      if (!querySnapshot.empty) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Error checking phone number in Firestore:', error);
      setLoading(false);
      return false;
    }
  };
  const handleSubmit = async () => {
    if (validateFields()) {
      setLoading(true);
      if (phoneNumber.length === 10) {
        const fullPhoneNumber = `+91${phoneNumber}`;
        const isPhoneNumberValid = await validateInDB(phoneNumber);
        if (isPhoneNumberValid) {
          auth()
            .signInWithPhoneNumber(fullPhoneNumber)
            .then(confirmResult => {
              setLoading(false);
              setConfirmResult(confirmResult);
              setResendTimeout(60);
              startResendTimer();
              Alert.alert('OTP Sent!', 'Please check your phone.');
            })
            .catch(error => {
              setLoading(false);
              console.log(error.message);
              Alert.alert('Error', error.message);
            });
        } else {
          setLoading(false); // Start loading
          Alert.alert(
            'Account not found',
            'You are not authorized to access this resource',
          );
        }
      } else {
        setLoading(false);
        Alert.alert(
          'Invalid Number',
          'Please enter a valid 10-digit phone number.',
        );
      }
    }
  };

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
  const handleConfirmOTP = async () => {
    if (validateFields()) {
      if (phoneNumber.length === 10) {
        const token = await getFCMToken();
        let totalPrice = 0;
        let totalPackagesWithDurationsAndPrice = [];

        // Iterate over the selected packages
        selectedPackages.forEach(pkgId => {
          // Find the corresponding package object by its ID
          const pkg = packages.find(p => p.id === pkgId);

          if (pkg) {
            // Get the selected duration index for this package
            const selectedDurationIndex = selectedDurations[pkgId.toString()];

            // Find the selected duration within the package
            const selectedDuration = pkg.durations.find(
              d => d.id === selectedDurationIndex,
            );

            if (selectedDuration) {
              console.log(
                `Package: ${pkg.name}, Duration: ${selectedDuration.duration}, Price: ${selectedDuration.price}`,
              );
              totalPrice += parseFloat(selectedDuration.price);

              // Store the package, duration, and price details
              totalPackagesWithDurationsAndPrice.push({
                packageName: pkg.name,
                duration: selectedDuration.duration,
                price: parseFloat(selectedDuration.price),
              });
            } else {
              console.error(
                `Selected duration with index ${selectedDurationIndex} not found for package ${pkg.name}`,
              );
            }
          } else {
            console.error(`Package with ID ${pkgId} not found`);
          }
        });

        console.log(
          'Total Packages with Durations and Price:',
          totalPackagesWithDurationsAndPrice,
        );
        // Log the total price
        console.log(`Total Price: ${totalPrice}`);
        setLoading(true);

        try {
          const usersCollection = firestore().collection('users');

          // Query Firestore to check if the user already exists
          const userSnapshot = await usersCollection
            .where('phoneNumber', '==', phoneNumber)
            .get();

          if (!userSnapshot.empty) {
            // Update existing user data
            const existingUserId = userSnapshot.docs[0].id; // Get the ID of the existing user
            await usersCollection.doc(existingUserId).update({
              surname: surname,
              name: name,
              shopName: shopName,
              address: {
                villageCity: villageCity,
                street: street,
                mandal: mandal,
                district: district,
                state: state,
              },
              packages: totalPackagesWithDurationsAndPrice, // Save packages with durations and prices
              fcmToken: token,
            });

            console.log('User data updated in Firestore!');
            Alert.alert('Success!', 'Proceed to Pay!');
            navigation.navigate('Payment', {
              amount: totalPrice,
              selectedPackages: totalPackagesWithDurationsAndPrice, // Pass this to Payment screen
            });
          } else {
            // Create a new user if phone number is not in use
            const randomId = generateRandomuid();
            await usersCollection.doc(randomId).set({
              surname: surname,
              name: name,
              phoneNumber: phoneNumber,
              shopName: shopName,
              address: {
                villageCity: villageCity,
                street: street,
                mandal: mandal,
                district: district,
                state: state,
              },
              packages: totalPackagesWithDurationsAndPrice, // Save packages with durations and prices
              userid: randomId,
              fcmToken: token,
            });

            console.log('User data added to Firestore!');
            Alert.alert('Success!', 'Account created successfully!');
            navigation.navigate('Payment', {
              amount: totalPrice,
              selectedPackages: totalPackagesWithDurationsAndPrice, // Pass this to Payment screen
            });
          }
        } catch (error) {
          console.error(
            'Error adding/updating user data in Firestore: ',
            error,
          );
          Alert.alert('Error', 'Failed to save data. Please try again.');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
        Alert.alert(
          'Invalid Number',
          'Please enter a valid 10-digit phone number.',
        );
      }
    }
  };

  // Function to start the resend timer
  const startResendTimer = () => {
    const intervalId = setInterval(() => {
      setResendTimeout(prevTimeout => {
        if (prevTimeout <= 1) {
          clearInterval(intervalId);
          return 0;
        }
        return prevTimeout - 1;
      });
    }, 1000);
  };

  const renderPackageItem = item => (
    <TouchableOpacity
      key={item.id}
      style={styles.item}
      onPress={() => handlePackageSelection(item.id)}>
      <Text style={styles.textItem}>{item.name}</Text>
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

  const renderDurationItem = (packageValue, item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.item}
      onPress={() => handleDurationSelection(packageValue, item.id)}>
      <Text style={styles.textItem}>
        {item.duration} ₹{item.price}
      </Text>
      {selectedDurations[packageValue] === item.id && (
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
    <View style={{flex: 1}}>
   
      <KeyboardAwareScrollView
        style={{flex: 1, backgroundColor: '#f6fbff'}}
        contentContainerStyle={{flexGrow: 1, padding: 20}}
        extraScrollHeight={150}>
             <View>
        <TouchableOpacity onPress={() => navigation.pop()}>
          <FontAwesomeIcon icon={faChevronCircleLeft} size={30} color="black" />
        </TouchableOpacity>
      </View>
        {!confirmResult ? (
          <>
            <Animatable.Text
              animation="bounceInLeft"
              duration={1500}
              style={styles.title}>
              Register Here
            </Animatable.Text>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <FontAwesomeIcon icon={faUser} size={20} color="grey" />
              </View>
              <TextInput
                placeholder="Enter Your Surname"
                placeholderTextColor="grey"
                style={styles.input}
                onChangeText={setSurname}
                value={surname}
              />
            </View>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <FontAwesomeIcon icon={faUser} size={20} color="grey" />
              </View>
              <TextInput
                placeholder="Enter Your Name"
                placeholderTextColor="grey"
                style={styles.input}
                onChangeText={setName}
                value={name}
              />
            </View>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <FontAwesomeIcon icon={faPhone} size={20} color="grey" />
              </View>
              <TextInput
                placeholder="Enter Your Mobile Number"
                placeholderTextColor="grey"
                style={styles.input}
                onChangeText={setPhoneNumber}
                value={phoneNumber}
              />
            </View>
            <View style={styles.inputContainer}>
              <View style={styles.inputIcon}>
                <FontAwesomeIcon icon={faShop} size={20} color="grey" />
              </View>
              <TextInput
                placeholder="Enter Your Shop Name"
                placeholderTextColor="grey"
                style={styles.input}
                onChangeText={setShopName}
                value={shopName}
              />
            </View>
            <Text style={{fontSize: 18, fontWeight: '600', color: 'black'}}>
              Enter your Address:
            </Text>
            <View style={styles.inputContainerAddress}>
              <View>
                <TextInput
                  placeholder="Village/City"
                  placeholderTextColor="grey"
                  style={styles.input}
                  onChangeText={setVillageCity}
                  value={villageCity}
                />
                <View
                  style={{
                    width: 300,
                    borderBottomWidth: 1,
                    borderBottomColor: 'grey',
                  }}
                />
                <TextInput
                  placeholder="Street"
                  placeholderTextColor="grey"
                  style={styles.input}
                  onChangeText={setStreet}
                  value={street}
                />
                <View
                  style={{
                    width: 300,
                    borderBottomWidth: 1,
                    borderBottomColor: 'grey',
                  }}
                />
                <TextInput
                  placeholder="Mandal"
                  placeholderTextColor="grey"
                  style={styles.input}
                  onChangeText={setMandal}
                  value={mandal}
                />
                <View
                  style={{
                    width: 300,
                    borderBottomWidth: 1,
                    borderBottomColor: 'grey',
                  }}
                />
                <TextInput
                  placeholder="District"
                  placeholderTextColor="grey"
                  style={styles.input}
                  onChangeText={setDistrict}
                  value={district}
                />
                <View
                  style={{
                    width: 300,
                    borderBottomWidth: 1,
                    borderBottomColor: 'grey',
                  }}
                />
                <TextInput
                  placeholder="State"
                  placeholderTextColor="grey"
                  style={styles.input}
                  onChangeText={setState}
                  value={state}
                />
              </View>
            </View>
            <Text style={{fontSize: 18, fontWeight: '600', color: 'black'}}>
              Packages:
            </Text>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() =>
                setPackageDropdownVisible(!isPackageDropdownVisible)
              }>
              <Text style={styles.textDropdown}>
                {selectedPackages.length > 0
                  ? selectedPackages
                      .map(pkg => packages.find(p => p.id === pkg)?.name || '')
                      .join(', ')
                  : 'Select package(s)'}
              </Text>
              <FontAwesomeIcon icon={faChevronCircleDown} size={20} />
            </TouchableOpacity>
            <Modal isVisible={isPackageDropdownVisible}>
              <View style={styles.modalContent}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                  }}>
                  <TouchableOpacity
                    onPress={() => setPackageDropdownVisible(false)}>
                    <FontAwesomeIcon
                      icon={faWindowClose}
                      color="black"
                      size={30}
                    />
                  </TouchableOpacity>
                </View>
                {packages.map(pkg => renderPackageItem(pkg))}

                <Button
                  title={'Save'}
                  containerStyle={styles.button}
                  onPress={() => setPackageDropdownVisible(false)}
                />
              </View>
            </Modal>

            {selectedPackages.map(packageValue => (
              <View key={packageValue}>
                <Text style={styles.durationLabel}>
                  Duration for {packages.find(p => p.id === packageValue)?.name}
                  :
                </Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => toggleDurationDropdown(packageValue)}>
                  <Text style={styles.textDropdown}>
                    {selectedDurations[packageValue]
                      ? packages
                          .find(pkg => pkg.id === packageValue)
                          .durations.find(
                            dur => dur.id === selectedDurations[packageValue],
                          ).duration
                      : 'Select duration'}
                  </Text>
                  <FontAwesomeIcon icon={faChevronCircleDown} size={20} />
                </TouchableOpacity>
                <Modal isVisible={isDurationDropdownVisible[packageValue]}>
                  <View style={styles.modalContent}>
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'flex-end',
                      }}>
                      <TouchableOpacity
                        onPress={() => closeDurationDropdown(packageValue)}>
                        <FontAwesomeIcon
                          icon={faWindowClose}
                          color="black"
                          size={30}
                        />
                      </TouchableOpacity>
                    </View>
                    {packages
                      .find(pkg => pkg.id === packageValue)
                      .durations.map(duration =>
                        renderDurationItem(packageValue, duration),
                      )}

                    <Button
                      title={'Save'}
                      containerStyle={styles.button}
                      onPress={() => closeDurationDropdown(packageValue)}
                    />
                  </View>
                </Modal>
              </View>
            ))}

            <Button
              onPress={handleConfirmOTP}
              title={'Submit'}
              containerStyle={styles.button}
            />
          </>
        ) : (
          <View
            style={{
              padding: 20,
              flex: 1,
              justifyContent: 'space-between',
              backgroundColor: 'white',
            }}>
            <View style={{marginTop: 50}}>
              <Animatable.View
                animation="bounceInRight"
                duration={1500}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 20,
                }}>
                <Image
                  source={require('../assets/STMfinal.jpg')}
                  style={[styles.logo, styles.shadowEffect]}
                />
              </Animatable.View>
              <Animatable.Text
                animation="bounceInLeft"
                duration={1500}
                style={styles.title}>
                Enter OTP
              </Animatable.Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputIcon}>
                  <FontAwesomeIcon icon={faPhone} size={20} color="grey" />
                </View>
                <TextInput
                  placeholderTextColor="grey"
                  style={styles.input}
                  placeholder="OTP"
                  keyboardType="number-pad"
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>
              <Button
                onPress={handleConfirmOTP}
                title={'Verify OTP'}
                containerStyle={styles.button}
              />
              {resendTimeout > 0 ? (
                <Text style={styles.resendText}>
                  Resend OTP in {resendTimeout} seconds
                </Text>
              ) : (
                <Button
                  onPress={handleSubmit}
                  title={'Resend OTP'}
                  containerStyle={styles.buttonResend}
                />
              )}
            </View>

            <Animatable.View
              animation="fadeInUp"
              duration={1500}
              delay={500}
              style={styles.servicesContainer}>
              <Image
                source={require('../assets/servicecard.jpeg')}
                style={{width: width * 0.8, height: 200, borderRadius: 10}} // Make image width responsive
                resizeMode="contain"
              />
            </Animatable.View>
          </View>
        )}
      </KeyboardAwareScrollView>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </View>
  );
}

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
  logo: {
    width: 100,
    height: 120,
  },
  shadowEffect: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // for Android
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    color: 'black',
  },
  inputContainer: {
    marginTop: 10,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'grey',
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 10,
  },
  inputContainerAddress: {
    paddingHorizontal: 10,
    marginTop: 10,
    width: '100%',
    height: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'grey',
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 10,
  },
  inputIcon: {
    paddingHorizontal: 20,
  },
  input: {
    color: 'black',
    flex: 1,
  },
  button: {
    width: '100%',
    height: 'auto',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20, // Adjust margin as needed
  },
  icon: {
    marginRight: 5,
  },
  textItem: {
    color: 'black',
    fontWeight: '500',
    flex: 1,
    fontSize: 16,
  },
  selectedTextStyle: {
    fontSize: 16,
    color: 'black',
    fontWeight: '600',
  },

  buttonResend: {
    width: '100%',
    height: 'auto',
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'red',
  },
  resendText: {
    textAlign: 'center',
    color: 'grey',
    marginTop: 10,
  },
  servicesContainer: {
    alignItems: 'center',
  },
  textLabel: {
    fontSize: 18,
    marginBottom: 10,
  },
  textInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    color: 'black',
    borderWidth: 1,
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  textDropdown: {
    color: 'black',
    fontSize: 16,
  },
  durationLabel: {
    fontSize: 16,
    color: 'black',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textPackage: {
    color: 'grey',
    fontSize: 18,
    marginBottom: 10,
  },
  icon: {
    marginLeft: 10,
  },
});
