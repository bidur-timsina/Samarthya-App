import { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';

type Phase = 'info' | 'exam' | 'result';

export default function ExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('info');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<any>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: exam, isLoading } = useQuery({
    queryKey: ['exam', id],
    queryFn: () => api.get(`/exams/${id}`).then(r => r.data),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: (answersPayload: Record<string, number>) =>
      api.post(`/exams/${id}/attempt`, { answers: answersPayload }).then(r => r.data),
    onSuccess: (data) => {
      setResult(data);
      setPhase('result');
      if (timerRef.current) clearInterval(timerRef.current);
    },
    onError: (err: any) => Alert.alert('Error', err?.response?.data?.message ?? 'Submission failed'),
  });

  useEffect(() => {
    if (phase === 'exam' && exam?.duration) {
      setTimeLeft(exam.duration * 60);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            submitMutation.mutate(answers);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  if (isLoading) {
    return <View style={{ flex: 1, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color="#3B63BB" size="large" /></View>;
  }

  if (!exam) {
    return <View style={{ flex: 1, backgroundColor: '#0D1117', alignItems: 'center', justifyContent: 'center' }}><Text style={{ color: '#E6EDF3' }}>Exam not found</Text></View>;
  }

  const questions = exam.questions ?? [];
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  // Info phase
  if (phase === 'info') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
        <View style={styles.infoCard}>
          <View style={styles.examIcon}>
            <Ionicons name="clipboard" size={32} color="#3B63BB" />
          </View>
          <Text style={styles.examTitle}>{exam.title}</Text>
          {exam.description && <Text style={styles.examDesc}>{exam.description}</Text>}

          <View style={styles.infoGrid}>
            {[
              { icon: 'time', label: 'Duration', value: `${exam.duration} min` },
              { icon: 'help-circle', label: 'Questions', value: questions.length },
              { icon: 'checkmark-circle', label: 'Pass Mark', value: `${exam.passMark}%` },
              { icon: 'trophy', label: 'Type', value: exam.type },
            ].map(({ icon, label, value }) => (
              <View key={label} style={styles.infoItem}>
                <Ionicons name={icon as any} size={20} color="#3B63BB" />
                <Text style={styles.infoValue}>{value}</Text>
                <Text style={styles.infoLabel}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>Instructions</Text>
            {['Read each question carefully before answering', 'You cannot go back once the exam starts', 'Timer will auto-submit when time runs out', `Minimum ${exam.passMark}% required to pass`].map(rule => (
              <View key={rule} style={styles.ruleRow}>
                <Ionicons name="chevron-forward" size={14} color="#3B63BB" />
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>

          {questions.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <Text style={{ color: '#8B96A7' }}>No questions available yet</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.startBtn} onPress={() => setPhase('exam')}>
              <Ionicons name="play" size={18} color="#fff" />
              <Text style={styles.startBtnText}>Start Exam</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    );
  }

  // Exam phase
  if (phase === 'exam') {
    const q = questions[current];
    const options: string[] = Array.isArray(q.options) ? q.options : q.options ? Object.values(q.options) : [];
    const isSubjective = options.length === 0;
    const isLast = current === questions.length - 1;

    return (
      <View style={styles.container}>
        {/* Progress bar */}
        <View style={styles.progressHeader}>
          <Text style={styles.progressText}>{current + 1}/{questions.length}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((current + 1) / questions.length) * 100}%` }]} />
          </View>
          <View style={[styles.timer, timeLeft < 60 && { backgroundColor: '#DC262620' }]}>
            <Ionicons name="time" size={14} color={timeLeft < 60 ? '#f87171' : '#3B63BB'} />
            <Text style={[styles.timerText, timeLeft < 60 && { color: '#f87171' }]}>{formatTime(timeLeft)}</Text>
          </View>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
          <Text style={styles.qText}>{q.text}</Text>

          {isSubjective ? (
            <TextInput
              style={styles.subjectiveInput}
              value={(answers[q.id] as string) ?? ''}
              onChangeText={text => setAnswers(prev => ({ ...prev, [q.id]: text }))}
              placeholder="Write your answer here..."
              placeholderTextColor="#4A5568"
              multiline
              textAlignVertical="top"
            />
          ) : (
            <View style={styles.optionsBox}>
              {options.map((option: string, idx: number) => {
                const selected = answers[q.id] === idx;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => setAnswers(prev => ({ ...prev, [q.id]: idx }))}
                  >
                    <View style={[styles.optionLetter, selected && styles.optionLetterSelected]}>
                      <Text style={[styles.optionLetterText, selected && { color: '#fff' }]}>
                        {String.fromCharCode(65 + idx)}
                      </Text>
                    </View>
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View style={styles.navBar}>
          {current > 0 && (
            <TouchableOpacity style={styles.navBtn} onPress={() => setCurrent(c => c - 1)}>
              <Ionicons name="arrow-back" size={18} color="#E6EDF3" />
              <Text style={styles.navBtnText}>Previous</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          {isLast ? (
            <TouchableOpacity
              style={[styles.navBtn, styles.submitBtn]}
              onPress={() => {
                Alert.alert('Submit Exam', `You've answered ${Object.keys(answers).length}/${questions.length} questions. Submit?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Submit', onPress: () => submitMutation.mutate(answers) },
                ]);
              }}
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? <ActivityIndicator color="#fff" size="small" /> : <>
                <Text style={[styles.navBtnText, { color: '#fff' }]}>Submit</Text>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={[styles.navBtn, styles.nextBtn]} onPress={() => setCurrent(c => c + 1)}>
              <Text style={[styles.navBtnText, { color: '#fff' }]}>Next</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // Result phase
  const pct = result?.percentage ?? (result ? Math.round((result.score / result.total) * 100) : 0);
  const passed = result?.passed;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, alignItems: 'center' }}>
      <View style={[styles.resultIcon, { backgroundColor: passed ? '#16A34A20' : '#DC262620' }]}>
        <Ionicons name={passed ? 'trophy' : 'close-circle'} size={48} color={passed ? '#4ade80' : '#f87171'} />
      </View>
      <Text style={styles.resultTitle}>{passed ? 'Congratulations!' : 'Better Luck Next Time'}</Text>
      <Text style={styles.resultSub}>{passed ? 'You passed the exam!' : `Pass mark: ${exam.passMark}%`}</Text>

      <View style={styles.scoreCard}>
        <View style={styles.scoreCircle}>
          <Text style={[styles.scoreNum, { color: passed ? '#4ade80' : '#f87171' }]}>{pct}%</Text>
          <Text style={styles.scoreLabel}>Score</Text>
        </View>
        <View style={styles.scoreDivider} />
        <View style={{ gap: 12 }}>
          {[
            { label: 'Marks Obtained', value: result?.score, color: '#4ade80' },
            { label: 'Total Marks', value: result?.total, color: '#E6EDF3' },
            { label: 'Questions', value: questions.length, color: '#8B96A7' },
          ].map(({ label, value, color }) => (
            <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 40 }}>
              <Text style={{ color: '#8B96A7', fontSize: 14 }}>{label}</Text>
              <Text style={{ color, fontSize: 14, fontWeight: '600' }}>{value}</Text>
            </View>
          ))}
        </View>
      </View>

      <TouchableOpacity style={[styles.startBtn, { marginTop: 20, width: '100%' }]} onPress={() => router.back()}>
        <Text style={styles.startBtnText}>Back to Exams</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1117' },
  infoCard: { backgroundColor: '#1C2230', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#2A3346', gap: 20 },
  examIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: '#0D2B6B20', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  examTitle: { fontSize: 20, fontWeight: '700', color: '#E6EDF3', textAlign: 'center' },
  examDesc: { fontSize: 14, color: '#8B96A7', textAlign: 'center', lineHeight: 20 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  infoItem: { flex: 1, minWidth: '45%', backgroundColor: '#161B22', borderRadius: 12, padding: 14, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#2A3346' },
  infoValue: { fontSize: 16, fontWeight: '700', color: '#E6EDF3' },
  infoLabel: { fontSize: 11, color: '#8B96A7' },
  rulesBox: { backgroundColor: '#161B22', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#2A3346', gap: 8 },
  rulesTitle: { fontSize: 13, fontWeight: '600', color: '#E6EDF3', marginBottom: 4 },
  ruleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  ruleText: { flex: 1, fontSize: 13, color: '#8B96A7', lineHeight: 18 },
  startBtn: { backgroundColor: '#0D2B6B', borderRadius: 12, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  startBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  progressHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  progressText: { fontSize: 12, color: '#8B96A7', width: 40 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#2A3346', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3B63BB', borderRadius: 3 },
  timer: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0D2B6B20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  timerText: { fontSize: 13, fontWeight: '600', color: '#3B63BB' },
  qText: { fontSize: 16, fontWeight: '600', color: '#E6EDF3', lineHeight: 24, marginBottom: 20 },
  optionsBox: { gap: 10 },
  subjectiveInput: { backgroundColor: '#1C2230', borderRadius: 14, borderWidth: 1, borderColor: '#2A3346', color: '#E6EDF3', fontSize: 15, padding: 16, minHeight: 160, lineHeight: 22 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1C2230', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#2A3346' },
  optionSelected: { borderColor: '#3B63BB', backgroundColor: '#0D2B6B20' },
  optionLetter: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#2A3346', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  optionLetterSelected: { backgroundColor: '#3B63BB' },
  optionLetterText: { fontSize: 13, fontWeight: '700', color: '#8B96A7' },
  optionText: { flex: 1, fontSize: 14, color: '#8B96A7', lineHeight: 20 },
  optionTextSelected: { color: '#E6EDF3' },
  navBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#2A3346' },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2A3346', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10 },
  navBtnText: { fontSize: 14, fontWeight: '600', color: '#E6EDF3' },
  nextBtn: { backgroundColor: '#0D2B6B', borderColor: '#0D2B6B' },
  submitBtn: { backgroundColor: '#16A34A', borderColor: '#16A34A' },
  resultIcon: { width: 96, height: 96, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 20 },
  resultTitle: { fontSize: 24, fontWeight: '700', color: '#E6EDF3', marginBottom: 8, textAlign: 'center' },
  resultSub: { fontSize: 14, color: '#8B96A7', marginBottom: 32, textAlign: 'center' },
  scoreCard: { backgroundColor: '#1C2230', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#2A3346', flexDirection: 'row', alignItems: 'center', gap: 24, width: '100%' },
  scoreCircle: { alignItems: 'center', gap: 4 },
  scoreNum: { fontSize: 36, fontWeight: '800' },
  scoreLabel: { fontSize: 12, color: '#8B96A7' },
  scoreDivider: { width: 1, height: 60, backgroundColor: '#2A3346' },
});
