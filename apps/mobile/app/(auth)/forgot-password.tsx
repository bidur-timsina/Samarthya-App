import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { api } from '@/lib/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email) { Alert.alert('Error', 'Please enter your email'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#E6EDF3" />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Ionicons name="lock-closed" size={32} color="#fff" />
        </View>
        <Text style={styles.title}>Forgot Password?</Text>
        <Text style={styles.subtitle}>Enter your email and we'll send you a reset link</Text>

        {sent ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={48} color="#4ade80" />
            <Text style={styles.successText}>Reset link sent!</Text>
            <Text style={styles.successSub}>Check your email inbox and follow the instructions.</Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
              <Text style={styles.btnText}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        ) : (
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

            <TouchableOpacity style={styles.btn} onPress={handleSend} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.back()} style={{ alignItems: 'center' }}>
              <Text style={styles.backLink}>Back to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  back: { padding: 20, paddingTop: 56 },
  content: { flex: 1, paddingHorizontal: 20, alignItems: 'center', paddingTop: 20 },
  iconBox: { width: 72, height: 72, borderRadius: 22, backgroundColor: '#0D2B6B', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#E6EDF3', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#8B96A7', textAlign: 'center', marginBottom: 32, paddingHorizontal: 20 },
  card: { width: '100%', backgroundColor: '#1C2230', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#2A3346', gap: 16 },
  field: { gap: 6 },
  label: { fontSize: 12, color: '#8B96A7', fontWeight: '500' },
  input: { backgroundColor: '#161B22', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#E6EDF3', borderWidth: 1, borderColor: '#2A3346', fontSize: 14 },
  btn: { backgroundColor: '#0D2B6B', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  backLink: { color: '#3B63BB', fontSize: 13, fontWeight: '500' },
  successBox: { alignItems: 'center', gap: 12, paddingTop: 20 },
  successText: { fontSize: 20, fontWeight: '700', color: '#E6EDF3' },
  successSub: { fontSize: 14, color: '#8B96A7', textAlign: 'center' },
});
