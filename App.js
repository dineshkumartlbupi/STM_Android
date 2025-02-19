import React, {useEffect} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import AppNavigation from './src/navigation/AppNavigation';
import Toast from 'react-native-toast-message'; // Import Toast component
import VersionCheck from 'react-native-version-check';
import {
  createNotificationChannel,
  requestNotificationPermission,
  setupNotificationListeners,
} from './src/utils/notification';
import { Linking } from 'react-native';

export default function App() {
  useEffect(() => {
    VersionCheck.needUpdate().then(async res => {
      console.log(res.isNeeded); // true
      if (res.isNeeded) {
        Linking.openURL(res.storeUrl); // open store if update is needed.
      }
    });
  }, []);
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
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer>
        <AppNavigation />
      </NavigationContainer>

      {/* Add Toast component here to make it accessible throughout the app */}
      <Toast />
    </GestureHandlerRootView>
  );
}
