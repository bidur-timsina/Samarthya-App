import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Image, TextInput, Alert } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { formatDuration } from '@/lib/utils';

type Tab = 'overview' | 'curriculum' | 'syllabus' | 'reviews';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview',   label: 'Overview'   },
  { key: 'curriculum', label: 'Curriculum' },
  { key: 'syllabus',   label: 'Syllabus'   },
  { key: 'reviews',    label: 'Reviews'    },
];

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState('');

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then(r => r.data),
    enabled: !!id,
    retry: false,
  });

  const enrollMutation = useMutation({
    mutationFn: () => api.post('/enrollments', { courseId: course?.id, tier: 'BASIC' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      queryClient.invalidateQueries({ queryKey: ['enrollments', 'my'] });
    },
    onError: (err: any) => console.log(err?.response?.data?.message ?? 'Enrollment failed'),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment: string }) =>
      api.post(`/courses/${course?.id}/reviews`, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      Alert.alert('Thank you!', 'Your review has been submitted.');
      setMyComment('');
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message ?? 'Failed to submit review'),
  });

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color="#3B63BB" size="large" /></View>;
  }

  if (!course) {
    const errMsg = (error as any)?.response?.data?.message ?? (error as any)?.message ?? 'Course not found';
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color="#8B96A7" />
        <Text style={styles.errorText}>{errMsg}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isEnrolled = course.isEnrolled;
  const totalLessons = course.chapters?.reduce((a: number, c: any) => a + (c.lessons?.length ?? 0), 0) ?? 0;
  const avgRating = course.reviews?.length
    ? (course.reviews.reduce((a: number, r: any) => a + r.rating, 0) / course.reviews.length).toFixed(1)
    : null;

  return (
    <View style={styles.container}>

      {/* ── Hero (scrolls away) ── */}
      <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
        <View style={styles.hero}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          {course.thumbnail
            ? <Image source={{ uri: course.thumbnail }} style={styles.heroBg} resizeMode="cover" />
            : null}
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            {course.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{course.category.name}</Text>
              </View>
            )}
            <Text style={styles.heroTitle}>{course.title}</Text>
            <View style={styles.heroStats}>
              {avgRating && (
                <View style={styles.statItem}>
                  <Ionicons name="star" size={13} color="#f59e0b" />
                  <Text style={styles.statText}>{avgRating}</Text>
                </View>
              )}
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statText}>{course.studentCount ?? 0} students</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="earth-outline" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.statText}>Self-paced</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Enroll Banner ── */}
        {isEnrolled ? (
          <View style={styles.enrolledBanner}>
            <View style={styles.enrolledIcon}>
              <Ionicons name="checkmark-circle" size={28} color="#4ade80" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.enrolledTitle}>Already Enrolled</Text>
              <Text style={styles.enrolledSub}>You have full access to this course content.</Text>
            </View>
          </View>
        ) : (
          <View style={styles.enrollBox}>
            <TouchableOpacity
              style={styles.enrollBtn}
              onPress={() => { if (!isAuthenticated) { router.push('/(auth)/login'); return; } enrollMutation.mutate(); }}
              disabled={enrollMutation.isPending}
            >
              {enrollMutation.isPending
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.enrollBtnText}>Enroll Now</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* ── Tab Bar ── */}
        <View style={styles.tabBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabContent}>
            {TABS.map(({ key, label }) => (
              <TouchableOpacity key={key} onPress={() => setTab(key)} style={styles.tabItem}>
                <Text style={[styles.tabLabel, tab === key && styles.tabLabelActive]}>{label}</Text>
                {tab === key && <View style={styles.tabUnderline} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <View style={styles.section}>
            {course.description ? (
              <>
                <Text style={styles.sectionTitle}>Course Description</Text>
                <View style={styles.card}>
                  <Text style={styles.descText}>{course.description}</Text>
                </View>
              </>
            ) : null}

            {course.whatYouWillLearn && (
              <>
                <Text style={styles.sectionTitle}>What you'll learn</Text>
                <View style={styles.card}>
                  {course.whatYouWillLearn.split('\n').filter(Boolean).map((item: string, i: number) => (
                    <View key={i} style={styles.learnItem}>
                      <Ionicons name="checkmark-circle" size={18} color="#4ade80" />
                      <Text style={styles.learnText}>{item.trim()}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {course.requirements && (
              <>
                <Text style={styles.sectionTitle}>Requirements</Text>
                <View style={styles.card}>
                  {course.requirements.split('\n').filter(Boolean).map((item: string, i: number) => (
                    <View key={i} style={styles.bulletItem}>
                      <View style={styles.bullet} />
                      <Text style={styles.bulletText}>{item.trim()}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <View style={styles.statsCards}>
              <View style={styles.statsCard}>
                <Ionicons name="book-outline" size={20} color="#3B63BB" />
                <Text style={styles.statsValue}>{totalLessons}</Text>
                <Text style={styles.statsLabel}>Lessons</Text>
              </View>
              <View style={styles.statsCard}>
                <Ionicons name="layers-outline" size={20} color="#7c3aed" />
                <Text style={styles.statsValue}>{course.chapters?.length ?? 0}</Text>
                <Text style={styles.statsLabel}>Chapters</Text>
              </View>
              <View style={styles.statsCard}>
                <Ionicons name="bar-chart-outline" size={20} color="#f59e0b" />
                <Text style={styles.statsValue}>{course.level}</Text>
                <Text style={styles.statsLabel}>Level</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Curriculum ── */}
        {tab === 'curriculum' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{course.chapters?.length ?? 0} Chapters · {totalLessons} Lessons</Text>
            {(course.chapters ?? []).map((chapter: any) => (
              <View key={chapter.id} style={styles.chapterBox}>
                <TouchableOpacity
                  style={styles.chapterHeader}
                  onPress={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    <Text style={styles.chapterMeta}>{chapter.lessons?.length ?? 0} lessons</Text>
                  </View>
                  <Ionicons name={expandedChapter === chapter.id ? 'chevron-up' : 'chevron-down'} size={18} color="#8B96A7" />
                </TouchableOpacity>
                {expandedChapter === chapter.id && chapter.lessons?.map((lesson: any) => {
                  const locked = !lesson.isFree && !isEnrolled;
                  return (
                    <TouchableOpacity
                      key={lesson.id}
                      style={styles.lessonRow}
                      disabled={locked}
                      onPress={() => router.push({ pathname: '/lesson/[id]', params: { id: lesson.id, courseSlug: id } })}
                    >
                      <Ionicons
                        name={lesson.type === 'VIDEO' ? 'play-circle' : lesson.type === 'PDF' ? 'document-text' : 'clipboard'}
                        size={16} color={locked ? '#8B96A7' : '#3B63BB'}
                      />
                      <Text style={[styles.lessonTitle, locked && { color: '#8B96A7' }]} numberOfLines={1}>{lesson.title}</Text>
                      {locked
                        ? <Ionicons name="lock-closed" size={12} color="#2A3346" style={{ marginLeft: 'auto' }} />
                        : <Ionicons name="chevron-forward" size={13} color="#2A3346" style={{ marginLeft: 'auto' }} />}
                      {lesson.duration > 0 && <Text style={styles.lessonDuration}>{formatDuration(lesson.duration)}</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* ── Syllabus ── */}
        {tab === 'syllabus' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{course.chapters?.length ?? 0} Chapters · {totalLessons} Lessons</Text>
            {(course.chapters ?? []).length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="list-outline" size={40} color="#2A3346" />
                <Text style={styles.emptyText}>No syllabus available yet</Text>
              </View>
            ) : (course.chapters ?? []).map((chapter: any, ci: number) => (
              <View key={chapter.id} style={styles.syllabusItem}>
                <View style={styles.syllabusNumber}>
                  <Text style={styles.syllabusNumberText}>{ci + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.syllabusTitle}>{chapter.title}</Text>
                  <Text style={styles.syllabusMeta}>{chapter.lessons?.length ?? 0} lessons</Text>
                  {(chapter.lessons ?? []).map((lesson: any, li: number) => (
                    <View key={lesson.id} style={styles.syllabusLesson}>
                      <Ionicons
                        name={
                          lesson.type === 'VIDEO' ? 'play-circle-outline' :
                          lesson.type === 'PDF'   ? 'document-outline'    :
                          lesson.type === 'QUIZ'  ? 'help-circle-outline' :
                          'reader-outline'
                        }
                        size={13} color="#8B96A7"
                      />
                      <Text style={styles.syllabusLessonText}>{lesson.title}</Text>
                      {lesson.isFree && (
                        <Text style={styles.freeBadge}>Free</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── Reviews ── */}
        {tab === 'reviews' && (
          <View style={styles.section}>

            {/* Rating summary */}
            {avgRating ? (
              <View style={styles.ratingBox}>
                <Text style={styles.ratingBig}>{avgRating}</Text>
                <View style={{ flexDirection: 'row', gap: 4, marginVertical: 6 }}>
                  {[1,2,3,4,5].map(s => (
                    <Ionicons key={s} name="star" size={18} color={s <= Math.round(Number(avgRating)) ? '#f59e0b' : '#2A3346'} />
                  ))}
                </View>
                <Text style={styles.ratingCount}>{course.reviews?.length} reviews</Text>
              </View>
            ) : null}

            {/* Write a review (enrolled only) */}
            {isEnrolled && (
              <View style={styles.writeReview}>
                <Text style={styles.writeReviewTitle}>Rate this course</Text>
                <View style={styles.starRow}>
                  {[1,2,3,4,5].map(s => (
                    <TouchableOpacity key={s} onPress={() => setMyRating(s)}>
                      <Ionicons name={s <= myRating ? 'star' : 'star-outline'} size={32} color={s <= myRating ? '#f59e0b' : '#2A3346'} />
                    </TouchableOpacity>
                  ))}
                </View>
                <TextInput
                  value={myComment}
                  onChangeText={setMyComment}
                  placeholder="Share your experience (optional)"
                  placeholderTextColor="#8B96A7"
                  multiline
                  numberOfLines={3}
                  style={styles.commentInput}
                />
                <TouchableOpacity
                  style={[styles.submitBtn, (!myRating || reviewMutation.isPending) && { opacity: 0.5 }]}
                  onPress={() => { if (myRating) reviewMutation.mutate({ rating: myRating, comment: myComment }); }}
                  disabled={!myRating || reviewMutation.isPending}
                >
                  {reviewMutation.isPending
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.submitBtnText}>Submit Review</Text>}
                </TouchableOpacity>
              </View>
            )}

            {/* Review list */}
            {(course.reviews ?? []).length === 0 && !isEnrolled && (
              <View style={styles.emptyBox}>
                <Ionicons name="star-outline" size={40} color="#2A3346" />
                <Text style={styles.emptyText}>No reviews yet</Text>
              </View>
            )}
            {(course.reviews ?? []).map((review: any) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>S</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewName}>Student</Text>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {[1,2,3,4,5].map(s => (
                        <Ionicons key={s} name="star" size={11} color={s <= review.rating ? '#f59e0b' : '#2A3346'} />
                      ))}
                    </View>
                  </View>
                </View>
                {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  center: { flex: 1, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorText: { color: '#E6EDF3', fontSize: 15, textAlign: 'center', marginTop: 8 },
  backBtn: { backgroundColor: '#1C2230', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  backBtnText: { color: '#E6EDF3', fontWeight: '600' },

  // Hero
  hero: { minHeight: 240, backgroundColor: '#0D2B6B', justifyContent: 'flex-end' },
  heroBg: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(13,43,107,0.85)' },
  backIcon: { position: 'absolute', top: 52, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  heroContent: { padding: 20, paddingTop: 80, gap: 10 },
  categoryBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  categoryBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  heroTitle: { fontSize: 20, fontWeight: '700', color: '#fff', lineHeight: 28 },
  heroStats: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { color: 'rgba(255,255,255,0.8)', fontSize: 12 },

  // Enroll
  enrolledBanner: { flexDirection: 'row', alignItems: 'center', gap: 14, margin: 16, backgroundColor: '#16A34A15', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#16A34A30' },
  enrolledIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#16A34A20', alignItems: 'center', justifyContent: 'center' },
  enrolledTitle: { fontSize: 15, fontWeight: '700', color: '#4ade80', marginBottom: 2 },
  enrolledSub: { fontSize: 12, color: 'rgba(74,222,128,0.7)' },
  enrollBox: { margin: 16 },
  enrollBtn: { backgroundColor: '#0D2B6B', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  enrollBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  // Tab bar — horizontal scroll so all 4 tabs fit
  tabBar: { backgroundColor: '#161B22', borderBottomWidth: 1, borderBottomColor: '#2A3346' },
  tabContent: { flexDirection: 'row', paddingHorizontal: 4 },
  tabItem: { paddingHorizontal: 18, paddingVertical: 13, alignItems: 'center', position: 'relative' },
  tabLabel: { fontSize: 13, fontWeight: '500', color: '#8B96A7' },
  tabLabelActive: { color: '#3B63BB', fontWeight: '700' },
  tabUnderline: { position: 'absolute', bottom: 0, left: 8, right: 8, height: 2, backgroundColor: '#3B63BB', borderRadius: 1 },

  // Content
  section: { padding: 16, gap: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#E6EDF3', marginTop: 4 },
  card: { backgroundColor: '#1C2230', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#2A3346', gap: 12 },
  descText: { fontSize: 14, color: '#C9D1D9', lineHeight: 22 },
  learnItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  learnText: { flex: 1, fontSize: 13, color: '#C9D1D9', lineHeight: 20 },
  bulletItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#8B96A7', marginTop: 8 },
  bulletText: { flex: 1, fontSize: 13, color: '#C9D1D9', lineHeight: 20 },
  statsCards: { flexDirection: 'row', gap: 10 },
  statsCard: { flex: 1, backgroundColor: '#1C2230', borderRadius: 14, padding: 14, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2A3346' },
  statsValue: { fontSize: 14, fontWeight: '700', color: '#E6EDF3' },
  statsLabel: { fontSize: 11, color: '#8B96A7' },

  // Curriculum
  chapterBox: { backgroundColor: '#1C2230', borderRadius: 14, borderWidth: 1, borderColor: '#2A3346', overflow: 'hidden' },
  chapterHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  chapterTitle: { fontSize: 14, fontWeight: '600', color: '#E6EDF3', marginBottom: 2 },
  chapterMeta: { fontSize: 12, color: '#8B96A7' },
  lessonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#2A3346' },
  lessonTitle: { flex: 1, fontSize: 13, color: '#E6EDF3' },
  lessonDuration: { fontSize: 11, color: '#8B96A7' },

  // Syllabus
  syllabusItem: { flexDirection: 'row', gap: 14, backgroundColor: '#1C2230', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2A3346' },
  syllabusNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#0D2B6B', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 },
  syllabusNumberText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  syllabusTitle: { fontSize: 14, fontWeight: '600', color: '#E6EDF3', marginBottom: 2 },
  syllabusMeta: { fontSize: 11, color: '#8B96A7', marginBottom: 8 },
  syllabusLesson: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3 },
  syllabusLessonText: { flex: 1, fontSize: 12, color: '#8B96A7' },
  freeBadge: { fontSize: 10, color: '#4ade80', fontWeight: '600' },

  // Reviews
  ratingBox: { alignItems: 'center', backgroundColor: '#1C2230', borderRadius: 14, padding: 20, borderWidth: 1, borderColor: '#2A3346' },
  ratingBig: { fontSize: 48, fontWeight: '700', color: '#E6EDF3' },
  ratingCount: { fontSize: 12, color: '#8B96A7' },
  emptyBox: { alignItems: 'center', padding: 40, gap: 10 },
  emptyText: { color: '#8B96A7', fontSize: 14 },
  reviewCard: { backgroundColor: '#1C2230', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2A3346', gap: 10 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0D2B6B', alignItems: 'center', justifyContent: 'center' },
  reviewAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  reviewName: { fontSize: 13, fontWeight: '600', color: '#E6EDF3', marginBottom: 2 },
  reviewComment: { fontSize: 13, color: '#8B96A7', lineHeight: 18 },

  // Write review
  writeReview: { backgroundColor: '#1C2230', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A3346', gap: 12 },
  writeReviewTitle: { fontSize: 14, fontWeight: '700', color: '#E6EDF3' },
  starRow: { flexDirection: 'row', gap: 8 },
  commentInput: { backgroundColor: '#0D1117', borderRadius: 10, borderWidth: 1, borderColor: '#2A3346', color: '#E6EDF3', padding: 12, fontSize: 13, textAlignVertical: 'top', minHeight: 72 },
  submitBtn: { backgroundColor: '#0D2B6B', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
