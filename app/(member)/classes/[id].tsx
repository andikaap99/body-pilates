import { useLocalSearchParams, useNavigation } from 'expo-router';
import { onValue, ref } from 'firebase/database';
import React from 'react';
import { ActivityIndicator, SafeAreaView, Text, View } from 'react-native';
import { dbRT } from '../../../FirebaseConfig';

type ClassItem = { title?: string };

export default function MemberClassDetail() {
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
    const unsub = onValue(r, (snap) => {
      setData(snap.val() || null);
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="p-5">
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <Text className="text-2xl font-bold">{data?.title ?? '-'}</Text>
          <Text className="text-slate-600 mt-2">Halaman detail (payment) – coming soon.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
