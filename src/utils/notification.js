import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
import { PermissionsAndroid, Platform } from 'react-native';
/**
 * Request notification permissions and handle responses.
 * @returns {Promise<void>}
 */
export const requestNotificationPermission = async () => {
  try {
    let authStatus = null;

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      authStatus = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
      if (authStatus !== PermissionsAndroid.RESULTS.GRANTED) {
        console.log('Notification permission denied.');
        return;
      }
    } else {
      authStatus = await messaging().requestPermission();
    }
    // const authStatus = await messaging().requestPermission();

    const isEnabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (isEnabled) {
      console.log('Notification permissions granted.');
    } else {
      console.log('Notification permissions denied.');
    }

  } catch (error) {
    console.error('Error requesting notification permission:', error);
  }
};

/**
 * Get FCM token for the device.
 * @returns {Promise<string>}
 */
export const getFCMToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error fetching FCM token:', error);
    throw error;
  }
};

/**
 * Create a notification channel for Android.
 * @returns {Promise<void>}
 */
export const createNotificationChannel = async () => {
  try {
    await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    });
    console.log('Notification channel created.');
  } catch (error) {
    console.error('Error creating notification channel:', error);
  }
};

/**
 * Display a notification.
 * @param {string} title - Notification title.
 * @param {string} body - Notification body.
 * @returns {Promise<void>}
 */
export const displayNotification = async (title, body) => {
  console.log("displayNotification :: ",title,body);

  try {
    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: 'default',
        importance: AndroidImportance.HIGH,
        sound: 'default',
      },
    });
  } catch (error) {
    console.error('Error displaying notification:', error);
  }
};

/**
 * Handle foreground notifications.
 * @param {Object} remoteMessage - The received message.
 * @returns {Promise<void>}
 */
const handleForegroundNotification = async remoteMessage => {
  try {
    console.log('Foreground Notification:', remoteMessage);
    const { title, body } = remoteMessage.notification || {};
    if (title && body) {
      await displayNotification(title, body);
    }
  } catch (error) {
    console.error('Error handling foreground notification:', error);
  }
};

/**
 * Handle background notifications.
 * @param {Object} remoteMessage - The received message.
 * @returns {Promise<void>}
 */
const handleBackgroundNotification = async remoteMessage => {
  try {
    console.log('Background Notification:', remoteMessage);
    const { title, body } = remoteMessage.notification || {};
    if (title && body) {
      await displayNotification(title, body);
    }
  } catch (error) {
    console.error('Error handling background notification:', error);
  }
};

/**
 * Handle token refresh events.
 * @param {string} token - The refreshed FCM token.
 * @returns {void}
 */
const handleTokenRefresh = token => {
  console.log('FCM Token Refreshed:', token);
  // Optionally, send the token to your backend to update user data.
};

/**
 * Set up notification listeners for foreground and background events.
 * @returns {void}
 */
export const setupNotificationListeners = () => {
  try {
    // Listener for foreground notifications
    messaging().onMessage(handleForegroundNotification);

    // Listener for background notifications
    messaging().setBackgroundMessageHandler(handleBackgroundNotification);

    // Listener for token refresh
    messaging().onTokenRefresh(handleTokenRefresh);

    console.log('Notification listeners set up.');
  } catch (error) {
    console.error('Error setting up notification listeners:', error);
  }
};
