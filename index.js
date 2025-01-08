/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import notifee from '@notifee/react-native';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Background notification event:', { type, detail });
  switch (type) {
    case notifee.EventType.DISMISSED:
      console.log('Notification dismissed by the user:', detail.notification);
      break;
    case notifee.EventType.ACTION_PRESS:
      console.log('Notification action pressed:', detail.notification);
      break;
    default:
      console.log('Other notification event:', { type, detail });
  }
});
AppRegistry.registerComponent(appName, () => App);
