// app/(member)/classes/[id].tsx
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { onValue, ref } from 'firebase/database';
import { doc, getDoc } from 'firebase/firestore';
import React from 'react';
import { ActivityIndicator, Alert, SafeAreaView, Text, TouchableOpacity, View } from 'react-native';
import { auth, db, dbRT } from '../../../FirebaseConfig';

type ClassData = {
  title?: string;
  date?: string;   // YYYY-MM-DD
  time?: string;   // HH:MM
  slots?: number;
  participantsCount?: number;
  price?: number;  // optional: kalau belum ada, kita fallback
};

export default function MemberClassDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const nav = useNavigation();

  const [loading, setLoading] = React.useState(true);
  const [klass, setKlass]   = React.useState<ClassData | null>(null);
  const [paying, setPaying] = React.useState(false);

  // state profil user untuk payment
  const [custName, setCustName]   = React.useState<string>('Member');
  const [custEmail, setCustEmail] = React.useState<string>('member@example.com');

  React.useLayoutEffect(() => {
    nav.setOptions({ headerShown: true, headerTitle: 'Detail Kelas' });
  }, [nav]);

  // Ambil data kelas
  React.useEffect(() => {
    if (!id) return;
    const r = ref(dbRT, `classes/${id}`);
    const unsub = onValue(
      r,
      (snap) => {
        setKlass(snap.val() || null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [id]);

  // Ambil data user (auth + Firestore users/{uid})
  React.useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;

    // default dari auth
    const authName  = u.displayName || 'Member';
    const authEmail = u.email || 'member@example.com';
    setCustName(authName);
    setCustEmail(authEmail);

    // coba override dari Firestore users/{uid} jika ada
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'users', u.uid));
        if (snap.exists()) {
          const d = snap.data() as any;
          if (d?.name && typeof d.name === 'string') setCustName(d.name);
          if (d?.email && typeof d.email === 'string') setCustEmail(d.email);
        }
      } catch {
        // diamkan saja: fallback tetap pakai nilai dari auth
      }
    })();
  }, []);

  const onPay = async () => {
    try {
      if (!id) return;
      const baseUrl = process.env.EXPO_PUBLIC_PAYMENTS_URL;
      if (!baseUrl) {
        Alert.alert('Config', 'EXPO_PUBLIC_PAYMENTS_URL belum diset.');
        return;
      }

      // tentukan harga (fallback 50000 kalau belum ada di data kelas)
      const amount = Number(klass?.price ?? 50000);
      const orderId = `cls_${id}_${Date.now()}`;

      setPaying(true);
      const resp = await fetch(`${baseUrl}/create-transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          amount,
          customer: {
            firstName: custName || 'Member',
            email: custEmail || 'member@example.com',
          },
          items: [
            { id: String(id), price: amount, quantity: 1, name: klass?.title ?? 'Pilates Class' },
          ],
          // kalau mau QRIS only di server: enabled_payments: ['qris']
        }),
      });

      // robust parsing (biar errornya jelas kalau bukan JSON)
      const text = await resp.text();
      let json: any = null;
      try { json = JSON.parse(text); } catch { /* ignore */ }

      if (!resp.ok || !json?.redirectUrl) {
        throw new Error(json?.error || `Gagal membuat transaksi (status ${resp.status}).`);
      }

      router.push({ pathname: '/(member)/pay', params: { url: json.redirectUrl, orderId } });
    } catch (e: any) {
      Alert.alert('Pembayaran', e?.message ?? 'Gagal membuat transaksi.');
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <View className="p-5">
        <View className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <Text className="text-2xl font-bold">{klass?.title ?? '-'}</Text>

          <View className="mt-3 gap-1">
            <Text className="text-slate-700">
              Slot: <Text className="font-semibold">{klass?.participantsCount ?? 0}/{klass?.slots ?? 0}</Text>
            </Text>
            <Text className="text-slate-700">Tanggal: <Text className="font-semibold">{klass?.date ?? '-'}</Text></Text>
            <Text className="text-slate-700">Jam: <Text className="font-semibold">{klass?.time ?? '-'}</Text> WIB</Text>
            <Text className="text-slate-700">Harga: <Text className="font-semibold">Rp {(klass?.price ?? 50000).toLocaleString('id-ID')}</Text></Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPay}
            disabled={paying}
            className="mt-5 h-12 rounded-2xl items-center justify-center bg-indigo-600"
          >
            <Text className="text-white font-semibold">
              {paying ? 'Membuat Transaksi…' : 'Daftar & Bayar'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
