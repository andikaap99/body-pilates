import { signOut } from 'firebase/auth';
import { Alert, Button, SafeAreaView, Text, View } from 'react-native';
import { auth } from '../../FirebaseConfig';

export default function Home() {
  const onLogout = async () => {
    try {
      await signOut(auth); // onAuthStateChanged di root akan redirect ke /(auth)/login
    } catch (e: any) {
      Alert.alert('Gagal logout', e?.message ?? 'Coba lagi.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '700' }}>Home (Tabs)</Text>
        <Button title="Logout" onPress={onLogout} />
      </View>
    </SafeAreaView>
  );
}