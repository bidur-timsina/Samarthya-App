import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { getLevelName } from '@/lib/utils';

const TABS = ['Goals', 'Leaderboard', 'Badges'];

export default function GoalsScreen() {
  const [tab, setTab] = useState('Goals');
  const { data, isLoading } = useQuery({ queryKey: ['goals', 'my'], queryFn: () => api.get('/goals/my').then(r => r.data) });

  const xp = data?.xp;
  const goals = data?.goals ?? [];
  const badges = data?.badges ?? [];
  const leaderboard = data?.leaderboard ?? [];

  if (isLoading) return <View style={{ flex: 1, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#3B63BB" /></View>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Goals & XP</Text>
      </View>

      {/* XP card */}
      <View style={styles.xpCard}>
        <Text style={styles.xpLevelLabel}>Level {xp?.level ?? 1} — {getLevelName(xp?.level ?? 1)}</Text>
        <Text style={styles.xpValue}>{(xp?.totalXP ?? 0).toLocaleString()} XP</Text>
        <View style={styles.xpBar}>
          <View style={[styles.xpFill, { width: `${Math.min(((xp?.progress ?? 0) / (xp?.nextLevel ?? 100)) * 100, 100)}%` }]} />
        </View>
        <View style={styles.xpStats}>
          <View style={styles.xpStat}><Ionicons name="flame" size={16} color="#fb923c" /><Text style={styles.xpStatText}>{xp?.streak ?? 0}d streak</Text></View>
          <View style={styles.xpStat}><Ionicons name="trophy" size={16} color="#f59e0b" /><Text style={styles.xpStatText}>{badges.length} badges</Text></View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity key={t} onPress={() => setTab(t)} style={[styles.tabBtn, tab === t && styles.tabActive]}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.content}>
        {tab === 'Goals' && (goals.length === 0 ? (
          <View style={styles.empty}><Ionicons name="flag-outline" size={48} color="#2A3346" /><Text style={styles.emptyText}>No goals yet</Text></View>
        ) : goals.map((g: any) => (
          <View key={g.id} style={styles.goalCard}>
            <Ionicons name="flag" size={20} color="#3B63BB" />
            <View style={{ flex: 1 }}>
              <Text style={styles.goalTitle}>{g.title}</Text>
              <View style={styles.goalBar}><View style={[styles.goalFill, { width: `${Math.min((g.currentXP / g.targetXP) * 100, 100)}%` }]} /></View>
              <Text style={styles.goalMeta}>{g.currentXP} / {g.targetXP} XP</Text>
            </View>
          </View>
        )))}

        {tab === 'Leaderboard' && leaderboard.map((entry: any) => (
          <View key={entry.user.id} style={styles.leaderRow}>
            <Text style={[styles.rank, entry.rank <= 3 && { color: '#f59e0b' }]}>#{entry.rank}</Text>
            <View style={styles.lAvatar}><Text style={styles.lAvatarText}>{entry.user.name[0]}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.lName}>{entry.user.name}</Text>
              <Text style={styles.lLevel}>Level {entry.level} — {getLevelName(entry.level)}</Text>
            </View>
            <Text style={styles.lXP}>{entry.totalXP.toLocaleString()}</Text>
          </View>
        ))}

        {tab === 'Badges' && (badges.length === 0 ? (
          <View style={styles.empty}><Ionicons name="medal-outline" size={48} color="#2A3346" /><Text style={styles.emptyText}>No badges yet</Text></View>
        ) : (
          <View style={styles.badgeGrid}>
            {badges.map((b: any) => (
              <View key={b.id} style={styles.badgeCard}>
                <Text style={styles.badgeIcon}>{b.icon}</Text>
                <Text style={styles.badgeName}>{b.name}</Text>
                <Text style={styles.badgeDesc}>{b.description}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#E6EDF3' },
  xpCard: { margin: 20, backgroundColor: '#0D2B6B', borderRadius: 20, padding: 20, gap: 10 },
  xpLevelLabel: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },
  xpValue: { fontSize: 30, fontWeight: '800', color: '#fff' },
  xpBar: { height: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 4, overflow: 'hidden' },
  xpFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  xpStats: { flexDirection: 'row', gap: 16 },
  xpStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  xpStatText: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  tabs: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#1C2230', borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#2A3346' },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#2A3346' },
  tabText: { color: '#8B96A7', fontSize: 13, fontWeight: '500' },
  tabTextActive: { color: '#E6EDF3' },
  content: { paddingHorizontal: 20, gap: 10 },
  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyText: { color: '#8B96A7', fontSize: 14 },
  goalCard: { backgroundColor: '#1C2230', borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1, borderColor: '#2A3346' },
  goalTitle: { fontSize: 14, fontWeight: '600', color: '#E6EDF3', marginBottom: 8 },
  goalBar: { height: 4, backgroundColor: '#2A3346', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  goalFill: { height: '100%', backgroundColor: '#3B63BB', borderRadius: 2 },
  goalMeta: { fontSize: 11, color: '#8B96A7' },
  leaderRow: { backgroundColor: '#1C2230', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2A3346' },
  rank: { width: 28, fontSize: 14, fontWeight: '700', color: '#8B96A7' },
  lAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#0D2B6B', alignItems: 'center', justifyContent: 'center' },
  lAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  lName: { fontSize: 14, fontWeight: '600', color: '#E6EDF3' },
  lLevel: { fontSize: 11, color: '#8B96A7' },
  lXP: { fontSize: 14, fontWeight: '700', color: '#f59e0b' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  badgeCard: { width: '47%', backgroundColor: '#1C2230', borderRadius: 14, padding: 16, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2A3346' },
  badgeIcon: { fontSize: 32 },
  badgeName: { fontSize: 13, fontWeight: '600', color: '#E6EDF3', textAlign: 'center' },
  badgeDesc: { fontSize: 11, color: '#8B96A7', textAlign: 'center' },
});
