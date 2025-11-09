import { Link } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React from 'react';
import { ActivityIndicator, Alert, Button, Text, TextInput, View } from 'react-native';

// FirebaseConfig.ts kamu ada di root proyek
import { auth } from '../../FirebaseConfig';

export default function Login() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Oops', 'Email dan password wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Tidak perlu navigate: onAuthStateChanged di root akan redirect ke /(tabs)
    } catch (e: any) {
      const code = e?.code || '';
      const msg =
        code === 'auth/invalid-credential' || code === 'auth/wrong-password'
          ? 'Email atau password salah.'
          : code === 'auth/user-not-found'
          ? 'Akun tidak ditemukan.'
          : code === 'auth/too-many-requests'
          ? 'Terlalu banyak percobaan. Coba lagi nanti.'
          : 'Gagal login. Periksa koneksi atau coba lagi.';
      Alert.alert('Login gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Masuk</Text>

      <TextInput
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 }}
      />

      {loading ? (
        <ActivityIndicator />
      ) : (
        <Button title="Login" onPress={onLogin} />
      )}

      <View style={{ alignItems: 'center', marginTop: 12 }}>
        <Text>
          Belum punya akun?{' '}
          <Link href="/(auth)/register" style={{ color: '#3366ff' }}>
            Daftar
          </Link>
        </Text>
      </View>
    </View>
  );
}