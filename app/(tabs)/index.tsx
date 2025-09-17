import { equalTo, get, limitToLast, off, onValue, orderByChild, query, ref, serverTimestamp, set } from "firebase/database";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { db, ensureSignedIn } from "../../firebase";


type Feed = { id: string; time?: string; ts?: number | string };

const pad = (n: number) => String(n).padStart(2, "0");
const toHHmm = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const toYYYYMMDD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const makeNonce = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

const toMinutes = (hhmm: string): number | null => {
  const [hStr, mStr] = (hhmm ?? "").split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (
    Number.isFinite(h) &&
    Number.isFinite(m) &&
    h >= 0 && h < 24 &&
    m >= 0 && m < 60
  ) {
    return h * 60 + m;
  }
  return null;
};

const fromMinutes = (mins: number) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${pad(h)}:${pad(m)}`;
};

function findNextSchedule(times: string[], now: Date): string | null {
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  const minutesList = times
    .map((t) => toMinutes(String(t).trim()))
    .filter((v): v is number => v !== null)
    .sort((a, b) => a - b);

  if (minutesList.length === 0) return null;

  const upcoming = minutesList.find((m) => m > nowMinutes);
  return fromMinutes(upcoming ?? minutesList[0]);
}

export default function Index() {
  const [times, setTimes] = useState<string[]>([]);
  const [now, setNow] = useState(new Date());

  const COOLDOWN_MS = 3000;
  const [cooling, setCooling] = useState(false);

  // const yumYumEat = async (): Promise<void> => {
  //   try {
  //     await ensureSignedIn();

  //     // 1) tulis trigger ke /control/manual_feed
  //     const nonce = makeNonce(); // atau makeNonce()
  //     const triggerRef = ref(db, "control/manual_feed");
  //     await set(triggerRef, {
  //       ts: serverTimestamp(),
  //       nonce,
  //       // byUid: auth.currentUser?.uid, // opsional
  //       // deviceId: "esp32-1",          // opsional
  //     });

  //     // 2) tunggu ACK dari ESP pada /devices/esp32-1/last_ack_manual
  //     const ackRef = ref(db, "devices/esp32-1/last_ack_manual");
  //     const TIMEOUT_MS = 15000;

  //     const ok = await new Promise<boolean>((resolve) => {
  //       let done = false;
  //       const timer = setTimeout(() => {
  //         if (done) return;
  //         done = true; off(ackRef, "value", cb);
  //         resolve(false);
  //       }, TIMEOUT_MS);

  //       const cb = (snap: any) => {
  //         const val = snap.val();
  //         if (!val) return;
  //         if (val?.nonce === nonce) {
  //           if (done) return;
  //           done = true;
  //           clearTimeout(timer);
  //           off(ackRef, "value", cb);
  //           resolve(true);
  //         }
  //       };

  //       onValue(ackRef, cb);
  //     });

  //     if (ok) {
  //       Alert.alert("Feeding successfully, yumyumfishyeat!");
  //     } else {
  //       Alert.alert("No yumyumeat, checks device connection");
  //     }
  //   } catch (err: any) {
  //     console.error("Trigger feed failed:", err);
  //     Alert.alert("Failed", err?.message ?? String(err));
  //   }
  // };

  // const onPressFeed = useCallback(async () => {
  //   if (cooling) return;          // guard double tap
  //   setCooling(true);
  //   try {
  //     await yumYumEat();          // panggil aksi kamu sekarang
  //   } finally {
  //     setTimeout(() => setCooling(false), COOLDOWN_MS); // freeze 3 detik
  //   }
  // }, [cooling]);

  const TIMEOUT_MS = 10000; // samakan dengan threshold "Connected"
  const DEVICE_ID = "esp32-1";

  const makeNonce = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  const yumYumEat = async (): Promise<void> => {
    try {
      // 1) tulis trigger
      const nonce = makeNonce();
      const triggerRef = ref(db, "control/manual_feed");
      await set(triggerRef, { ts: serverTimestamp(), nonce });

      // 2) baca balik ts server yang terisi
      const snap = await get(triggerRef);
      const triggerTs = Number(snap.val()?.ts ?? 0);

      // 3) tunggu ACK
      const ackRef = ref(db, `devices/${DEVICE_ID}/last_ack_manual`);
      const ok = await new Promise<boolean>((resolve) => {
        let done = false;

        const cleanup = (cb: any) => off(ackRef, "value", cb);

        const onTimeout = async (cb: any) => {
          if (done) return;
          done = true;
          cleanup(cb);
          // HAPUS trigger agar tidak dieksekusi saat ESP baru reconnect
          try { await set(triggerRef, null); } catch {}
          resolve(false);
        };

        const timer = setTimeout(() => onTimeout(cb), TIMEOUT_MS);

        const cb = (ackSnap: any) => {
          const v = ackSnap.val();
          // terima berbagai bentuk ACK:
          const matches =
            (typeof v === "number" && v >= triggerTs) ||
            (typeof v === "string" && /^\d+$/.test(v) && Number(v) >= triggerTs) ||
            (v && typeof v === "object" && (v.nonce === nonce || (typeof v.ts === "number" && v.ts >= triggerTs)));

          if (!matches) return;

          if (done) return;
          done = true;
          clearTimeout(timer);
          cleanup(cb);

          // bersihkan trigger (good hygiene)
          (async () => { try { await set(triggerRef, null); } catch {} })();

          resolve(true);
        };

        onValue(ackRef, cb);
      });

      Alert.alert(ok ? "Feeding successfully, yumyumfishyeat!" : "No feed — device offline");
    } catch (err: any) {
      console.error("Trigger feed failed:", err);
      Alert.alert("Failed", err?.message ?? String(err));
    }
  };

  useEffect(() => {
    let detach: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        // Pastikan sudah sign-in (Anonymous) agar rules auth != null lolos
        await ensureSignedIn();
        if (cancelled) return;

        const schedulesRef = ref(db, "schedules");

        const cb = (snap: any) => {
          if (!snap.exists()) {
            setTimes([]);
            return;
          }
          const raw = snap.val() as Record<string, any>;
          const list = Object.values(raw)
            .map((v: any) => String(v?.time ?? "").trim())
            .filter(Boolean);
          setTimes(list);
        };

        onValue(schedulesRef, cb);
        detach = () => off(schedulesRef, "value", cb);
      } catch (e: any) {
        console.error("Auth init failed:", e);
        Alert.alert("Auth error", e?.message ?? String(e));
      }
    })();

    return () => {
      cancelled = true;
      detach?.();
    };
  }, []);


  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const next = useMemo(() => findNextSchedule(times, now), [times, now]);


  const [last, setLast] = useState<Feed | null>(null);

  useEffect(() => {
    const q = query(ref(db, "feedHistory"), orderByChild("ts"), limitToLast(1));
    const cb = (snap: any) => {
      if (!snap.exists()) return setLast(null);
      let rec: any = null;
      snap.forEach((child: any) => (rec = { id: child.key, ...child.val() }));
      setLast(rec);
    };
    onValue(q, cb);
    return () => off(q, "value", cb);
  }, []);

  const display = useMemo(() => {
    if (!last) return "—";
    if (last.time) return last.time; // jika kamu simpan "HH:mm" saat write
    const tsNum = typeof last.ts === "number" ? last.ts : Number(last.ts);
    if (Number.isFinite(tsNum)) {
      const d = new Date(tsNum);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return "—";
  }, [last]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const todayJakarta = () => {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const wib = new Date(utc + 7 * 60 * 60000);
    return `${wib.getFullYear()}-${pad(wib.getMonth() + 1)}-${pad(wib.getDate())}`;
  };

  const THRESHOLD_MS = 10_000;
  const [lastSeen, setLastSeen] = useState<number | null>(null);

  useEffect(() => {
    let detach: (() => void) | undefined;

    (async () => {
      await ensureSignedIn();
      const r = ref(db, "devices/esp32-1/presence");
      const cb = (snap: any) => {
        const v = snap.val() as { lastSeen?: number | string } | null;
        if (!v || v.lastSeen == null) return setLastSeen(null);
        const n = typeof v.lastSeen === "number" ? v.lastSeen : Number(v.lastSeen);
        setLastSeen(Number.isFinite(n) ? n : null);
      };
      onValue(r, cb);
      detach = () => off(r, "value", cb);
    })();

    return () => detach?.();
  }, []);

  const [rnow, setRnow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setRnow(Date.now()), 1000); // tick tiap 1s
    return () => clearInterval(id);
  }, []);

  const deviceStatus = useMemo(() => {
    if (lastSeen == null) return "Disconnected";
    return (rnow - lastSeen) <= THRESHOLD_MS ? "Connected" : "Disconnected";
  }, [lastSeen, rnow]);

  const statusClass = useMemo(
    () => (deviceStatus === "Connected" ? "text-green-300" : "text-red-300"),
    [deviceStatus]
  );

  // status device
  const isConnected = deviceStatus === "Connected";

  // lock logic gabungan
  const buttonDisabled = cooling || !isConnected;
  const buttonLabel = !isConnected ? "Device offline" : (cooling ? "Please wait..." : "Feed Now");

  const onPressFeed = useCallback(async () => {
    if (cooling || !isConnected) return;   // tetap guard double-tap + offline
    setCooling(true);
    try {
      await yumYumEat();
    } finally {
      setTimeout(() => setCooling(false), COOLDOWN_MS);
    }
  }, [cooling, isConnected]);

  const [countToday, setCountToday] = useState<number | null>(null);
  useEffect(() => {
    const q = query(ref(db, "feedHistory"), orderByChild("date"), equalTo(todayJakarta()));
    const cb = (snap: any) => {
      if (!snap.exists()) return setCountToday(0);
      let n = 0;
      snap.forEach(() => { n += 1; return false; }); // ← jangan return truthy
      setCountToday(n);
    };
    onValue(q, cb);
    return () => off(q, "value", cb);
  }, []);

  const today = useMemo(() => {
    if (countToday == null) return "0";
    return String(countToday);
  }, [countToday]);

  const [schedulesCount, setSchedulesCount] = useState<number | null>(null);
  useEffect(() => {
    const r = ref(db, "schedules");
    const cb = (snap: any) => {
      if (!snap.exists()) return setSchedulesCount(0);
      let n = 0;
      snap.forEach(() => {
        n += 1;
        return false;
      });
      setSchedulesCount(n);
    };
    onValue(r, cb);
    return () => off(r, "value", cb);
  }, []);

  const skejul = useMemo(() => {
    if (schedulesCount == null) return "-";
    return String(schedulesCount);
  }, [schedulesCount]);

  return (
    <ScrollView className="flex-1 bg-slate-200" contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <View className="flex justfity-center items-center">
        <View className="flex-row bg-blue-950/80 w-5/6 mt-24 px-8 py-4 rounded-lg">
          <View>
            <Image
              source={require("../../assets/images/device.png")}
              style={{ width: 40, height: 40 }}
              resizeMode="contain"
            />
          </View>
          <View className="ml-5">
            <Text className="text-white text-xl font-medium">Device Status</Text>
            <Text className={`text-normal font-light ${statusClass}`}>{ deviceStatus }~</Text>
          </View>
        </View>
      </View>

      <View className="mt-14 items-center">
        <View className="w-80 h-80 border-2 border-slate-500 rounded-full justify-center">
          <View className="items-center mb-6">
            <Text className="text-slate-600 text-xl font-light">Next Schedule</Text>
            <Text className="text-slate-600 text-7xl font-bold">{next ?? "—"}</Text>
          </View>
          <View className="items-center">
            <Text className="text-slate-600 text-xl font-light">Last Feed</Text>
            <Text className="text-slate-600 text-2xl font-medium">{display}</Text>
          </View>
        </View>
      </View>

      <View className="flex justify-center items-center mt-12 mb-4">
        <Pressable
          disabled={buttonDisabled}
          onPress={onPressFeed}
          className={`rounded-xl w-56 py-4 ${buttonDisabled ? "opacity-60 bg-slate-700" : "bg-slate-700"}`}
        >
          <Text className="text-white text-center text-2xl font-bold">
            {buttonLabel}
          </Text>
        </Pressable>
      </View>

      <View className="flex mt-8 px-6">
        <Text className="text-slate-700 text-xl font-medium">Daily Report</Text>
        <View className="flex-row justify-evenly bg-blue-950/70 p-4 rounded-xl mt-2">
          <View className="flex-row">
            <View className="flex">
              <Text className="text-white text-sm text-right">Number of</Text>
              <Text className="text-white text-sm text-right">Today's Feed</Text>
            </View>
            <Text className="ml-3 text-white text-3xl">{ today }</Text>
          </View>
          <View className="bg-slate-100 w-0.5 h-8"/>
          <View className="flex-row">
            <View className="flex">
              <Text className="text-white text-sm text-right">Number</Text>
              <Text className="text-white text-sm text-right">of Schedules</Text>
            </View>
            <Text className="ml-3 text-white text-3xl">{ skejul }</Text>
          </View>
          {/* <View className="bg-slate-100 w-0.5 h-8"/>
          <View className="flex-row">
            <View className="flex">
              <Text className="text-white text-sm text-right">Number of</Text>
              <Text className="text-white text-sm text-right">Today's Feed</Text>
            </View>
            <Text className="ml-3 text-white text-3xl">3</Text>
          </View> */}
        </View>
      </View>
    </ScrollView>
  )}
