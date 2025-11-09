import { useLocalSearchParams, useNavigation } from 'expo-router';
import { off, onValue, ref } from 'firebase/database';
import React from 'react';
import { ActivityIndicator, SafeAreaView, Text, View } from 'react-native';
import { dbRT } from '../../../FirebaseConfig';

type ClassItem = {
  title?: string;
  date?: string;
  time?: string;
  slots?: number;
  participantsCount?: number;
};

export default function ClassDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();

  const [loading, setLoading] = React.useState(true);
  const [data, setData] = React.useState<ClassItem | null>(null);

  React.useLayoutEffect(() => {
    nav.setOptions({ headerShown: true, headerTitle: 'Detail Kelas' });
  }, [nav]);

  React.useEffect(() => {
    if (!id) return;
    const r = ref(dbRT, `classes/${id}`);
    const unsub = onValue(
      r,
      (snap) => {
        setData(snap.val() || null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => off(r, 'value', unsub as any);
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-slate-600">Data kelas tidak ditemukan.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="p-5">
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <Text className="text-2xl font-bold">{data.title ?? '-'}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}