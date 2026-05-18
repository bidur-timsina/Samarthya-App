import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { api } from '@/lib/api';

export default function VerifyOTPScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (otp.length !== 6) { Alert.alert('Error', 'Please enter the 6-digit OTP'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, code: otp });
      Alert.alert('Success', 'Email verified successfully!', [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message ?? 'Invalid OTP');
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
          <Ionicons name="mail" size={32} color="#fff" />
        </View>
        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          {email ? `We sent a 6-digit code to ${email}` : 'Enter the 6-digit code sent to your email'}
        </Text>

        <View style={styles.card}>
          <TextInput
            style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 8 }]}
            value={otp}
            onChangeText={t => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
            keyboardType="number-pad"
            maxLength={6}
            placeholderTextColor="#8B96A7"
            placeholder="------"
          />

          <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify Email</Text>}
          </TouchableOpacity>
        </View>
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
  input: { backgroundColor: '#161B22', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, color: '#E6EDF3', borderWidth: 1, borderColor: '#2A3346' },
  btn: { backgroundColor: '#0D2B6B', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
