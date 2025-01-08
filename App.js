import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigation from './src/navigation/AppNavigation';
import Toast from 'react-native-toast-message'; // Import Toast component
import { createNotificationChannel, requestNotificationPermission, setupNotificationListeners } from './src/utils/notification';

export default function App() {
  React.useEffect(() => {
    // Setup notifications and permissions
    const setupNotifications = async () => {
      try {
        // Request notification permission from the user
        await requestNotificationPermission();
        
        // Create the notification channel (Android only)
        await createNotificationChannel();

        // Setup notification listeners (foreground and background)
        setupNotificationListeners();
      } catch (error) {
        console.error('Error during notification setup:', error);
      }
    };

    // Initialize notifications
    setupNotifications();
  }, []);

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
