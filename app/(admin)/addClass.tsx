import { useNavigation } from 'expo-router';
import { push, ref, serverTimestamp, set } from 'firebase/database';
import React from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { auth, dbRT } from '../../FirebaseConfig';

export default function AddClass() {
  const nav = useNavigation();

  const [title, setTitle] = React.useState('');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('');
  const [slots, setSlots] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  React.useLayoutEffect(() => {
    nav.setOptions({ headerShown: true, headerTitle: 'Tambah Kelas' });
  }, [nav]);

  const onSubmit = async () => {
    if (!title || !date || !time || !slots) {
      Alert.alert('Validasi', 'Semua field wajib diisi.');
      return;
    }
    const nSlots = Number(slots);
    if (!Number.isFinite(nSlots) || nSlots <= 0) {
      Alert.alert('Validasi', 'Jumlah slot harus angka > 0.');
      return;
    }
    if (!auth.currentUser) {
      Alert.alert('Auth', 'Sesi login tidak ditemukan.');
      return;
    }

    setSaving(true);
    try {
      const classesRef = ref(dbRT, 'classes');
      const newRef = push(classesRef);
      await set(newRef, {
        title: title.trim(),
        date: date.trim(),
        time: time.trim(),
        slots: nSlots,
        participantsCount: 0,
        createdBy: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      setTitle(''); setDate(''); setTime(''); setSlots('');
      Alert.alert('Sukses', 'Kelas berhasil ditambahkan.');
    } catch (e: any) {
      console.log('RTDB write error:', e?.code, e?.message);
      Alert.alert('Error', e?.message ?? 'Gagal menambahkan kelas (cek Rules/URL).');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50"
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <View className="flex-1 p-5">
        <View className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <Text className="text-xl font-bold mb-4">Form Kelas</Text>

          <View className="gap-3">
            <View>
              <Text className="text-sm text-slate-600 mb-1">Judul Kelas</Text>
              <TextInput
                placeholder="Pilates Core Strength"
                value={title}
                onChangeText={setTitle}
                className="border border-slate-300 rounded-xl px-3 py-2 bg-white"
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm text-slate-600 mb-1">Tanggal (YYYY-MM-DD)</Text>
                <TextInput
                  placeholder="2025-11-07"
                  autoCapitalize="none"
                  value={date}
                  onChangeText={setDate}
                  className="border border-slate-300 rounded-xl px-3 py-2 bg-white"
                />
              </View>
              <View className="w-32">
                <Text className="text-sm text-slate-600 mb-1">Jam (HH:MM)</Text>
                <TextInput
                  placeholder="19:00"
                  autoCapitalize="none"
                  value={time}
                  onChangeText={setTime}
                  className="border border-slate-300 rounded-xl px-3 py-2 bg-white"
                />
              </View>
            </View>

            <View className="flex-row gap-3 items-end">
              <View className="flex-1">
                <Text className="text-sm text-slate-600 mb-1">Jumlah Slot</Text>
                <TextInput
                  placeholder="10"
                  keyboardType="number-pad"
                  value={slots}
                  onChangeText={setSlots}
                  className="border border-slate-300 rounded-xl px-3 py-2 bg-white"
                />
              </View>

              <View className="flex-1 opacity-70">
                <Text className="text-sm text-slate-600 mb-1">Jumlah Pendaftar (otomatis)</Text>
                <View className="border border-slate-300 rounded-xl px-3 py-2 bg-slate-100">
                  <Text>0</Text>
                </View>
              </View>
            </View>

            <Pressable
              onPress={onSubmit}
              disabled={saving}
              className="mt-2 h-12 rounded-2xl items-center justify-center bg-indigo-600 active:bg-indigo-700"
            >
              <Text className="text-white font-semibold">{saving ? 'Menyimpan…' : 'Simpan'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}