import { router, useNavigation } from 'expo-router';
import { signOut } from 'firebase/auth';
import { onValue, orderByChild, query, ref } from 'firebase/database';
import React from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { auth, dbRT } from '../../FirebaseConfig';

type ClassItem = {
  id: string;
  title: string;
  date: string;
  time: string;
  slots: number;
  participantsCount: number;
  createdAt?: number;
};

export default function MemberHome() {
  const nav = useNavigation();
  const [loading, setLoading] = React.useState(true);
  const [items, setItems] = React.useState<ClassItem[]>([]);

  React.useLayoutEffect(() => {
    nav.setOptions({
      headerShown: true,
      headerTitle: 'Member',
      headerRight: () => (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={async () => {
            try { await signOut(auth); } catch (e: any) { Alert.alert('Gagal logout', e?.message ?? 'Coba lagi.'); }
          }}
          className="px-3 py-2 rounded-lg"
        >
          <Text className="font-semibold">Logout</Text>
        </TouchableOpacity>
      ),
    });
  }, [nav]);

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(ref(dbRT, 'classes'), orderByChild('createdAt'));
    const unsub = onValue(
      q,
      (snap) => {
        const val = snap.val();
        if (!val) { setItems([]); setLoading(false); return; }
        const arr: ClassItem[] = Object.entries(val).map(([id, v]: any) => ({
          id,
          title: v.title ?? '',
          date:  v.date  ?? '',
          time:  v.time  ?? '',
          slots: Number(v.slots ?? 0),
          participantsCount: Number(v.participantsCount ?? 0),
          createdAt: Number(v.createdAt ?? 0),
        }));
        arr.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        setItems(arr);
        setLoading(false);
      },
      (err) => {
        // kalau sudah logout atau permission_denied saat transisi, jangan Alert
        if (!auth.currentUser || err?.code === 'PERMISSION_DENIED') return;
        console.log('RTDB read error:', err?.code, err?.message);
        Alert.alert('Error', err?.message ?? 'Gagal memuat data.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [auth.currentUser]);


  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="flex-1 p-5 gap-4">
        <Text className="text-2xl font-bold">Kelas Tersedia</Text>

        {loading ? (
          <View className="flex-1 items-center justify-center"><ActivityIndicator /></View>
        ) : items.length === 0 ? (
          <View className="bg-white rounded-2xl p-5 border border-slate-100 items-center">
            <Text className="text-slate-600">Belum ada kelas tersedia.</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }}>
            {items.map(item => (
              <View key={item.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-bold" numberOfLines={1}>{item.title}</Text>
                    <View className="flex-row gap-3 mt-1">
                      <Text className="text-slate-600 text-sm">📅 {item.date}</Text>
                      <Text className="text-slate-600 text-sm">⏰ {item.time} WIB</Text>
                    </View>
                  </View>

                  <View className="items-end shrink-0 min-w-[120px]">
                    <Text className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                      {item.participantsCount}/{item.slots} peserta
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.75}
                      onPress={() => router.push({ pathname: '/(member)/classes/[id]', params: { id: item.id } })}
                      className="mt-2 px-3 h-9 rounded-xl items-center justify-center bg-gray-900"
                    >
                      <Text className="text-white text-sm font-semibold">Detail</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}
