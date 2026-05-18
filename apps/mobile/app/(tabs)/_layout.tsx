import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth.store';
import { Redirect } from 'expo-router';

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#161B22',
          borderTopColor: '#2A3346',
          borderTopWidth: 1,
          paddingBottom: 32,
          paddingTop: 8,
          height: 88,
        },
        tabBarActiveTintColor: '#3B63BB',
        tabBarInactiveTintColor: '#8B96A7',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', marginTop: -2 },
      }}
    >
      <Tabs.Screen name="index"       options={{ title: 'Home',    tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="explore"     options={{ title: 'Explore', tabBarIcon: ({ color }) => <Ionicons name="compass" size={22} color={color} /> }} />
      <Tabs.Screen name="courses"     options={{ title: 'Courses', tabBarIcon: ({ color }) => <Ionicons name="book" size={22} color={color} /> }} />
      <Tabs.Screen name="exams"       options={{ title: 'Exams',   tabBarIcon: ({ color }) => <Ionicons name="clipboard" size={22} color={color} /> }} />
      <Tabs.Screen name="goals"       options={{ title: 'Goals',   tabBarIcon: ({ color }) => <Ionicons name="trophy" size={22} color={color} /> }} />
      <Tabs.Screen name="profile"     options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} /> }} />
    </Tabs>
  );
}
