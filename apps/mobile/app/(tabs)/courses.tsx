import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fixMediaUrl } from '@/lib/utils';

export default function CoursesScreen() {
  const router = useRouter();
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => api.get('/enrollments/my').then(r => r.data),
  });

  if (isLoading) return <View style={{ flex: 1, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#3B63BB" /></View>;

  const courses = enrollments ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Courses</Text>
        <View style={styles.countBadge}><Text style={styles.countText}>{courses.length}</Text></View>
      </View>

      <FlatList
        data={courses}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 20, gap: 12 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="book-outline" size={56} color="#2A3346" />
            <Text style={styles.emptyTitle}>No courses yet</Text>
            <Text style={styles.emptySubtitle}>Enroll in a course to start learning</Text>
            <TouchableOpacity style={styles.btn} onPress={() => router.push('/(tabs)/explore')}>
              <Text style={styles.btnText}>Browse Courses</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const course = item.course;
          const total = course.chapters?.flatMap((c: any) => c.lessons).length ?? 0;
          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/course/${course.slug}`)}>
              <View style={styles.thumbnail}>
                {course.thumbnail
                  ? <Image source={{ uri: fixMediaUrl(course.thumbnail) }} style={{ width: '100%', height: '100%', borderRadius: 14 }} resizeMode="cover" />
                  : <Ionicons name="book" size={28} color="#3B63BB" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={2}>{course.title}</Text>
                <Text style={styles.cardMeta}>{course.category?.name} · {total} lessons</Text>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: '25%' }]} />
                </View>
                <Text style={styles.progressText}>25% complete</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#2A3346" />
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 56, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#E6EDF3' },
  countBadge: { backgroundColor: '#0D2B6B', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 20 },
  countText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#E6EDF3' },
  emptySubtitle: { fontSize: 14, color: '#8B96A7', textAlign: 'center' },
  btn: { backgroundColor: '#0D2B6B', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: '#1C2230', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderColor: '#2A3346' },
  thumbnail: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#0D2B6B20', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '600', color: '#E6EDF3', marginBottom: 3 },
  cardMeta: { fontSize: 12, color: '#8B96A7', marginBottom: 8 },
  progressBg: { height: 4, backgroundColor: '#2A3346', borderRadius: 2, overflow: 'hidden', marginBottom: 4 },
  progressFill: { height: '100%', backgroundColor: '#3B63BB', borderRadius: 2 },
  progressText: { fontSize: 10, color: '#8B96A7' },
});
