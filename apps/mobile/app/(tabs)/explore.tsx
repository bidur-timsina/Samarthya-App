import { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fixMediaUrl } from '@/lib/utils';

export default function ExploreScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');

  const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: () => api.get('/courses/categories').then(r => r.data) });
  const { data, isLoading } = useQuery({
    queryKey: ['courses', { search, category, level }],
    queryFn: () => api.get('/courses', { params: { search, category, level, limit: 20 } }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const courses = data?.data ?? [];

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color="#8B96A7" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search courses..."
            placeholderTextColor="#8B96A7"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <FlatList
        data={courses}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListHeaderComponent={
          <FlatList
            horizontal
            data={[{ id: '', slug: '', name: 'All' }, ...(categories ?? [])]}
            keyExtractor={item => item.id || 'all'}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setCategory(item.slug)}
                style={[styles.chip, category === item.slug && styles.chipActive]}
              >
                <Text style={[styles.chipText, category === item.slug && styles.chipTextActive]}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator color="#3B63BB" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="book-outline" size={48} color="#2A3346" />
              <Text style={styles.emptyText}>No courses found</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => router.push(`/course/${item.slug}`)}>
            <View style={styles.thumbnail}>
              {item.thumbnail ? <Image source={{ uri: fixMediaUrl(item.thumbnail) }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <Ionicons name="book" size={32} color="#3B63BB" />}
              <View style={styles.priceBadge}>
                <Text style={styles.priceText}>{Number(item.price) === 0 ? 'Free' : `NRS ${Number(item.price).toLocaleString()}`}</Text>
              </View>
            </View>
            <View style={styles.cardBody}>
              <Text style={styles.category}>{item.category?.name}</Text>
              <Text style={styles.courseTitle} numberOfLines={2}>{item.title}</Text>
              <View style={styles.meta}>
                <Ionicons name="star" size={12} color="#f59e0b" />
                <Text style={styles.metaText}>{item.avgRating > 0 ? item.avgRating.toFixed(1) : 'New'}</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.metaText}>{item.totalLessons} lessons</Text>
                <Text style={styles.metaDot}>·</Text>
                <Text style={styles.levelBadge}>{item.level?.charAt(0) + item.level?.slice(1).toLowerCase()}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  header: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, gap: 12 },
  title: { fontSize: 22, fontWeight: '700', color: '#E6EDF3' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#1C2230', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#2A3346' },
  searchInput: { flex: 1, color: '#E6EDF3', fontSize: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1C2230', borderWidth: 1, borderColor: '#2A3346' },
  chipActive: { backgroundColor: '#0D2B6B', borderColor: '#0D2B6B' },
  chipText: { color: '#8B96A7', fontSize: 13, fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  card: { backgroundColor: '#1C2230', borderRadius: 16, overflow: 'hidden', marginBottom: 14, borderWidth: 1, borderColor: '#2A3346' },
  thumbnail: { height: 160, backgroundColor: '#161B22', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  priceBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(13,17,23,0.85)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  priceText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cardBody: { padding: 14, gap: 4 },
  category: { fontSize: 11, color: '#3B63BB', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  courseTitle: { fontSize: 15, fontWeight: '600', color: '#E6EDF3', lineHeight: 20 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaText: { fontSize: 12, color: '#8B96A7' },
  metaDot: { color: '#2A3346', fontSize: 12 },
  levelBadge: { fontSize: 11, color: '#8B96A7' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: '#8B96A7', fontSize: 15 },
});
