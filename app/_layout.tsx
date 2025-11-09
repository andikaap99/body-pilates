import { Redirect, Stack } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { auth, db } from '../FirebaseConfig'; // pastikan export db di FirebaseConfig
import '../global.css';

export default function RootLayout() {
  const [authReady, setAuthReady] = React.useState(false);
  const [signedIn, setSignedIn] = React.useState<boolean | null>(null);
  const [role, setRole] = React.useState<'admin' | 'member' | null>(null);
  const [roleReady, setRoleReady] = React.useState(false);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setSignedIn(!!user);
      setRole(null);
      setRoleReady(false);

      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          const r = (snap.exists() && (snap.data() as any).role) || 'member';
          setRole(r === 'admin' ? 'admin' : 'member');
        } finally {
          setRoleReady(true);
        }
      }

      setAuthReady(true);
    });
    return unsub;
  }, []);

  // Loading states
  if (!authReady || (signedIn && !roleReady)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <>
      {!signedIn ? (
        <Redirect href="/(auth)/login" />
      ) : role === 'admin' ? (
        <Redirect href="/(admin)" />
      ) : (
        <Redirect href="/(member)" />
      )}

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="(member)" />
      </Stack>
    </>
  );
}
