import { Link } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import React from 'react';
import { ActivityIndicator, Alert, Button, Text, TextInput, View } from 'react-native';
import { auth, db } from '../../FirebaseConfig';

export default function Register() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const onRegister = async () => {
    if (!email || !password) {
      Alert.alert('Oops', 'Email dan password wajib diisi.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Oops', 'Konfirmasi password tidak sama.');
      return;
    }
    setLoading(true);
    try {
      // 1) Buat akun
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);

      // 2) Tulis profil user: users/{uid} → role default "member"
      const uid = cred.user.uid;
      await setDoc(
        doc(db, 'users', uid),
        {
          email: cred.user.email ?? email.trim(),
          role: 'member',
          createdAt: serverTimestamp(),
        },
        { merge: true } // aman kalau dipanggil ulang
      );

      // onAuthStateChanged di root akan melakukan redirect otomatis ke /(member) atau /(admin)
    } catch (e: any) {
      const code = e?.code || '';
      const msg =
        code === 'auth/email-already-in-use'
          ? 'Email sudah digunakan.'
          : code === 'auth/invalid-email'
          ? 'Format email tidak valid.'
          : code === 'auth/weak-password'
          ? 'Password terlalu lemah (min 6 karakter).'
          : 'Gagal mendaftar. Coba lagi.';
      Alert.alert('Register gagal', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, justifyContent: 'center', gap: 12 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', marginBottom: 8 }}>Daftar</Text>

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

      <TextInput
        placeholder="Konfirmasi Password"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
        style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 }}
      />

      {loading ? <ActivityIndicator /> : <Button title="Register" onPress={onRegister} />}

      <Text style={{ textAlign: 'center', marginTop: 12 }}>
        Sudah punya akun?{' '}
        <Link href="/(auth)/login" style={{ color: '#3366ff' }}>
          Login
        </Link>
      </Text>
    </View>
  );
}