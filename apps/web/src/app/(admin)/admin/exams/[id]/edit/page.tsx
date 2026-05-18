'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ArrowLeft, Plus, Trash2, Loader2, Save, ClipboardList, FileText, BookOpen, Upload, Download } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

type ExamMode = 'MCQ' | 'SUBJECTIVE';

interface MCQQuestion {
  id?: string;
  type: 'MCQ';
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  marks: number;
}

interface SubjectiveQuestion {
  id?: string;
  type: 'SUBJECTIVE';
  text: string;
  modelAnswer: string;
  marks: number;
}

type Question = MCQQuestion | SubjectiveQuestion;

const blankMCQ = (): MCQQuestion => ({ type: 'MCQ', text: '', options: ['', '', '', ''], correctIndex: 0, explanation: '', marks: 1 });
const blankSubjective = (): SubjectiveQuestion => ({ type: 'SUBJECTIVE', text: '', modelAnswer: '', marks: 5 });

function detectMode(questions: any[]): ExamMode {
  if (!questions?.length) return 'MCQ';
  return questions[0].questionType === 'SUBJECTIVE' ? 'SUBJECTIVE' : 'MCQ';
}

function fromApi(q: any): Question {
  if (q.questionType === 'SUBJECTIVE') {
    return { id: q.id, type: 'SUBJECTIVE', text: q.text ?? '', modelAnswer: q.modelAnswer ?? '', marks: q.marks ?? 5 };
  }
  return {
    id: q.id, type: 'MCQ', text: q.text ?? '',
    options: Array.isArray(q.options) ? q.options : ['', '', '', ''],
    correctIndex: q.correctAnswer ?? 0,
    explanation: q.explanation ?? '',
    marks: q.marks ?? 1,
  };
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Explanation', 'Correct Option', 'Marks'],
    ['Sample question text?', 'First answer', 'Second answer', 'Third answer', 'Fourth answer', 'Brief explanation', 'A', '1'],
  ]);
  ws['!cols'] = [{ wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 25 }, { wch: 14 }, { wch: 8 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'MCQ Questions');
  XLSX.writeFile(wb, 'mcq_template.xlsx');
}

function parseCorrectIndex(val: any): number {
  if (typeof val === 'number') return Math.max(0, Math.min(3, val));
  const s = String(val).trim().toUpperCase();
  const map: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
  return map[s] ?? 0;
}

function parseSheet(file: File): Promise<MCQQuestion[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        let headerIdx = 0;
        for (let i = 0; i < Math.min(5, rows.length); i++) {
          if (rows[i].some((c: any) => String(c).toLowerCase().includes('question'))) { headerIdx = i; break; }
        }
        const dataRows = rows.slice(headerIdx + 1).filter(r => r.some(c => c !== ''));
        const questions: MCQQuestion[] = dataRows.map(row => ({
          type: 'MCQ',
          text: String(row[0] ?? '').trim(),
          options: [String(row[1] ?? '').trim(), String(row[2] ?? '').trim(), String(row[3] ?? '').trim(), String(row[4] ?? '').trim()],
          explanation: String(row[5] ?? '').trim(),
          correctIndex: parseCorrectIndex(row[6]),
          marks: Number(row[7]) || 1,
        })).filter(q => q.text);
        resolve(questions);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export default function EditExamPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [mode, setMode] = useState<ExamMode>('MCQ');
  const [form, setForm] = useState({ title: '', description: '', type: 'FORMAL', duration: 60, passMark: 40, courseId: '' });
  const [questions, setQuestions] = useState<Question[]>([]);
  const importRef = useRef<HTMLInputElement>(null);

  const { data: exam, isLoading } = useQuery({
    queryKey: ['admin', 'exam', id],
    queryFn: () => api.get(`/exams/${id}`).then(r => r.data),
  });

  const { data: courses } = useQuery({
    queryKey: ['courses', 'all'],
    queryFn: () => api.get('/courses?all=true&limit=100').then(r => r.data.data ?? r.data),
  });

  useEffect(() => {
    if (exam) {
      setForm({
        title: exam.title ?? '',
        description: exam.description ?? '',
        type: exam.type ?? 'FORMAL',
        duration: exam.duration ?? 60,
        passMark: exam.passMark ?? 40,
        courseId: exam.courseId ?? '',
      });
      const qs: Question[] = (exam.questions ?? []).map(fromApi);
      setQuestions(qs.length ? qs : [blankMCQ()]);
      setMode(detectMode(exam.questions ?? []));
    }
  }, [exam]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const mappedQuestions = questions.map((q, i) => {
        if (q.type === 'MCQ') {
          return { id: q.id, questionType: 'OBJECTIVE', text: q.text, options: q.options, correctAnswer: q.correctIndex, explanation: q.explanation || undefined, marks: q.marks, order: i + 1 };
        } else {
          return { id: q.id, questionType: 'SUBJECTIVE', text: q.text, modelAnswer: q.modelAnswer || undefined, marks: q.marks, order: i + 1 };
        }
      });
      return api.patch(`/exams/${id}`, {
        title: form.title,
        description: form.description || undefined,
        type: form.type,
        duration: form.duration,
        passMark: form.passMark,
        courseId: form.courseId || undefined,
        questions: mappedQuestions,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'exam', id] }); toast.success('Saved!'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Save failed'),
  });

  const switchMode = (m: ExamMode) => {
    if (m === mode) return;
    if (!confirm(`Switch to ${m === 'MCQ' ? 'MCQ' : 'Subjective'} mode? All current questions will be reset.`)) return;
    setMode(m);
    setQuestions(m === 'MCQ' ? [blankMCQ()] : [blankSubjective()]);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const imported = await parseSheet(file);
      if (!imported.length) return toast.error('No valid questions found in the file');
      setMode('MCQ');
      setQuestions(imported);
      toast.success(`Imported ${imported.length} question${imported.length !== 1 ? 's' : ''} — click Save Changes to apply`);
    } catch {
      toast.error('Failed to parse file — make sure it matches the template');
    }
  };

  const addQuestion = () => setQuestions(q => [...q, mode === 'MCQ' ? blankMCQ() : blankSubjective()]);
  const removeQuestion = (i: number) => setQuestions(q => q.filter((_, idx) => idx !== i));

  const updateQ = (i: number, updates: Partial<Question>) =>
    setQuestions(q => q.map((item, idx) => idx === i ? { ...item, ...updates } as Question : item));

  const updateOption = (qi: number, oi: number, value: string) =>
    setQuestions(q => q.map((item, idx) => {
      if (idx !== qi || item.type !== 'MCQ') return item;
      return { ...item, options: item.options.map((o, oidx) => oidx === oi ? value : o) };
    }));

  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/exams" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
          <ArrowLeft className="w-5 h-5 text-dark-muted" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{exam?.title}</h1>
          <p className="text-dark-muted text-sm">{questions.length} question{questions.length !== 1 ? 's' : ''} · {totalMarks} marks total</p>
        </div>
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Exam Mode Toggle */}
      <div className="card p-5">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Exam Type</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => switchMode('MCQ')}
            className={cn('flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
              mode === 'MCQ' ? 'border-brand-500 bg-brand-900/10' : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600')}
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', mode === 'MCQ' ? 'bg-brand-600' : 'bg-gray-100 dark:bg-dark-border')}>
              <ClipboardList className={cn('w-5 h-5', mode === 'MCQ' ? 'text-white' : 'text-dark-muted')} />
            </div>
            <div>
              <p className={cn('font-semibold text-sm', mode === 'MCQ' ? 'text-brand-400' : 'text-gray-900 dark:text-white')}>MCQ Exam</p>
              <p className="text-xs text-dark-muted">Multiple choice, auto-graded</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => switchMode('SUBJECTIVE')}
            className={cn('flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
              mode === 'SUBJECTIVE' ? 'border-brand-500 bg-brand-900/10' : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600')}
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', mode === 'SUBJECTIVE' ? 'bg-brand-600' : 'bg-gray-100 dark:bg-dark-border')}>
              <FileText className={cn('w-5 h-5', mode === 'SUBJECTIVE' ? 'text-white' : 'text-dark-muted')} />
            </div>
            <div>
              <p className={cn('font-semibold text-sm', mode === 'SUBJECTIVE' ? 'text-brand-400' : 'text-gray-900 dark:text-white')}>Subjective Exam</p>
              <p className="text-xs text-dark-muted">Written answers, manually graded</p>
            </div>
          </button>
        </div>
      </div>

      {/* Settings */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Exam Settings</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input resize-none" placeholder="Optional description..." />
        </div>

        {/* Course Assignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Assign to Course
            <span className="text-dark-muted font-normal ml-2 text-xs">(optional — leave blank for standalone exam)</span>
          </label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
            <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))} className="input pl-9">
              <option value="">— No course (standalone exam) —</option>
              {(courses ?? []).map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Exam Format</label>
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="input">
              <option value="FORMAL">Formal Exam</option>
              <option value="PRACTICE">Practice Set</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Duration (min)</label>
            <input type="number" min={1} value={form.duration} onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pass Mark (%)</label>
            <input type="number" min={1} max={100} value={form.passMark} onChange={e => setForm(f => ({ ...f, passMark: Number(e.target.value) }))} className="input" />
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">{questions.length} Question{questions.length !== 1 ? 's' : ''}</h2>
            <p className="text-xs text-dark-muted mt-0.5">Total marks: {totalMarks}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {mode === 'MCQ' && (
              <>
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="btn-secondary text-sm flex items-center gap-1.5"
                  title="Download blank Excel template"
                >
                  <Download className="w-4 h-4" /> Template
                </button>
                <button
                  type="button"
                  onClick={() => importRef.current?.click()}
                  className="btn-secondary text-sm flex items-center gap-1.5"
                  title="Import questions from Excel or CSV"
                >
                  <Upload className="w-4 h-4" /> Import Excel
                </button>
                <input
                  ref={importRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={handleImport}
                />
              </>
            )}
            <button type="button" onClick={addQuestion} className="btn-secondary text-sm flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Add Question
            </button>
          </div>
        </div>

        {questions.map((q, qi) => (
          <div key={qi} className="card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-dark-muted bg-gray-100 dark:bg-dark-border px-2 py-1 rounded-lg">Q{qi + 1}</span>
                <span className={cn('text-xs font-semibold px-2 py-1 rounded-lg', q.type === 'MCQ' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400')}>
                  {q.type === 'MCQ' ? 'Multiple Choice' : 'Subjective'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-dark-muted">Marks:</label>
                  <input type="number" min={1} value={q.marks} onChange={e => updateQ(qi, { marks: Number(e.target.value) })} className="input w-16 text-sm py-1" />
                </div>
                {questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(qi)} className="p-1.5 rounded-lg hover:bg-red-500/10">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={q.text}
              onChange={e => updateQ(qi, { text: e.target.value })}
              className="input resize-none font-medium"
              rows={2}
              placeholder="Enter question text..."
            />

            {/* MCQ Options */}
            {q.type === 'MCQ' && (
              <div className="space-y-2">
                <p className="text-xs text-dark-muted font-medium">Answer Options — click circle to mark correct</p>
                {q.options.map((opt, oi) => (
                  <label key={oi} className={cn('flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer',
                    q.correctIndex === oi ? 'border-green-500/50 bg-green-500/5' : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-500')}>
                    <input type="radio" name={`correct-${qi}`} checked={q.correctIndex === oi} onChange={() => updateQ(qi, { correctIndex: oi })} className="accent-green-500 flex-shrink-0" />
                    <input
                      type="text"
                      value={opt}
                      onChange={e => updateOption(qi, oi, e.target.value)}
                      className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder:text-dark-muted"
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    />
                    {q.correctIndex === oi && <span className="text-xs text-green-400 font-semibold flex-shrink-0">✓ Correct</span>}
                  </label>
                ))}
                <input
                  type="text"
                  value={q.explanation}
                  onChange={e => updateQ(qi, { explanation: e.target.value })}
                  className="input text-sm"
                  placeholder="Explanation (shown after attempt, optional)"
                />
              </div>
            )}

            {/* Subjective Model Answer */}
            {q.type === 'SUBJECTIVE' && (
              <div>
                <label className="block text-xs text-dark-muted font-medium mb-1.5">Model Answer <span className="font-normal">(shown to students after submission)</span></label>
                <textarea
                  value={q.modelAnswer}
                  onChange={e => updateQ(qi, { modelAnswer: e.target.value })}
                  rows={4}
                  className="input resize-y text-sm"
                  placeholder="Write the ideal answer here..."
                />
              </div>
            )}
          </div>
        ))}

        {questions.length === 0 && (
          <div className="card p-10 text-center text-dark-muted">
            No questions yet. <button type="button" onClick={addQuestion} className="text-brand-400 hover:text-brand-500">Add one</button>
          </div>
        )}
      </div>

      {/* Footer save */}
      <div className="flex justify-end pb-8">
        <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="btn-primary px-8 flex items-center gap-2">
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>
    </div>
  );
}
