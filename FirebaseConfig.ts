import { getApp, getApps, initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
// ^ pakai dari 'firebase/auth' (BUKAN 'firebase/auth/react-native')
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyCiHNGpMA2qst1cPqwe8IMcEHgBHUlqPEI',
  authDomain: 'body-pilates.firebaseapp.com',
  projectId: 'body-pilates',
  storageBucket: 'body-pilates.appspot.com',
  messagingSenderId: '400752138451',
  appId: '1:400752138451:web:cdc84c976aac3163825c26',

  databaseURL: 'https://body-pilates-default-rtdb.asia-southeast1.firebasedatabase.app',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let _auth;
try {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  _auth = getAuth(app);
}
export const auth = _auth;

export const db = getFirestore(app);
export const storage = getStorage(app);
export const dbRT = getDatabase(app);