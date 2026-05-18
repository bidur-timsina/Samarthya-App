import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/auth.store';

export default function RegisterScreen() {
  const router = useRouter();
  const { fetchMe } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, phone: phone || undefined, password });
      await SecureStore.setItemAsync('accessToken', data.accessToken);
      await SecureStore.setItemAsync('refreshToken', data.refreshToken);
      await fetchMe();
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Registration Failed', err?.response?.data?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join Samarthya Institute today</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          <View style={styles.field}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholderTextColor="#8B96A7"
              placeholder="Your full name"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Email *</Text>
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
            <Text style={styles.label}>Phone (optional)</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#8B96A7"
              placeholder="+977 98XXXXXXXX"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Password *</Text>
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

          <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
          </TouchableOpacity>

          <View style={styles.row}>
            <Text style={styles.mutedText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.linkText}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { alignItems: 'center', paddingTop: 60, paddingBottom: 32, paddingHorizontal: 20 },
  logo: { width: 120, height: 80, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#E6EDF3', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#8B96A7' },
  card: { backgroundColor: '#1C2230', borderRadius: 16, padding: 24, marginHorizontal: 20, borderWidth: 1, borderColor: '#2A3346', gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 12, color: '#8B96A7', fontWeight: '500' },
  input: { backgroundColor: '#161B22', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#E6EDF3', borderWidth: 1, borderColor: '#2A3346', fontSize: 14 },
  eyeBtn: { position: 'absolute', right: 14, top: 12 },
  btn: { backgroundColor: '#0D2B6B', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  row: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  mutedText: { color: '#8B96A7', fontSize: 13 },
  linkText: { color: '#3B63BB', fontWeight: '600', fontSize: 13 },
});
