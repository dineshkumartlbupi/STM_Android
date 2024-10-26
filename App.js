import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigation from "./src/navigation/AppNavigation";
import Toast from 'react-native-toast-message'; // Import Toast component

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <AppNavigation />
      </NavigationContainer>
      
      {/* Add Toast component here to make it accessible throughout the app */}
      <Toast />
    </GestureHandlerRootView>
  );
}
