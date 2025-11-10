import { useLocalSearchParams, useNavigation } from 'expo-router';
import React from 'react';
import { ActivityIndicator, SafeAreaView, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function PayScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const nav = useNavigation();

  React.useLayoutEffect(() => {
    nav.setOptions({ headerShown: true, headerTitle: 'Pembayaran' });
  }, [nav]);

  if (!url) {
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
      <WebView
        source={{ uri: String(url) }}
        startInLoadingState
        renderLoading={() => (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
