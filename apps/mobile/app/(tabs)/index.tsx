import { ScrollView, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Dimensions, Linking } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getLevelName } from '@/lib/utils';
import { useRef, useEffect, useState } from 'react';

const { width: SCREEN_W } = Dimensions.get('window');
const BANNER_H = 160;

// ── Banner Carousel ──────────────────────────────────────────────────────────
function BannerCarousel({ banners }: { banners: any[] }) {
  const scrollRef = useRef<ScrollView>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActive(prev => {
        const next = (prev + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: next * (SCREEN_W - 40), animated: true });
        return next;
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners.length) return null;

  return (
    <View style={carousel.wrapper}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_W - 40}
        decelerationRate="fast"
        onMomentumScrollEnd={e => {
          const idx = Math.round(e.nativeEvent.contentOffset.x / (SCREEN_W - 40));
          setActive(idx);
        }}
        contentContainerStyle={{ gap: 0 }}
      >
        {banners.map((b, i) => (
          <TouchableOpacity
            key={b.id ?? i}
            activeOpacity={b.link ? 0.85 : 1}
            onPress={() => { if (b.link) Linking.openURL(b.link); }}
            style={carousel.slide}
          >
            <Image source={{ uri: b.image }} style={carousel.img} resizeMode="cover" />
            {b.title ? (
              <View style={carousel.label}>
                <Text style={carousel.labelText} numberOfLines={1}>{b.title}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Dots */}
      {banners.length > 1 && (
        <View style={carousel.dots}>
          {banners.map((_, i) => (
            <View key={i} style={[carousel.dot, i === active && carousel.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const carousel = StyleSheet.create({
  wrapper: { marginHorizontal: 20, marginBottom: 16 },
  slide: { width: SCREEN_W - 40, height: BANNER_H, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1C2230' },
  img: { width: '100%', height: '100%' },
  label: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingHorizontal: 12, paddingVertical: 8 },
  labelText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#2A3346' },
  dotActive: { backgroundColor: '#3B63BB', width: 18 },
});

// ── Home Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { user } = useAuthStore();
  const router = useRouter();

  const { data: enrollments } = useQuery({ queryKey: ['enrollments', 'my'], queryFn: () => api.get('/enrollments/my').then(r => r.data) });
  const { data: xpData } = useQuery({ queryKey: ['goals', 'my'], queryFn: () => api.get('/goals/my').then(r => r.data) });
  const { data: announcements } = useQuery({ queryKey: ['announcements'], queryFn: () => api.get('/cms/announcements').then(r => r.data) });
  const { data: banners } = useQuery({ queryKey: ['banners'], queryFn: () => api.get('/cms/banners').then(r => r.data) });

  const xp = xpData?.xp;
  const streak = xp?.streak ?? 0;
  const level = xp?.level ?? 1;
  const courses = enrollments ?? [];
  const activeBanners: any[] = (banners ?? []).filter((b: any) => b.isActive);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image source={require('@/assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.appName}>Shubha Yatra Academy</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      {/* Greeting */}
      <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name?.split(' ')[0]} 👋</Text>
      </View>

      {/* Banner Carousel — shown only when banners exist */}
      {activeBanners.length > 0 && <BannerCarousel banners={activeBanners} />}

      {/* XP Banner */}
      <View style={styles.xpBanner}>
        <View style={styles.xpRow}>
          <View>
            <Text style={styles.xpLabel}>Level {level} · {getLevelName(level)}</Text>
            <Text style={styles.xpValue}>{xp?.totalXP ?? 0} XP</Text>
          </View>
          {streak > 0 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flame" size={14} color="#fb923c" />
              <Text style={styles.streakText}>{streak}d</Text>
            </View>
          )}
        </View>
        <View style={styles.xpBarBg}>
          <View style={[styles.xpBarFill, { width: `${Math.min(((xp?.progress ?? 0) / (xp?.nextLevel ?? 100)) * 100, 100)}%` }]} />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { icon: 'book', label: 'Courses', value: courses.length, color: '#3B63BB' },
          { icon: 'trophy', label: 'Level', value: level, color: '#f59e0b' },
          { icon: 'flame', label: 'Streak', value: `${streak}d`, color: '#f97316' },
        ].map(({ icon, label, value, color }) => (
          <View key={label} style={styles.statCard}>
            <Ionicons name={icon as any} size={20} color={color} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Continue Learning */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Continue Learning</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/courses')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {courses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="book-outline" size={40} color="#2A3346" />
            <Text style={styles.emptyText}>No courses yet</Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.btnText}>Explore Courses</Text>
            </TouchableOpacity>
          </View>
        ) : courses.slice(0, 3).map((enrollment: any) => (
          <TouchableOpacity key={enrollment.id} style={styles.courseCard} onPress={() => router.push(`/course/${enrollment.course.slug}`)}>
            <View style={styles.courseIconBox}>
              <Ionicons name="book" size={22} color="#3B63BB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.courseTitle} numberOfLines={1}>{enrollment.course.title}</Text>
              <Text style={styles.courseMeta}>{enrollment.course.category?.name}</Text>
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: '33%' }]} />
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#8B96A7" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick access */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Access</Text>
        <View style={styles.quickGrid}>
          {[
            { icon: 'clipboard', label: 'Exams', route: '/(tabs)/exams', color: '#0D2B6B' },
            { icon: 'trophy', label: 'Goals', route: '/(tabs)/goals', color: '#7c3aed' },
            { icon: 'videocam', label: 'Live', route: '/live-classes', color: '#dc2626' },
            { icon: 'book', label: 'Explore', route: '/(tabs)/explore', color: '#059669' },
          ].map(({ icon, label, route, color }) => (
            <TouchableOpacity key={label} style={styles.quickCard} onPress={() => router.push(route as any)}>
              <View style={[styles.quickIcon, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon as any} size={22} color={color} />
              </View>
              <Text style={styles.quickLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Announcements */}
      {(announcements ?? []).length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="notifications" size={16} color="#3B63BB" />
              <Text style={styles.sectionTitle}>Recent Updates</Text>
            </View>
          </View>
          <View style={styles.annBox}>
            {(announcements ?? []).slice(0, 5).map((a: any, i: number) => {
              const typeColor = a.type === 'URGENT' ? '#f87171' : a.type === 'WARNING' ? '#fbbf24' : '#3B63BB';
              return (
                <View key={a.id} style={[styles.annItem, i > 0 && styles.annBorder]}>
                  <View style={[styles.annDot, { backgroundColor: typeColor }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.annTitle}>{a.title}</Text>
                    {a.body ? <Text style={styles.annBody} numberOfLines={2}>{a.body}</Text> : null}
                    <Text style={styles.annTime}>{a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : ''}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 32, height: 32, borderRadius: 8 },
  appName: { fontSize: 18, fontWeight: '700', color: '#E6EDF3', letterSpacing: 0.3 },
  greeting: { fontSize: 14, color: '#8B96A7' },
  name: { fontSize: 22, fontWeight: '700', color: '#E6EDF3' },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0D2B6B', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  xpBanner: { marginHorizontal: 20, backgroundColor: '#0D2B6B', borderRadius: 16, padding: 16, marginBottom: 16 },
  xpRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  xpLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  xpValue: { fontSize: 22, fontWeight: '700', color: '#fff' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(251,146,60,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  streakText: { color: '#fb923c', fontSize: 13, fontWeight: '600' },
  xpBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: '#fff', borderRadius: 3 },
  statsRow: { flexDirection: 'row', gap: 12, marginHorizontal: 20, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#1C2230', borderRadius: 14, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#2A3346' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#E6EDF3' },
  statLabel: { fontSize: 11, color: '#8B96A7' },
  section: { marginHorizontal: 20, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#E6EDF3' },
  seeAll: { color: '#3B63BB', fontSize: 13 },
  emptyCard: { backgroundColor: '#1C2230', borderRadius: 16, padding: 24, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#2A3346' },
  emptyText: { color: '#8B96A7', fontSize: 14 },
  btn: { backgroundColor: '#0D2B6B', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  courseCard: { backgroundColor: '#1C2230', borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10, borderWidth: 1, borderColor: '#2A3346' },
  courseIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#0D2B6B20', alignItems: 'center', justifyContent: 'center' },
  courseTitle: { fontSize: 14, fontWeight: '600', color: '#E6EDF3', marginBottom: 2 },
  courseMeta: { fontSize: 11, color: '#8B96A7', marginBottom: 6 },
  progressBg: { height: 4, backgroundColor: '#2A3346', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3B63BB', borderRadius: 2 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  quickCard: { width: '47%', backgroundColor: '#1C2230', borderRadius: 14, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#2A3346' },
  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12, color: '#8B96A7', fontWeight: '500' },
  annBox: { backgroundColor: '#1C2230', borderRadius: 16, borderWidth: 1, borderColor: '#2A3346', overflow: 'hidden' },
  annItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  annBorder: { borderTopWidth: 1, borderTopColor: '#2A3346' },
  annDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  annTitle: { fontSize: 13, fontWeight: '600', color: '#E6EDF3', marginBottom: 2 },
  annBody: { fontSize: 12, color: '#8B96A7', lineHeight: 17, marginBottom: 4 },
  annTime: { fontSize: 11, color: '#4B5563' },
});
