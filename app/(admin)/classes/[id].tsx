import { useLocalSearchParams, useNavigation } from 'expo-router';
import { onValue, ref } from 'firebase/database';
import React from 'react';
import { ActivityIndicator, Image, SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { dbRT } from '../../../FirebaseConfig';

type ClassData = {
  title?: string;
  date?: string;   // YYYY-MM-DD
  time?: string;   // HH:MM
  slots?: number;
  participantsCount?: number;
};

type Person = {
  uid: string;
  name?: string;
  joinedAt?: number;   // optional
};

export default function MemberClassDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();

  const [loading, setLoading] = React.useState(true);
  const [klass, setKlass] = React.useState<ClassData | null>(null);
  const [participants, setParticipants] = React.useState<Person[]>([]);
  const [checkins, setCheckins] = React.useState<Person[]>([]);
  const [tab, setTab] = React.useState<'checked' | 'all'>('checked');

  React.useLayoutEffect(() => {
    nav.setOptions({ headerShown: true, headerTitle: 'Detail Kelas' });
  }, [nav]);

  React.useEffect(() => {
    if (!id) return;

    // detail kelas
    const rClass = ref(dbRT, `classes/${id}`);
    const offClass = onValue(
      rClass,
      (snap) => {
        setKlass(snap.val() || null);
        setLoading(false);
      },
      (err) => {
        console.log('read class error:', err?.code, err?.message);
        setLoading(false);
      }
    );

    // daftar peserta
    const rParticipants = ref(dbRT, `classes/${id}/participants`);
    const offParticipants = onValue(
      rParticipants,
      (snap) => {
        const val = snap.val() || {};
        const arr: Person[] = Object.entries(val).map(([uid, v]: any) => ({
          uid,
          name: v?.name ?? 'Member',
          joinedAt: v?.joinedAt ?? null,
        }));
        setParticipants(arr);
      },
      (err) => console.log('read participants error:', err?.code, err?.message)
    );

    // yang sudah check-in
    const rCheckins = ref(dbRT, `classes/${id}/checkins`);
    const offCheckins = onValue(
      rCheckins,
      (snap) => {
        const val = snap.val() || {};
        const arr: Person[] = Object.entries(val).map(([uid, v]: any) => ({
          uid,
          name: v?.name ?? 'Member',
          joinedAt: v?.time ?? v?.checkedAt ?? null,
        }));
        setCheckins(arr);
      },
      (err) => console.log('read checkins error:', err?.code, err?.message)
    );

    return () => {
      offClass();
      offParticipants();
      offCheckins();
    };
  }, [id]);

  const totalSlots = klass?.slots ?? 0;
  const totalParticipants =
    klass?.participantsCount ??
    (participants?.length ?? 0); // fallback kalau belum set counter

  const list = tab === 'checked' ? checkins : participants;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  if (!klass) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-1 items-center justify-center p-5">
          <Text className="text-slate-600">Data kelas tidak ditemukan.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        {/* Judul */}
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <Text className="text-2xl font-bold">{klass.title ?? '-'}</Text>

          {/* QR code (sementara) */}
          <View className="items-center mt-4">
            <Image
              // sementara: generate QR dari id kelas
              source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=class:${id}` }}
              style={{ width: 220, height: 220, borderRadius: 12 }}
              resizeMode="contain"
            />
            <Text className="text-xs text-slate-500 mt-2">QR sementara (placeholder)</Text>
          </View>

          {/* Tabs */}
          <View className="mt-6 p-4 flex-row bg-indigo-600 rounded-xl p-1">
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setTab('checked')}
              className={`flex-1 h-10 rounded-lg items-center justify-center ${tab === 'checked' ? 'bg-white' : ''}`}
            >
              <Text className={`font-medium ${tab === 'checked' ? 'text-slate-900' : 'text-slate-600'}`}>
                Sudah Check-in ({checkins.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setTab('all')}
              className={`flex-1 h-10 rounded-lg items-center justify-center ${tab === 'all' ? 'bg-white' : ''}`}
            >
              <Text className={`font-medium ${tab === 'all' ? 'text-slate-900' : 'text-slate-600'}`}>
                Semua Pendaftar ({participants.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* List peserta */}
          <View className="mt-3">
            {list.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="text-slate-500 text-sm">
                  {tab === 'checked' ? 'Belum ada yang check-in.' : 'Belum ada pendaftar.'}
                </Text>
              </View>
            ) : (
              <View className="mt-1">
                {list.map((p) => (
                  <View
                    key={p.uid}
                    className="flex-row items-center justify-between py-3 border-b border-slate-100"
                  >
                    <Text className="text-slate-800">{p.name ?? p.uid}</Text>
                    {tab === 'checked' ? (
                      <Text className="text-xs text-slate-500">checked</Text>
                    ) : (
                      <Text className="text-xs text-slate-500">joined</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Ringkasan kelas */}
          <View className="mt-6 gap-2">
            <Text className="text-slate-700">
              Slot: <Text className="font-semibold">{totalParticipants}/{totalSlots}</Text>
            </Text>
            <Text className="text-slate-700">Tanggal: <Text className="font-semibold">{klass.date ?? '-'}</Text></Text>
            <Text className="text-slate-700">Jam: <Text className="font-semibold">{klass.time ?? '-'}</Text> WIB</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}