// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDdjZH8y0HNwo_WUF9U9-t7sxvgTe_QLwk",
  authDomain: "sathwika-trade-media.firebaseapp.com",
  projectId: "sathwika-trade-media",
  storageBucket: "sathwika-trade-media.appspot.com",
  messagingSenderId: "889258066142",
  appId: "1:889258066142:android:aeb4683f2f525238d6024f",
  measurementId: "G-ZJ8VXVLWXK"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
const storage = getStorage(app);

export { app, db, auth, storage };
