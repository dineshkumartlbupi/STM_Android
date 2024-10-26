import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

export default function Profile() {
    const navigation = useNavigation();
    const [loading, setLoading] = useState(true);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [userDetails, setUserDetails] = useState(null);

    
    useEffect(() => {
        const getUserDetails = async () => {
            try {
                const currentUser = auth().currentUser; // Get the currently authenticated user

                if (currentUser) {
                    const phoneNumber = currentUser.phoneNumber; // Get the phone number from the user object
                    setPhoneNumber(phoneNumber);

                    // Fetch user details from Firestore
                    const usersCollection = firestore().collection('users');
                    const querySnapshot = await usersCollection
                        .where('phoneNumber', '==', phoneNumber)
                        .get();

                    if (!querySnapshot.empty) {
                        const userData = querySnapshot.docs[0].data(); // Get user data
                        setUserDetails(userData);
                        console.log('User details:', userData);
                    } else {
                        console.log('No user found with this phone number');
                    }
                } else {
                    // If no user is logged in, navigate to SignIn
                    navigation.navigate('SignIn');
                }
            } catch (error) {
                console.error('Failed to fetch user details:', error);
            } finally {
                setLoading(false); // Stop the loading spinner
            }
        };

        getUserDetails();
    }, []);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to log out?',
            [
                {
                    text: 'Cancel',
                    onPress: () => console.log('Logout canceled'),
                    style: 'cancel', // Optional: Makes the cancel button appear in a different style
                },
                {
                    text: 'OK',
                    onPress: async () => {
                        try {
                            await auth().signOut(); // Sign out from Firebase
                            navigation.navigate('SignIn'); // Navigate to the SignIn screen
                        } catch (error) {
                            console.error('Error logging out: ', error);
                        }
                    },
                },
            ],
            { cancelable: false } // Prevents closing the alert by tapping outside of it
        );
    };



    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0000ff" />
                <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <ImageBackground
                source={require('../assets/user.png')}
                style={styles.profileImage}
                imageStyle={{ borderRadius: 60 }}
            ></ImageBackground>
            <Text style={styles.header}>User Profile</Text>

            {userDetails ? (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Personal Details</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Surname:</Text>
                        <Text style={styles.value}>{userDetails.surname}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Name:</Text>
                        <Text style={styles.value}>{userDetails.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Phone Number:</Text>
                        <Text style={styles.value}>{phoneNumber}</Text>
                    </View>

                    <Text style={styles.sectionTitle}>Shop Details</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Shop Name:</Text>
                        <Text style={styles.value}>{userDetails.shopName}</Text>
                    </View>
                </View>
            ) : (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Personal Details</Text>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Phone Number:</Text>
                        <Text style={styles.value}>{phoneNumber}</Text>
                    </View>
                </View>
            )}
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#ADD8E6',
    },
    profileImage: {
        width: 120,
        height: 120,
        alignSelf: "center",
        marginTop: 20,
        marginBottom: 20,
    },

    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
        paddingBottom: 5,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: 'green',
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        color: 'blue',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f2f2f2',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    noDetailsText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: '900',
        color: 'red',
    },

    logoutButton: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    }

});
