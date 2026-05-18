import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { formatDuration } from '@/lib/utils';
import YoutubePlayer from 'react-native-youtube-iframe';
import WebView from 'react-native-webview';

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
  } catch {}
  return null;
}

export default function LessonScreen() {
  const { id, courseSlug } = useLocalSearchParams<{ id: string; courseSlug: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const videoHeight = Math.round((width * 9) / 16);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', courseSlug],
    queryFn: () => api.get(`/courses/${courseSlug}`).then(r => r.data),
    enabled: !!courseSlug,
  });

  const lesson = course?.chapters
    ?.flatMap((c: any) => c.lessons ?? [])
    ?.find((l: any) => l.id === id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#3B63BB" size="large" />
      </View>
    );
  }

  if (!lesson) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color="#8B96A7" />
        <Text style={styles.notFoundText}>Lesson not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ytId = lesson.videoUrl ? getYouTubeId(lesson.videoUrl) : null;

  return (
    <View style={styles.container}>
      {/* VIDEO — full-width at top, no scroll above it */}
      {lesson.type === 'VIDEO' && (
        <View style={{ backgroundColor: '#000' }}>
          {ytId ? (
            <YoutubePlayer
              height={videoHeight}
              width={width}
              videoId={ytId}
              play={true}
            />
          ) : (
            <View style={{ height: videoHeight, alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
              <Ionicons name="videocam-off-outline" size={40} color="#8B96A7" />
              <Text style={{ color: '#8B96A7', marginTop: 8 }}>No video link added</Text>
            </View>
          )}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={22} color="#E6EDF3" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.lessonTitle} numberOfLines={3}>{lesson.title}</Text>
            {lesson.duration > 0 && (
              <Text style={styles.lessonMeta}>{formatDuration(lesson.duration)}</Text>
            )}
          </View>
        </View>

        {/* PDF */}
        {lesson.type === 'PDF' && (
          <View style={styles.section}>
            {lesson.pdfUrl ? (
              <View style={{ height: 500, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#2A3346' }}>
                <WebView
                  source={{ uri: lesson.pdfUrl }}
                  style={{ flex: 1, backgroundColor: '#1C2230' }}
                  startInLoadingState
                  renderLoading={() => (
                    <View style={[styles.center, { position: 'absolute', inset: 0 }]}>
                      <ActivityIndicator color="#3B63BB" />
                    </View>
                  )}
                />
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="document-outline" size={40} color="#8B96A7" />
                <Text style={styles.emptyText}>No PDF uploaded yet</Text>
              </View>
            )}
          </View>
        )}

        {/* NOTE */}
        {lesson.type === 'NOTE' && (
          <View style={styles.section}>
            {lesson.content ? (
              <View style={styles.noteCard}>
                <View style={styles.noteHeader}>
                  <Ionicons name="document-text" size={18} color="#3B63BB" />
                  <Text style={styles.noteHeaderText}>Lesson Notes</Text>
                </View>
                <Text style={styles.noteContent}>{lesson.content}</Text>
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Ionicons name="document-outline" size={40} color="#8B96A7" />
                <Text style={styles.emptyText}>No content added yet</Text>
              </View>
            )}
          </View>
        )}

        {/* QUIZ placeholder */}
        {lesson.type === 'QUIZ' && (
          <View style={styles.section}>
            <View style={styles.emptyCard}>
              <Ionicons name="clipboard-outline" size={40} color="#8B96A7" />
              <Text style={styles.emptyText}>Quiz coming soon</Text>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  notFoundText: { color: '#E6EDF3', fontSize: 16, marginTop: 8 },
  backBtn: { backgroundColor: '#1C2230', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  backBtnText: { color: '#E6EDF3', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 16 },
  backIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#1C2230', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  lessonTitle: { fontSize: 16, fontWeight: '700', color: '#E6EDF3', lineHeight: 22 },
  lessonMeta: { fontSize: 12, color: '#8B96A7', marginTop: 4 },
  section: { paddingHorizontal: 20 },
  noteCard: { backgroundColor: '#1C2230', borderRadius: 16, borderWidth: 1, borderColor: '#2A3346', overflow: 'hidden' },
  noteHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderBottomWidth: 1, borderBottomColor: '#2A3346', backgroundColor: '#0D2B6B20' },
  noteHeaderText: { fontSize: 14, fontWeight: '600', color: '#3B63BB' },
  noteContent: { fontSize: 14, color: '#C9D1D9', lineHeight: 22, padding: 16 },
  emptyCard: { backgroundColor: '#1C2230', borderRadius: 16, borderWidth: 1, borderColor: '#2A3346', alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  emptyText: { fontSize: 14, color: '#8B96A7' },
});
