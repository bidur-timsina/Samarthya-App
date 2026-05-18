import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30000, retry: 1 } } });

export default function RootLayout() {
  const { fetchMe, isLoading } = useAuthStore();
  const { load, colors } = useThemeStore();

  useEffect(() => {
    load(); // loads saved theme from SecureStore (non-blocking)
    fetchMe().finally(() => SplashScreen.hideAsync());
  }, []);

  if (isLoading) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style={colors.statusBar} backgroundColor={colors.bg} />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="course/[id]" options={{ headerShown: true, headerStyle: { backgroundColor: colors.headerBg }, headerTintColor: colors.text, headerTitle: '' }} />
          <Stack.Screen name="exam/[id]" options={{ headerShown: true, headerStyle: { backgroundColor: colors.headerBg }, headerTintColor: colors.text, headerTitle: 'Exam' }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
