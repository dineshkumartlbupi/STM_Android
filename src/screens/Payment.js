import React from 'react';
import {
  View,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  StyleSheet,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import * as Animatable from 'react-native-animatable';
import Button from '../components/Button';
import {TouchableOpacity} from 'react-native-gesture-handler';
import {faArrowRight} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-native-fontawesome';
import {
 faEdit
} from '@fortawesome/free-solid-svg-icons';
export default function Payment({route}) {
  const {amount, selectedPackages } = route.params;
  const navigation = useNavigation();
  const goToHome = () => {
    navigation.navigate('SignIn');
  };
  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: 'white'}}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.paymentContainer}>
      <Text style={styles.title}>Payment Summary</Text>
      {selectedPackages.map((pkg, index) => (
        <View key={index} style={styles.packageContainer}>
          <Text style={styles.packageText}>Package:<Text style={{fontSize:10, fontWeight:'600'}}>{pkg.packageName}</Text> </Text>
          <Text style={styles.packageText}>Duration:<Text style={{fontSize:10, fontWeight:'600'}}>{pkg.duration}</Text> </Text>
          <Text style={styles.packageText}>Price:<Text style={{fontSize:10, fontWeight:'600'}}>₹{pkg.price}</Text> </Text>
        </View>
      ))}
      <Text style={styles.totalText}>Total Amount: ₹{amount}</Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Image
          source={require('../assets/payment.jpeg')}
          style={{width: 160, height: 200, borderRadius: 10}}
        />
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text style={{fontSize: 22, fontFamily: '900', color: 'black'}}>
          OR
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text style={{fontSize: 22, fontWeight: '900', color: 'black'}}>
          Phone Pay/ Google Pay/ Paytm
        </Text>
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text
          style={{
            fontSize: 28,
            fontWeight: '900',
            color: 'blue',
          }}>
          8790720978
        </Text>
        
      </View>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 50,
        }}>
        <Text style={{fontSize: 14, fontWeight: '900', color: 'red'}}>
          Call For Confirmation : 7799062722
        </Text>
      </View>

      <View style={styles.container}>
        <TouchableOpacity style={styles.button} onPress={goToHome}>
          <Text style={styles.buttonText}>Proceed to Sign In</Text>
          <FontAwesomeIcon icon={faArrowRight} style={styles.icon} size={20} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  paymentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 24,
  },
  amount: {
    fontSize: 20,
    color: 'green',
  },
  container: {
    alignItems: 'center',
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  icon: {
    color: '#fff',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  packageContainer: {
    flexDirection:'row',
    justifyContent:"space-between",
    alignItems:'center',
    marginBottom: 15,
  },
  packageText: {
    fontSize: 10,
    color: 'black',
  },
  totalText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 20,
    color: 'green',
  },
});
