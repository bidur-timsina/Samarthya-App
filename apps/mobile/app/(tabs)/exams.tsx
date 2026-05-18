import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ExamsScreen() {
  const router = useRouter();
  const [typeTab, setTypeTab] = useState('FORMAL');

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams', { type: typeTab }],
    queryFn: () => api.get('/exams', { params: { type: typeTab } }).then(r => r.data),
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exams</Text>
      </View>

      <View style={styles.tabs}>
        {[{ value: 'FORMAL', label: 'Exams' }, { value: 'PRACTICE', label: 'Practice' }].map(({ value, label }) => (
          <TouchableOpacity key={value} onPress={() => setTypeTab(value)} style={[styles.tab, typeTab === value && styles.tabActive]}>
            <Text style={[styles.tabText, typeTab === value && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#3B63BB" /></View>
      ) : (
        <FlatList
          data={exams ?? []}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 20, gap: 10 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="clipboard-outline" size={56} color="#2A3346" />
              <Text style={styles.emptyTitle}>No exams available</Text>
              <Text style={styles.emptySubtitle}>Check back soon!</Text>
            </View>
          }
          renderItem={({ item }) => {
            const attempted = !!item.myAttempt;
            const passed = item.myAttempt?.passed;
            return (
              <View style={styles.examCard}>
                <View style={[styles.examIcon, passed ? { backgroundColor: '#16A34A20' } : attempted ? { backgroundColor: '#DC262620' } : { backgroundColor: '#0D2B6B20' }]}>
                  <Ionicons name={passed ? 'checkmark-circle' : attempted ? 'close-circle' : 'clipboard'} size={22} color={passed ? '#4ade80' : attempted ? '#f87171' : '#3B63BB'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.examTitle} numberOfLines={2}>{item.title}</Text>
                  <View style={styles.examMeta}>
                    <Ionicons name="time-outline" size={12} color="#8B96A7" />
                    <Text style={styles.examMetaText}>{item.duration} min</Text>
                    <Text style={styles.examMetaDot}>·</Text>
                    <Text style={styles.examMetaText}>{item.questionCount} questions</Text>
                    {attempted && <><Text style={styles.examMetaDot}>·</Text><Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '600' }}>{item.myAttempt?.score}/{item.myAttempt?.total}</Text></>}
                  </View>
                </View>
                {attempted ? (
                  <TouchableOpacity style={styles.viewBtn} onPress={() => router.push(`/exam/${item.id}`)}>
                    <Text style={styles.viewBtnText}>View</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.startBtn} onPress={() => router.push(`/exam/${item.id}`)}>
                    <Ionicons name="play" size={14} color="#fff" />
                    <Text style={styles.startBtnText}>Start</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#E6EDF3' },
  tabs: { flexDirection: 'row', marginHorizontal: 20, marginBottom: 4, backgroundColor: '#1C2230', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#2A3346' },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#2A3346' },
  tabText: { color: '#8B96A7', fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: '#E6EDF3' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#E6EDF3' },
  emptySubtitle: { color: '#8B96A7', fontSize: 14 },
  examCard: { backgroundColor: '#1C2230', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2A3346' },
  examIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  examTitle: { fontSize: 14, fontWeight: '600', color: '#E6EDF3', marginBottom: 4 },
  examMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  examMetaText: { fontSize: 12, color: '#8B96A7' },
  examMetaDot: { color: '#2A3346' },
  startBtn: { backgroundColor: '#0D2B6B', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  startBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  viewBtn: { borderWidth: 1, borderColor: '#2A3346', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  viewBtnText: { color: '#8B96A7', fontSize: 13 },
});
