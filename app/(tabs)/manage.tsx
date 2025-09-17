import { off, onValue, push, ref, remove, set } from "firebase/database";
import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Image, Platform, Pressable, ScrollView, Text, View } from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { db, ensureSignedIn } from "../../firebase";

type Schedule = { id: string; time: string };

export default function Index() {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Schedule[]>([]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const toHHmm = useCallback((d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`, []);

  const handleConfirm = (date: Date) => {
    setIsOpen(false);
    setTime(date);
  };


  const addSubmit = async (hhmm: string): Promise<string | null> => {
    try {
      const newRef = push(ref(db, "schedules"));
      await set(newRef, { id: newRef.key, time: hhmm });
      Alert.alert("Schedule added successfully!");
      return newRef.key ?? null;
    } catch (err: any) {
      console.error("Failed to add schedule:", err);
      Alert.alert("Failed to add schedule:", err?.message ?? String(err));
      return null;
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Schedule?", "This action can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await remove(ref(db, `schedules/${id}`));
            Alert.alert("Schedule has been deleted");
          } catch (e: any) {
            Alert.alert("Delete failed", e?.message ?? String(e));
          }
        },
      },
    ]);
  };

  const isDisabled = loading || !time;
  const buttonLabel = loading ? "Saving..." : !time ? "Select time" : "Add Schedule";
  const handleAdd = async () => {
    if (isDisabled) return;
    setLoading(true);
    try {
      const hhmm = toHHmm(time!);
      await addSubmit(hhmm);
    } finally {
      setTime(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    let offFn: (() => void) | undefined;

    (async () => {
      try {
        await ensureSignedIn(); // ← WAJIB, kalau tidak, rules menolak
        const schedulesRef = ref(db, "schedules");

        const toMinutes = (hhmm: string) => {
          const [h, m] = hhmm.split(":").map(Number);
          return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : Number.POSITIVE_INFINITY;
        };

        const cb = (snap: any) => {
          if (!snap.exists()) return setItems([]);
          const raw = snap.val() as Record<string, any>;
          const arr = Object.entries(raw).map(([id, v]) => ({ id, ...(v as any) }));
          arr.sort((a, b) => toMinutes(a.time) - toMinutes(b.time));
          setItems(arr);
        };

        onValue(schedulesRef, cb);
        offFn = () => off(schedulesRef, "value", cb);
      } catch (e: any) {
        console.error("Auth init failed:", e);
        Alert.alert("Auth error", e?.message ?? String(e));
      }
    })();

    return () => {
      offFn?.();
    };
  }, []);


  return (
    <ScrollView className="flex-1 bg-slate-200" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <View className="items-center mt-24 mb-8 px-4 rounded-xl">
        <Pressable
          onPress={() => setIsOpen(true)}
          className="flex items-center justify-center rounded-2xl border border-slate-500 px-20 py-12"
        >
          <Text className="text-slate-600 text-8xl font-bold">{time ? toHHmm(time) : "00:00"}</Text>
        </Pressable>

        <DateTimePickerModal
          isVisible={isOpen}
          mode="time"
          is24Hour
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onConfirm={handleConfirm}
          onCancel={() => setIsOpen(false)}
        />

        <View className="mt-8">
          <Pressable
            disabled={isDisabled}
            onPress={handleAdd}
            className={`rounded-2xl w-52 py-3 bg-slate-700 ${isDisabled ? "opacity-60" : ""}`}
          >
            <Text className="text-white text-center text-2xl font-bold">
              {buttonLabel}
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-1 p-4">
        <Text className="text-slate-700 text-xl font-medium">Schedules</Text>
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingBottom: 16 }}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View className="mb-2 mt-2 rounded-xl overflow-hidden">
              <View className="flex-row items-center p-5 bg-blue-950/70 rounded-xl">
                <Image
                  className="ml-2"
                  source={require("../../assets/images/time-management.png")}
                  style={{ width: 30, height: 30 }}
                  resizeMode="contain"
                />
                <Text className="text-2xl text-white font-bold ml-3">{item.time}</Text>
                <Pressable onPress={() => handleDelete(item.id)} className="ml-auto mr-2 py-2 px-4 bg-red-700 rounded-xl">
                  <Text className="text-white text-lg font-bold">Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text className="text-white/80 text-center mt-10">Belum ada jadwal.</Text>}
        />
      </View>
    </ScrollView>
  );
}
