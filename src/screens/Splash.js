import React, { useEffect } from 'react';
import { View, ImageBackground, StyleSheet } from 'react-native';
import { useNavigation } from "@react-navigation/native";
import LinearGradient from 'react-native-linear-gradient';
import auth from '@react-native-firebase/auth';

export default function SplashScreen() {
    const navigation = useNavigation();

    useEffect(() => {
        const unsubscribe = auth().onAuthStateChanged(user => {
            if (user) {
                console.log(user);
                navigation.navigate('Home');
            } else {
                navigation.navigate('SignIn');
            }
        });
        return () => unsubscribe();
    }, [navigation]);

    return (
        <LinearGradient colors={['#FFFFFF', '#FFFFFF']} style={styles.container}>
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ImageBackground
                    style={{
                        height: 200,
                        width: 180,
                    }}
                    source={require("../assets/STMfinal.jpg")} />
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
