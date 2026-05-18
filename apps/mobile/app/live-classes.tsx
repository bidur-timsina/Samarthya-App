import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-NP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatRelative(dateStr: string) {
  if (!dateStr) return '';
  const diff = new Date(dateStr).getTime() - Date.now();
  const abs = Math.abs(diff);
  if (abs < 60000) return 'just now';
  if (abs < 3600000) return `${Math.round(abs / 60000)}m ${diff > 0 ? 'from now' : 'ago'}`;
  if (abs < 86400000) return `${Math.round(abs / 3600000)}h ${diff > 0 ? 'from now' : 'ago'}`;
  return `${Math.round(abs / 86400000)}d ${diff > 0 ? 'from now' : 'ago'}`;
}

export default function LiveClassesScreen() {
  const router = useRouter();

  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: () => api.get('/live-sessions').then(r => r.data),
    refetchInterval: 15000,
  });

  const all: any[] = sessions ?? [];
  const live = all.filter(s => s.status === 'LIVE');
  const upcoming = all.filter(s => s.status === 'SCHEDULED');
  const past = all.filter(s => s.status === 'ENDED');

  const joinSession = (s: any) => {
    if (s.externalLink) {
      Linking.openURL(s.externalLink);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#E6EDF3" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Classes</Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.backBtn}>
          <Ionicons name="refresh" size={20} color="#8B96A7" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#3B63BB" size="large" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 24 }}>

          {/* Live Now */}
          {live.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <View style={styles.liveDot} />
                <Text style={styles.sectionTitle}>Live Now</Text>
              </View>
              {live.map(s => (
                <View key={s.id} style={[styles.card, styles.liveCard]}>
                  <View style={[styles.iconBox, { backgroundColor: '#dc262620' }]}>
                    <Ionicons name="videocam" size={22} color="#f87171" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.liveBadgeRow}>
                      <View style={styles.liveBadge}>
                        <Text style={styles.liveBadgeText}>● LIVE</Text>
                      </View>
                    </View>
                    <Text style={styles.cardTitle}>{s.title}</Text>
                    {s.description ? <Text style={styles.cardDesc} numberOfLines={2}>{s.description}</Text> : null}
                    <View style={styles.metaRow}>
                      {s.instructor?.name && (
                        <View style={styles.metaItem}>
                          <Ionicons name="person" size={12} color="#8B96A7" />
                          <Text style={styles.metaText}>{s.instructor.name}</Text>
                        </View>
                      )}
                      {s.course?.title && (
                        <View style={styles.metaItem}>
                          <Ionicons name="book" size={12} color="#8B96A7" />
                          <Text style={styles.metaText} numberOfLines={1}>{s.course.title}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  {s.externalLink ? (
                    <TouchableOpacity style={styles.joinBtn} onPress={() => joinSession(s)}>
                      <Text style={styles.joinBtnText}>Join</Text>
                      <Ionicons name="open-outline" size={14} color="#fff" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          {/* Upcoming */}
          <View>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={16} color="#3B63BB" />
              <Text style={styles.sectionTitle}>Upcoming</Text>
            </View>

            {upcoming.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="videocam-outline" size={40} color="#2A3346" />
                <Text style={styles.emptyTitle}>No upcoming classes</Text>
                <Text style={styles.emptyDesc}>Your instructors haven't scheduled live classes yet.</Text>
              </View>
            ) : upcoming.map(s => (
              <View key={s.id} style={styles.card}>
                <View style={[styles.iconBox, { backgroundColor: '#0D2B6B20' }]}>
                  <Ionicons name="videocam" size={22} color="#3B63BB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{s.title}</Text>
                  {s.description ? <Text style={styles.cardDesc} numberOfLines={2}>{s.description}</Text> : null}
                  <View style={styles.metaRow}>
                    {s.scheduledAt && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time" size={12} color="#8B96A7" />
                        <Text style={styles.metaText}>{formatDate(s.scheduledAt)}</Text>
                      </View>
                    )}
                    {s.instructor?.name && (
                      <View style={styles.metaItem}>
                        <Ionicons name="person" size={12} color="#8B96A7" />
                        <Text style={styles.metaText}>{s.instructor.name}</Text>
                      </View>
                    )}
                  </View>
                </View>
                {s.scheduledAt && (
                  <Text style={styles.relativeTime}>{formatRelative(s.scheduledAt)}</Text>
                )}
              </View>
            ))}
          </View>

          {/* Past */}
          {past.length > 0 && (
            <View>
              <View style={styles.sectionHeader}>
                <Ionicons name="time" size={16} color="#8B96A7" />
                <Text style={[styles.sectionTitle, { color: '#8B96A7' }]}>Past Classes</Text>
              </View>
              {past.map(s => (
                <View key={s.id} style={[styles.card, { opacity: 0.7 }]}>
                  <View style={[styles.iconBox, { backgroundColor: '#2A334620' }]}>
                    <Ionicons name="videocam" size={22} color="#4B5563" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{s.title}</Text>
                    {s.scheduledAt && (
                      <View style={styles.metaItem}>
                        <Ionicons name="time" size={12} color="#8B96A7" />
                        <Text style={styles.metaText}>{formatDate(s.scheduledAt)}</Text>
                      </View>
                    )}
                  </View>
                  {s.recordingUrl ? (
                    <TouchableOpacity style={styles.recordingBtn} onPress={() => Linking.openURL(s.recordingUrl)}>
                      <Ionicons name="play-circle" size={20} color="#3B63BB" />
                      <Text style={styles.recordingText}>Recording</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 52, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#2A3346' },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700', color: '#E6EDF3', textAlign: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#E6EDF3' },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#f87171' },
  card: { backgroundColor: '#1C2230', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10, borderWidth: 1, borderColor: '#2A3346' },
  liveCard: { borderColor: '#f8717150', backgroundColor: '#f871710A' },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  liveBadgeRow: { marginBottom: 4 },
  liveBadge: { backgroundColor: '#dc262620', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  liveBadgeText: { color: '#f87171', fontSize: 10, fontWeight: '700' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#E6EDF3', marginBottom: 3 },
  cardDesc: { fontSize: 12, color: '#8B96A7', lineHeight: 16, marginBottom: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: '#8B96A7' },
  joinBtn: { backgroundColor: '#dc2626', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center' },
  joinBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  relativeTime: { fontSize: 11, color: '#3B63BB', flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 },
  recordingBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'center' },
  recordingText: { fontSize: 12, color: '#3B63BB', fontWeight: '500' },
  emptyCard: { backgroundColor: '#1C2230', borderRadius: 16, padding: 32, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#2A3346' },
  emptyTitle: { fontSize: 15, fontWeight: '600', color: '#E6EDF3' },
  emptyDesc: { fontSize: 13, color: '#8B96A7', textAlign: 'center', lineHeight: 18 },
});
