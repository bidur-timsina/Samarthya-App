import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';

export default function LoginScreen() {
  const { login } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) { Alert.alert('Error', 'Please fill all fields'); return; }
    setLoading(true);
    try {
      await login(email, password);
      // Get role from store after login
      const { user } = useAuthStore.getState();
      if (user?.role === 'ADMIN' || user?.role === 'TEACHER') {
        Alert.alert(
          'Use Web Panel',
          'Teacher and Admin accounts are managed through the web admin panel. Please visit the website to access your dashboard.',
          [{ text: 'OK', onPress: async () => { await useAuthStore.getState().logout(); } }]
        );
        return;
      }
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Login Failed', err?.response?.data?.message ?? 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.title}>Shubha Yatra Academy</Text>
        <Text style={styles.subtitle}>Sign in to continue learning</Text>
      </View>

      {/* Form */}
      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#8B96A7"
            placeholder="you@example.com"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <View>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPw}
              placeholderTextColor="#8B96A7"
              placeholder="Min 8 characters"
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw(p => !p)}>
              <Ionicons name={showPw ? 'eye-off' : 'eye'} size={18} color="#8B96A7" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
          <Text style={styles.forgotLink}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sign In</Text>}
        </TouchableOpacity>

        <View style={styles.row}>
          <Text style={styles.mutedText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117', justifyContent: 'center', padding: 20 },
  header: { alignItems: 'center', marginBottom: 32 },
  logo: { width: 120, height: 80, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#E6EDF3', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B96A7' },
  card: { backgroundColor: '#1C2230', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#2A3346', gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 12, color: '#8B96A7', fontWeight: '500' },
  input: { backgroundColor: '#161B22', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#E6EDF3', borderWidth: 1, borderColor: '#2A3346', fontSize: 14 },
  eyeBtn: { position: 'absolute', right: 14, top: 12 },
  forgotLink: { color: '#3B63BB', fontSize: 13, textAlign: 'right', marginTop: -4 },
  btn: { backgroundColor: '#0D2B6B', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  mutedText: { color: '#8B96A7', fontSize: 13 },
  linkText: { color: '#3B63BB', fontWeight: '600', fontSize: 13 },
});
