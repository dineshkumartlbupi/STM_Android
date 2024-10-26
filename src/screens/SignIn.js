import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  BackHandler
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome';
import { faPhone } from '@fortawesome/free-solid-svg-icons';
import * as Animatable from 'react-native-animatable';
import Button from '../components/Button';
const { width } = Dimensions.get('window');
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignIn() {
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [confirmResult, setConfirmResult] = useState(null);
  const [otp, setOtp] = useState('');
  const [resendTimeout, setResendTimeout] = useState(60); // Timeout for resending OTP


  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp(); // Exit the app when the back button is pressed
      return true; // Return true to prevent the default behavior
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove(); // Cleanup the event listener when the component unmounts
  }, []);


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
  // Function to handle sending OTP



  const handleSendOTP = async () => {
    setLoading(true); // Start loading
    console.log("Send OTP process started");  // Debug: Initial log

    if (phoneNumber.length === 10) {
      console.log(`Phone number entered: ${phoneNumber}`);  // Debug: Phone number log

      const isPhoneNumberValid = await validateInDB(phoneNumber);
      console.log(`Phone number validation status: ${isPhoneNumberValid}`); // Debug: Validation status

      if (isPhoneNumberValid) {
        const fullPhoneNumber = `+91${phoneNumber}`; // Assuming country code is +91 (India)
        console.log(`Full phone number with country code: ${fullPhoneNumber}`); // Debug: Full phone number

        // OTP sending process with Firebase auth
        auth()
          .signInWithPhoneNumber(fullPhoneNumber)
          .then(confirmResult => {
            console.log("OTP sent successfully", confirmResult);  // Debug: OTP success response
            setConfirmResult(confirmResult);
            setResendTimeout(60); // Reset timeout for resending OTP
            startResendTimer();

            // Loader will continue until user completes reCAPTCHA and verifies OTP
            Alert.alert('OTP Sent!', 'Please check your phone.');
          })
          .catch(error => {
            setLoading(false); // Stop loading on error
            console.log("Error sending OTP:", error.message);  // Debug: Error log
            Alert.alert('Error', error.message);
          });
      } else {
        setLoading(false); // Stop loading
        console.log("Phone number not found in database");  // Debug: Phone number not found
        Alert.alert('Account not found', 'You are not authorized to access this resource');
      }
    } else {
      setLoading(false); // Stop loading
      console.log("Invalid phone number entered");  // Debug: Invalid number log
      Alert.alert('Invalid Number', 'Please enter a valid 10-digit phone number.');
    }
  };



  const handleConfirmOTP = async () => {
    if (otp.length === 6) {
      setLoading(true); // Start loading
      try {
        const userCredential = await confirmResult.confirm(otp);
        const user = userCredential.user; // Get the user object

        // Check if user document already exists
        const usersCollection = firestore().collection('users');
        const querySnapshot = await usersCollection
          .where('phoneNumber', '==', user.phoneNumber)
          .get();

        if (querySnapshot.empty) {
          // If user doesn't exist, create a new document
          await usersCollection.add({
            phoneNumber: user.phoneNumber,
            // Add other user details here (e.g., name, surname, shopName, etc.)
          });
        } else {
          console.log('User already exists in Firestore');
        }

        Alert.alert('Success!', 'You are now signed in.');
        setConfirmResult(null);
        setPhoneNumber('');

        // Save phone number to AsyncStorage (optional, but can be useful)
        await AsyncStorage.setItem('phoneNumber', user.phoneNumber);

        // Navigate to Home
        navigation.navigate('Home');
      } catch (error) {
        setLoading(false); // Stop loading
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } else {
      setLoading(false); // Stop loading
      Alert.alert('Invalid OTP', 'Please enter a valid 6-digit OTP.');
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

  // Render the component
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: 'white' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {!confirmResult ? (
            <View
              style={{
                padding: 20,
                flex: 1,
                justifyContent: 'space-between',
                backgroundColor: 'white',
              }}>
              <View style={{ marginTop: 50 }}>
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
                  Login Here
                </Animatable.Text>

                <View style={styles.inputContainer}>
                  <View style={styles.inputIcon}>
                    <FontAwesomeIcon icon={faPhone} size={20} color="grey" />
                  </View>
                  <TextInput
                    placeholder="Enter Your Registered Mobile Number"
                    placeholderTextColor="grey"
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                  />
                </View>
                <Button
                  onPress={handleSendOTP}
                  title={'Login'}
                  containerStyle={styles.button}
                />
                <Text
                  style={{
                    fontSize: 14,
                    textAlign: 'center',
                    fontWeight: '900',
                    color: 'black',
                  }}>
                  (OR)
                </Text>
                <Button
                  onPress={() => navigation.navigate('Signup')}
                  title={'Click for New Registration'}
                  containerStyle={styles.buttonOne}
                />
              </View>

              <Animatable.View
                animation="fadeInUp"
                duration={1500}
                delay={500}
                style={styles.servicesContainer}>
                <Image
                  source={require('../assets/servicecard.jpeg')}
                  style={{ width: width * 0.9, height: 200, borderRadius: 10 }} // Make image width responsive
                  resizeMode="contain"
                />
              </Animatable.View>
            </View>
          ) : (
            <View
              style={{
                padding: 20,
                flex: 1,
                justifyContent: 'space-between',
                backgroundColor: 'white',
              }}>
              <View style={{ marginTop: 50 }}>
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
                    onPress={handleSendOTP}
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
                  style={{ width: width * 0.9, height: 200, borderRadius: 10 }} // Make image width responsive
                  resizeMode="contain"
                />
              </Animatable.View>
            </View>
          )}
        </ScrollView>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // for Android
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    marginTop: 10,
    color: 'black',
  },
  inputContainer: {
    marginTop: 10,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E8E8E8',
    elevation: 5,
    backgroundColor: 'white',
    borderRadius: 5,
    marginBottom: 20,
  },
  inputIcon: {
    paddingHorizontal: 20,
  },
  input: {
    color: 'black',
    flex: 1,
    paddingVertical: 10,
  },
  button: {
    width: '100%',
    height: 'auto',
    padding: 10,
    borderRadius: 5,
  },
  buttonOne: {
    width: '100%',
    height: 'auto',
    padding: 10,
    borderRadius: 5,
    backgroundColor: 'orange',
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
});
