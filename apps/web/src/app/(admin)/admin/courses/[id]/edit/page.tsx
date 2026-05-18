'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ArrowLeft, Plus, Trash2, GripVertical, Upload, Loader2, Video, ChevronDown, ChevronRight, Pencil, FileText, ClipboardList, X, BookOpen, Link2, Check, Save } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const;

export default function EditCoursePage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [openChapter, setOpenChapter] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [thumbnailMode, setThumbnailMode] = useState<'upload' | 'link'>('upload');
  const [thumbnailLink, setThumbnailLink] = useState('');
  const [form, setForm] = useState({
    title: '', description: '', categoryId: '', price: '0',
    level: 'BEGINNER', isPublished: false, isFeatured: false,
    whatYouWillLearn: '', requirements: '', syllabus: '',
  });

  const { data: course, isLoading } = useQuery({
    queryKey: ['admin', 'course', id],
    queryFn: () => api.get(`/courses/${id}/admin`).then(r => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/courses/categories').then(r => r.data),
  });

  useEffect(() => {
    if (course) {
      setForm({
        title: course.title ?? '',
        description: course.description ?? '',
        categoryId: course.categoryId ?? '',
        price: String(course.price ?? 0),
        level: course.level ?? 'BEGINNER',
        isPublished: course.isPublished ?? false,
        isFeatured: course.isFeatured ?? false,
        whatYouWillLearn: course.whatYouWillLearn ?? '',
        requirements: course.requirements ?? '',
        syllabus: course.syllabus ?? '',
      });
      if (course.thumbnail) setThumbnailPreview(course.thumbnail);
    }
  }, [course]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/courses/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'course', id] }); toast.success('Saved!'); },
    onError: () => toast.error('Save failed'),
  });

  const handleThumbnailUpload = async (file: File) => {
    const blobUrl = URL.createObjectURL(file);
    setThumbnailPreview(blobUrl);   // show local preview instantly
    setThumbnailUploading(true);
    try {
      const fd = new FormData(); fd.append('file', file);
      const { data } = await api.post('/uploads/image', fd);
      // Keep blob URL as visual preview; save MinIO URL to DB only
      updateMutation.mutate({ thumbnail: data.url });
      toast.success('Thumbnail updated!');
    } catch (err: any) {
      setThumbnailPreview(course?.thumbnail ?? '');
      toast.error(err?.response?.data?.message ?? 'Upload failed');
    } finally {
      setThumbnailUploading(false);
    }
  };

  const addChapterMutation = useMutation({
    mutationFn: () => api.post(`/courses/${id}/chapters`, { title: 'New Chapter', order: (course?.chapters?.length ?? 0) + 1 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'course', id] }),
  });

  const deleteChapterMutation = useMutation({
    mutationFn: (chapterId: string) => api.delete(`/courses/${id}/chapters/${chapterId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'course', id] }),
  });


  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="w-6 h-6 animate-spin text-brand-400" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/courses" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
          <ArrowLeft className="w-5 h-5 text-dark-muted" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">{course?.title}</h1>
          <p className="text-dark-muted text-sm">Edit course details and curriculum</p>
        </div>
        <button
          onClick={() => updateMutation.mutate({ ...form, price: Number(form.price) })}
          disabled={updateMutation.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thumbnail */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-900 dark:text-white">Thumbnail</label>
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-border rounded-lg">
                <button
                  onClick={() => setThumbnailMode('upload')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${thumbnailMode === 'upload' ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm' : 'text-dark-muted hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
                <button
                  onClick={() => setThumbnailMode('link')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${thumbnailMode === 'link' ? 'bg-white dark:bg-dark-surface text-gray-900 dark:text-white shadow-sm' : 'text-dark-muted hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  <Link2 className="w-3.5 h-3.5" /> Link
                </button>
              </div>
            </div>

            {/* Preview */}
            {thumbnailPreview && (
              <div className="relative rounded-xl overflow-hidden bg-gray-100 dark:bg-dark-bg" style={{ height: 160 }}>
                <img src={thumbnailPreview} alt="thumb" className="w-full h-full object-cover" />
                <button
                  onClick={() => { setThumbnailPreview(''); setThumbnailLink(''); updateMutation.mutate({ thumbnail: '' }); }}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {thumbnailUploading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-dark-bg/60">
                    <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
                    <p className="text-sm text-white font-medium">Uploading…</p>
                  </div>
                )}
              </div>
            )}

            {/* Upload mode */}
            {thumbnailMode === 'upload' && (
              <div
                onClick={() => !thumbnailUploading && document.getElementById('thumb-edit')?.click()}
                className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 py-8 transition-colors ${thumbnailUploading ? 'cursor-wait border-brand-500' : 'cursor-pointer hover:border-brand-400 border-gray-200 dark:border-dark-border'}`}
              >
                <Upload className="w-6 h-6 text-dark-muted" />
                <p className="text-sm text-dark-muted">Click to upload image</p>
                <p className="text-xs text-dark-muted/60">PNG, JPG, WEBP up to 5MB</p>
                <input id="thumb-edit" type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { handleThumbnailUpload(f); e.target.value = ''; } }} />
              </div>
            )}

            {/* Link mode */}
            {thumbnailMode === 'link' && (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={thumbnailLink}
                  onChange={e => setThumbnailLink(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && thumbnailLink.trim()) {
                      setThumbnailPreview(thumbnailLink.trim());
                      updateMutation.mutate({ thumbnail: thumbnailLink.trim() });
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                  className="input flex-1 text-sm"
                />
                <button
                  onClick={() => {
                    if (thumbnailLink.trim()) {
                      setThumbnailPreview(thumbnailLink.trim());
                      updateMutation.mutate({ thumbnail: thumbnailLink.trim() });
                    }
                  }}
                  className="btn-primary px-4 flex items-center gap-1.5 text-sm"
                >
                  <Check className="w-4 h-4" /> Apply
                </button>
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Details</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className="input resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
                <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="input">
                  <option value="">No category</option>
                  {(categories ?? []).map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Level</label>
                <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))} className="input">
                  {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Price (NRS)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-muted text-sm">NRS</span>
                <input type="number" min={0} value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="input pl-14" />
              </div>
            </div>
          </div>

          {/* Overview */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Overview</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                What You'll Learn
                <span className="text-dark-muted font-normal ml-2 text-xs">One item per line</span>
              </label>
              <textarea
                value={form.whatYouWillLearn}
                onChange={e => setForm(f => ({ ...f, whatYouWillLearn: e.target.value }))}
                rows={6}
                placeholder={"Comprehensive understanding of course concepts\nPractical skills and real-world applications\nProblem-solving and critical thinking abilities"}
                className="input resize-y font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Requirements
                <span className="text-dark-muted font-normal ml-2 text-xs">One item per line</span>
              </label>
              <textarea
                value={form.requirements}
                onChange={e => setForm(f => ({ ...f, requirements: e.target.value }))}
                rows={4}
                placeholder={"Basic understanding of the subject\nNo prior experience required"}
                className="input resize-y font-mono text-sm"
              />
            </div>
          </div>

          {/* Syllabus */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Syllabus</h2>
            <p className="text-xs text-dark-muted">Write a detailed syllabus. This appears in the Syllabus tab of the course page.</p>
            <textarea
              value={form.syllabus}
              onChange={e => setForm(f => ({ ...f, syllabus: e.target.value }))}
              rows={10}
              placeholder="Unit 1: Introduction&#10;- Topic 1&#10;- Topic 2&#10;&#10;Unit 2: Core Concepts&#10;- Topic 3&#10;- Topic 4"
              className="input resize-y font-mono text-sm w-full"
            />
          </div>
        </div>

        {/* Right: Settings */}
        <div className="space-y-6">
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold text-gray-900 dark:text-white">Settings</h2>
            {[
              { key: 'isPublished', label: 'Published', sub: 'Visible to students' },
              { key: 'isFeatured', label: 'Featured', sub: 'Show on homepage' },
            ].map(({ key, label, sub }) => (
              <label key={key} className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }))}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${(form as any)[key] ? 'bg-brand-700' : 'bg-dark-border'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${(form as any)[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
                  <p className="text-xs text-dark-muted">{sub}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="card p-5 space-y-2">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Stats</h2>
            <div className="flex justify-between text-sm">
              <span className="text-dark-muted">Students</span>
              <span className="text-gray-900 dark:text-white font-medium">{course?.studentCount ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-muted">Chapters</span>
              <span className="text-gray-900 dark:text-white font-medium">{course?.chapters?.length ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-muted">Lessons</span>
              <span className="text-gray-900 dark:text-white font-medium">
                {course?.chapters?.flatMap((c: any) => c.lessons ?? []).length ?? 0}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-dark-muted">Rating</span>
              <span className="text-gray-900 dark:text-white font-medium">{course?.avgRating?.toFixed(1) ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Curriculum */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Curriculum</h2>
          <button onClick={() => addChapterMutation.mutate()} className="btn-secondary text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Chapter
          </button>
        </div>

        <div className="divide-y divide-gray-100 dark:divide-dark-border">
          {(course?.chapters ?? []).length === 0 && (
            <div className="p-10 text-center text-dark-muted">
              <p>No chapters yet.</p>
              <button onClick={() => addChapterMutation.mutate()} className="btn-primary mt-3 text-sm">Add First Chapter</button>
            </div>
          )}
          {(course?.chapters ?? []).map((chapter: any, ci: number) => (
            <ChapterRow
              key={chapter.id}
              chapter={chapter}
              ci={ci}
              courseId={id}
              isOpen={openChapter === chapter.id}
              onToggle={() => setOpenChapter(openChapter === chapter.id ? null : chapter.id)}
              onDelete={() => { if (confirm('Delete chapter and all its lessons?')) deleteChapterMutation.mutate(chapter.id); }}
              qc={qc}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Chapter Row (with Videos / Notes / Exam tabs) ────────────────────────────
type ChapterTab = 'videos' | 'notes' | 'exam';

function ChapterRow({ chapter, ci, courseId, isOpen, onToggle, onDelete, qc }: any) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chapter.title);
  const [tab, setTab] = useState<ChapterTab>('videos');

  useEffect(() => { setTitle(chapter.title); }, [chapter.title]);

  const saveChapter = async () => {
    if (!title.trim() || title === chapter.title) { setEditing(false); return; }
    try {
      await api.patch(`/courses/${courseId}/chapters/${chapter.id}`, { title: title.trim() });
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
      toast.success('Chapter renamed');
    } catch { toast.error('Failed to rename'); setTitle(chapter.title); }
    setEditing(false);
  };

  const addLesson = async (type: 'VIDEO' | 'NOTE' | 'PDF') => {
    const defaultTitle = type === 'VIDEO' ? 'New Lesson' : type === 'PDF' ? 'New PDF' : 'New Note';
    try {
      await api.post(`/courses/${courseId}/chapters/${chapter.id}/lessons`, { title: defaultTitle, type, order: (chapter.lessons?.length ?? 0) + 1 });
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
    } catch { toast.error('Failed to add'); }
  };

  const videoLessons = (chapter.lessons ?? []).filter((l: any) => l.type === 'VIDEO');
  const noteLessons  = (chapter.lessons ?? []).filter((l: any) => l.type === 'NOTE' || l.type === 'PDF');
  const chapterExam  = (chapter.exams ?? [])[0] ?? null;

  const TABS: { key: ChapterTab; label: string; icon: any }[] = [
    { key: 'videos', label: 'Videos', icon: Video },
    { key: 'notes',  label: 'Notes',  icon: FileText },
    { key: 'exam',   label: 'Exam',   icon: ClipboardList },
  ];

  return (
    <div>
      {/* Chapter Header */}
      <div className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors">
        <GripVertical className="w-4 h-4 text-dark-muted flex-shrink-0 cursor-grab" />
        <span className="text-xs font-semibold text-dark-muted w-16 flex-shrink-0">CH {ci + 1}</span>

        {editing ? (
          <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
            onBlur={saveChapter}
            onKeyDown={e => { if (e.key === 'Enter') saveChapter(); if (e.key === 'Escape') { setTitle(chapter.title); setEditing(false); } }}
            className="flex-1 bg-transparent border-b border-brand-500 text-gray-900 dark:text-white font-medium text-sm outline-none py-0.5 px-1" />
        ) : (
          <span className="flex-1 font-medium text-gray-900 dark:text-white cursor-pointer" onClick={onToggle}>{chapter.title}</span>
        )}

        <span className="text-xs text-dark-muted flex-shrink-0">{videoLessons.length}v · {noteLessons.length}n {chapterExam ? '· exam' : ''}</span>
        <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-border transition-colors"><Pencil className="w-3.5 h-3.5 text-dark-muted" /></button>
        <button onClick={onToggle} className="p-1">{isOpen ? <ChevronDown className="w-4 h-4 text-dark-muted" /> : <ChevronRight className="w-4 h-4 text-dark-muted" />}</button>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 rounded hover:bg-red-500/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button>
      </div>

      {/* Expanded content */}
      {isOpen && (
        <div className="border-t border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-dark-border px-5">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={cn('flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors -mb-px',
                  tab === key ? 'border-brand-500 text-brand-400' : 'border-transparent text-dark-muted hover:text-gray-700 dark:hover:text-gray-300'
                )}>
                <Icon className="w-3.5 h-3.5" />{label}
              </button>
            ))}
          </div>

          {/* Videos Tab */}
          {tab === 'videos' && (
            <div>
              {videoLessons.length === 0 && <p className="text-xs text-dark-muted px-8 py-4">No video lessons yet.</p>}
              {videoLessons.map((lesson: any, li: number) => (
                <VideoLessonRow key={lesson.id} lesson={lesson} li={li} courseId={courseId} chapterId={chapter.id} qc={qc} />
              ))}
              <div className="px-8 py-3">
                <button onClick={() => addLesson('VIDEO')} className="text-sm text-brand-400 hover:text-brand-500 flex items-center gap-1.5 transition-colors">
                  <Plus className="w-4 h-4" /> Add Video Lesson
                </button>
              </div>
            </div>
          )}

          {/* Notes Tab */}
          {tab === 'notes' && (
            <div>
              {noteLessons.length === 0 && <p className="text-xs text-dark-muted px-8 py-4">No notes or PDFs yet.</p>}
              {noteLessons.map((note: any) => (
                note.type === 'PDF'
                  ? <PdfLessonRow key={note.id} lesson={note} courseId={courseId} chapterId={chapter.id} qc={qc} />
                  : <NoteRow key={note.id} note={note} courseId={courseId} chapterId={chapter.id} qc={qc} />
              ))}
              <div className="px-8 py-3 flex gap-4">
                <button onClick={() => addLesson('NOTE')} className="text-sm text-brand-400 hover:text-brand-500 flex items-center gap-1.5 transition-colors">
                  <Plus className="w-4 h-4" /> Add Text Note
                </button>
                <button onClick={() => addLesson('PDF')} className="text-sm text-brand-400 hover:text-brand-500 flex items-center gap-1.5 transition-colors">
                  <Plus className="w-4 h-4" /> Add PDF
                </button>
              </div>
            </div>
          )}

          {/* Exam Tab */}
          {tab === 'exam' && (
            <ExamTab chapterId={chapter.id} courseId={courseId} exam={chapterExam} qc={qc} />
          )}
        </div>
      )}
    </div>
  );
}

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
  } catch {}
  return null;
}

// ── Video Lesson Row ──────────────────────────────────────────────────────────
function VideoLessonRow({ lesson, li, courseId, chapterId, qc }: any) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [editingUrl, setEditingUrl] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState(lesson.videoUrl ?? '');

  useEffect(() => { setTitle(lesson.title); }, [lesson.title]);
  useEffect(() => { setYoutubeUrl(lesson.videoUrl ?? ''); }, [lesson.videoUrl]);

  const saveTitle = async () => {
    if (!title.trim() || title === lesson.title) { setEditingTitle(false); return; }
    try {
      await api.patch(`/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`, { title: title.trim() });
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
      toast.success('Renamed');
    } catch { toast.error('Failed'); setTitle(lesson.title); }
    setEditingTitle(false);
  };

  const saveUrl = async () => {
    const trimmed = youtubeUrl.trim();
    if (trimmed && !getYouTubeId(trimmed)) { toast.error('Invalid YouTube URL'); return; }
    try {
      await api.patch(`/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`, { videoUrl: trimmed || null });
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
      toast.success(trimmed ? 'YouTube link saved' : 'Link removed');
    } catch { toast.error('Failed to save'); }
    setEditingUrl(false);
  };

  const deleteLesson = async () => {
    if (!confirm(`Delete "${lesson.title}"?`)) return;
    try {
      await api.delete(`/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`);
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
    } catch { toast.error('Failed to delete'); }
  };

  const ytId = lesson.videoUrl ? getYouTubeId(lesson.videoUrl) : null;

  return (
    <div className="border-b border-gray-100 dark:border-dark-border last:border-0">
      <div className="flex items-center gap-3 px-8 py-3">
        <GripVertical className="w-3.5 h-3.5 text-dark-muted flex-shrink-0 cursor-grab" />
        <Video className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" />
        <span className="text-xs text-dark-muted w-5 flex-shrink-0">{li + 1}</span>

        <div className="flex-1 min-w-0">
          {editingTitle ? (
            <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
              onBlur={saveTitle} onKeyDown={e => { if (e.key === 'Enter') saveTitle(); if (e.key === 'Escape') { setTitle(lesson.title); setEditingTitle(false); } }}
              className="w-full bg-transparent border-b border-brand-500 text-sm text-gray-900 dark:text-white outline-none py-0.5" />
          ) : (
            <p className="text-sm text-gray-900 dark:text-white truncate">{lesson.title}</p>
          )}
          {ytId
            ? <p className="text-xs text-green-400 flex items-center gap-1 mt-0.5"><Video className="w-3 h-3" /> YouTube linked</p>
            : <p className="text-xs text-dark-muted mt-0.5">No video linked</p>}
        </div>

        <button onClick={() => setEditingTitle(true)} className="p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-border flex-shrink-0"><Pencil className="w-3 h-3 text-dark-muted" /></button>
        <button onClick={() => setEditingUrl(v => !v)} className={cn('p-1 rounded flex-shrink-0 flex items-center gap-1 text-xs transition-colors', editingUrl ? 'bg-brand-900/20 text-brand-400' : 'hover:bg-gray-200 dark:hover:bg-dark-border text-dark-muted')}>
          <Link2 className="w-3.5 h-3.5" /> {ytId ? 'Edit' : 'Add Link'}
        </button>
        <span className={cn('badge text-xs flex-shrink-0', lesson.isFree ? 'bg-green-500/20 text-green-400' : 'bg-dark-border text-dark-muted')}>{lesson.isFree ? 'Free' : 'Paid'}</span>
        <button onClick={deleteLesson} className="p-1 rounded hover:bg-red-500/10 flex-shrink-0"><Trash2 className="w-3 h-3 text-red-400" /></button>
      </div>

      {/* YouTube URL editor */}
      {editingUrl && (
        <div className="px-8 pb-3 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-dark-muted flex-shrink-0" />
          <input
            type="url"
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') saveUrl(); if (e.key === 'Escape') { setYoutubeUrl(lesson.videoUrl ?? ''); setEditingUrl(false); } }}
            placeholder="https://www.youtube.com/watch?v=..."
            className="input flex-1 text-sm py-2"
          />
          <button onClick={saveUrl} className="p-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white flex-shrink-0">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={() => { setYoutubeUrl(lesson.videoUrl ?? ''); setEditingUrl(false); }} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border text-dark-muted flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* YouTube thumbnail preview */}
      {ytId && !editingUrl && (
        <div className="px-8 pb-3">
          <img
            src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`}
            alt="YouTube thumbnail"
            className="h-16 rounded-lg object-cover"
          />
        </div>
      )}
    </div>
  );
}

// ── PDF Lesson Row ────────────────────────────────────────────────────────────
function PdfLessonRow({ lesson, courseId, chapterId, qc }: any) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [uploading, setUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(lesson.pdfUrl ?? '');

  const saveTitle = async () => {
    try {
      await api.patch(`/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`, { title });
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
    } catch { toast.error('Failed to save'); }
  };

  const uploadPdf = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/uploads/pdf', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const url = typeof data === 'string' ? data : data.url ?? data;
      await api.patch(`/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`, { pdfUrl: url });
      setPdfUrl(url);
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
      toast.success('PDF uploaded');
    } catch { toast.error('Upload failed'); }
    setUploading(false);
  };

  const deleteLesson = async () => {
    if (!confirm(`Delete "${lesson.title}"?`)) return;
    try {
      await api.delete(`/courses/${courseId}/chapters/${chapterId}/lessons/${lesson.id}`);
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="border-b border-gray-100 dark:border-dark-border last:border-0">
      <div className="flex items-center gap-3 px-8 py-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <BookOpen className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
        <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">{lesson.title}</span>
        {pdfUrl && <span className="text-[10px] text-green-400 font-medium">PDF linked</span>}
        {open ? <ChevronDown className="w-3.5 h-3.5 text-dark-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-dark-muted" />}
        <button onClick={e => { e.stopPropagation(); deleteLesson(); }} className="p-1 rounded hover:bg-red-500/10"><Trash2 className="w-3 h-3 text-red-400" /></button>
      </div>

      {open && (
        <div className="px-8 pb-4 space-y-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={e => e.key === 'Enter' && saveTitle()}
            placeholder="PDF title"
            className="input text-sm w-full"
          />

          {pdfUrl ? (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
              <BookOpen className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="flex-1 text-xs text-dark-muted truncate">{pdfUrl.split('/').pop()}</span>
              <a href={pdfUrl} target="_blank" rel="noreferrer" className="text-xs text-brand-400 hover:underline">Preview</a>
              <label className="text-xs text-dark-muted hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer">
                Replace
                <input type="file" accept="application/pdf" className="hidden" onChange={e => e.target.files?.[0] && uploadPdf(e.target.files[0])} />
              </label>
            </div>
          ) : (
            <label className={`flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-300 dark:border-dark-border cursor-pointer hover:border-brand-500 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploading ? <Loader2 className="w-6 h-6 text-brand-400 animate-spin" /> : <Upload className="w-6 h-6 text-dark-muted" />}
              <span className="text-sm text-dark-muted">{uploading ? 'Uploading…' : 'Click to upload PDF (max 50 MB)'}</span>
              <input type="file" accept="application/pdf" className="hidden" onChange={e => e.target.files?.[0] && uploadPdf(e.target.files[0])} disabled={uploading} />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

// ── Note Row ─────────────────────────────────────────────────────────────────
function NoteRow({ note, courseId, chapterId, qc }: any) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api.patch(`/courses/${courseId}/chapters/${chapterId}/lessons/${note.id}`, { title, content });
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
      toast.success('Note saved');
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const deleteNote = async () => {
    if (!confirm(`Delete note "${note.title}"?`)) return;
    try {
      await api.delete(`/courses/${courseId}/chapters/${chapterId}/lessons/${note.id}`);
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="border-b border-gray-100 dark:border-dark-border last:border-0">
      <div className="flex items-center gap-3 px-8 py-3 cursor-pointer" onClick={() => setOpen(o => !o)}>
        <FileText className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
        <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">{note.title}</span>
        {open ? <ChevronDown className="w-3.5 h-3.5 text-dark-muted" /> : <ChevronRight className="w-3.5 h-3.5 text-dark-muted" />}
        <button onClick={e => { e.stopPropagation(); deleteNote(); }} className="p-1 rounded hover:bg-red-500/10"><Trash2 className="w-3 h-3 text-red-400" /></button>
      </div>

      {open && (
        <div className="px-8 pb-4 space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title" className="input text-sm w-full" />
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={8} placeholder="Write notes here (supports markdown)…" className="input resize-y text-sm w-full font-mono" />
          <div className="flex justify-end">
            <button onClick={save} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save Note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Exam Tab ─────────────────────────────────────────────────────────────────
function ExamTab({ chapterId, courseId, exam: initialExam, qc }: any) {
  const [exam, setExam] = useState<any>(initialExam);
  const [creating, setCreating] = useState(false);
  const [examForm, setExamForm] = useState({ title: 'Chapter Exam', duration: 30, passMark: 40 });
  const [addingQ, setAddingQ] = useState<null | 'OBJECTIVE' | 'SUBJECTIVE'>(null);

  useEffect(() => { setExam(initialExam); }, [initialExam]);

  const createExam = async () => {
    setCreating(true);
    try {
      const { data } = await api.post(`/exams/chapter/${chapterId}`, examForm);
      setExam(data);
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
      toast.success('Exam created');
    } catch { toast.error('Failed to create exam'); }
    setCreating(false);
  };

  const deleteExam = async () => {
    if (!confirm('Delete this exam and all its questions?')) return;
    try {
      await api.delete(`/exams/${exam.id}`);
      setExam(null);
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
      toast.success('Exam deleted');
    } catch { toast.error('Failed'); }
  };

  const addQuestion = async (dto: any) => {
    try {
      const { data: q } = await api.post(`/exams/${exam.id}/questions`, dto);
      setExam((e: any) => ({ ...e, questions: [...(e.questions ?? []), q] }));
      qc.invalidateQueries({ queryKey: ['admin', 'course', courseId] });
      setAddingQ(null);
      toast.success('Question added');
    } catch { toast.error('Failed to add question'); }
  };

  const deleteQuestion = async (qId: string) => {
    try {
      await api.delete(`/exams/questions/${qId}`);
      setExam((e: any) => ({ ...e, questions: e.questions.filter((q: any) => q.id !== qId) }));
      toast.success('Question deleted');
    } catch { toast.error('Failed'); }
  };

  if (!exam) {
    return (
      <div className="p-6 space-y-4">
        <p className="text-sm text-dark-muted">No exam for this chapter yet. Create one:</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-dark-muted mb-1">Title</label>
            <input value={examForm.title} onChange={e => setExamForm(f => ({ ...f, title: e.target.value }))} className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs text-dark-muted mb-1">Duration (min)</label>
            <input type="number" min={5} value={examForm.duration} onChange={e => setExamForm(f => ({ ...f, duration: +e.target.value }))} className="input text-sm" />
          </div>
          <div>
            <label className="block text-xs text-dark-muted mb-1">Pass Mark (%)</label>
            <input type="number" min={1} max={100} value={examForm.passMark} onChange={e => setExamForm(f => ({ ...f, passMark: +e.target.value }))} className="input text-sm" />
          </div>
        </div>
        <button onClick={createExam} disabled={creating} className="btn-primary text-sm flex items-center gap-2">
          {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Create Exam
        </button>
      </div>
    );
  }

  const objectives  = (exam.questions ?? []).filter((q: any) => q.questionType === 'OBJECTIVE');
  const subjectives = (exam.questions ?? []).filter((q: any) => q.questionType === 'SUBJECTIVE');

  return (
    <div className="p-5 space-y-5">
      {/* Exam header */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-dark-surface border border-gray-200 dark:border-dark-border">
        <ClipboardList className="w-5 h-5 text-brand-400 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-gray-900 dark:text-white text-sm">{exam.title}</p>
          <p className="text-xs text-dark-muted mt-0.5">{exam.duration} min · Pass: {exam.passMark}% · {exam.questions?.length ?? 0} questions</p>
        </div>
        <button onClick={deleteExam} className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 className="w-4 h-4 text-red-400" /></button>
      </div>

      {/* Objective Questions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-dark-muted uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" /> Objective (MCQ) — {objectives.length}
          </h4>
          <button onClick={() => setAddingQ('OBJECTIVE')} className="text-xs text-brand-400 hover:text-brand-500 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add MCQ
          </button>
        </div>

        {objectives.map((q: any, i: number) => (
          <QuestionCard key={q.id} q={q} index={i} onDelete={() => deleteQuestion(q.id)} examId={exam.id} onUpdate={(updated: any) => setExam((e: any) => ({ ...e, questions: e.questions.map((x: any) => x.id === updated.id ? updated : x) }))} />
        ))}

        {addingQ === 'OBJECTIVE' && (
          <AddQuestionForm type="OBJECTIVE" onSave={addQuestion} onCancel={() => setAddingQ(null)} nextOrder={(exam.questions?.length ?? 0) + 1} />
        )}
      </div>

      {/* Subjective Questions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-dark-muted uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Subjective — {subjectives.length}
          </h4>
          <button onClick={() => setAddingQ('SUBJECTIVE')} className="text-xs text-brand-400 hover:text-brand-500 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add Subjective
          </button>
        </div>

        {subjectives.map((q: any, i: number) => (
          <QuestionCard key={q.id} q={q} index={i} onDelete={() => deleteQuestion(q.id)} examId={exam.id} onUpdate={(updated: any) => setExam((e: any) => ({ ...e, questions: e.questions.map((x: any) => x.id === updated.id ? updated : x) }))} />
        ))}

        {addingQ === 'SUBJECTIVE' && (
          <AddQuestionForm type="SUBJECTIVE" onSave={addQuestion} onCancel={() => setAddingQ(null)} nextOrder={(exam.questions?.length ?? 0) + 1} />
        )}
      </div>
    </div>
  );
}

// ── Question Card (view + inline edit) ───────────────────────────────────────
function QuestionCard({ q, index, onDelete, examId, onUpdate }: any) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ text: q.text, options: q.options ?? ['', '', '', ''], correctAnswer: q.correctAnswer ?? 0, modelAnswer: q.modelAnswer ?? '', marks: q.marks, explanation: q.explanation ?? '' });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const payload = q.questionType === 'OBJECTIVE'
        ? { text: form.text, options: form.options, correctAnswer: form.correctAnswer, marks: form.marks, explanation: form.explanation }
        : { text: form.text, modelAnswer: form.modelAnswer, marks: form.marks };
      const { data } = await api.patch(`/exams/questions/${q.id}`, payload);
      onUpdate(data);
      toast.success('Saved');
      setEditing(false);
    } catch { toast.error('Failed'); }
    setSaving(false);
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-surface p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-dark-muted flex-shrink-0 mt-0.5">Q{index + 1}</span>
        <div className="flex-1 min-w-0">
          {editing ? (
            <textarea value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} rows={2} className="input text-sm w-full resize-none" />
          ) : (
            <p className="text-sm text-gray-900 dark:text-white">{q.text}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={cn('badge text-[10px]', q.questionType === 'OBJECTIVE' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400')}>
            {q.questionType === 'OBJECTIVE' ? 'MCQ' : 'Subj.'}
          </span>
          <span className="badge text-[10px] bg-dark-border text-dark-muted">{q.marks}m</span>
          {editing
            ? <button onClick={save} disabled={saving} className="p-1 rounded hover:bg-green-500/10"><Save className="w-3.5 h-3.5 text-green-400" /></button>
            : <button onClick={() => setEditing(true)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-border"><Pencil className="w-3.5 h-3.5 text-dark-muted" /></button>}
          <button onClick={onDelete} className="p-1 rounded hover:bg-red-500/10"><X className="w-3.5 h-3.5 text-red-400" /></button>
        </div>
      </div>

      {/* MCQ options */}
      {q.questionType === 'OBJECTIVE' && (
        <div className="grid grid-cols-2 gap-2 ml-6">
          {(editing ? form.options : q.options ?? []).map((opt: string, oi: number) => (
            <div key={oi} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border',
              (editing ? form.correctAnswer : q.correctAnswer) === oi
                ? 'bg-green-500/10 border-green-500/40 text-green-400'
                : 'border-gray-200 dark:border-dark-border text-gray-700 dark:text-gray-300'
            )}>
              <span className="font-bold flex-shrink-0">{optionLabels[oi]}.</span>
              {editing ? (
                <input value={opt} onChange={e => setForm(f => { const o = [...f.options]; o[oi] = e.target.value; return { ...f, options: o }; })}
                  className="bg-transparent flex-1 outline-none min-w-0" />
              ) : <span className="flex-1">{opt}</span>}
              {editing && (
                <button onClick={() => setForm(f => ({ ...f, correctAnswer: oi }))} className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0', form.correctAnswer === oi ? 'border-green-400 bg-green-400' : 'border-gray-400')} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Subjective model answer */}
      {q.questionType === 'SUBJECTIVE' && editing && (
        <div className="ml-6">
          <label className="block text-xs text-dark-muted mb-1">Model Answer</label>
          <textarea value={form.modelAnswer} onChange={e => setForm(f => ({ ...f, modelAnswer: e.target.value }))} rows={3} className="input text-sm w-full resize-none" />
        </div>
      )}
      {q.questionType === 'SUBJECTIVE' && !editing && q.modelAnswer && (
        <p className="ml-6 text-xs text-dark-muted italic">Answer: {q.modelAnswer}</p>
      )}

      {/* Marks (editing) */}
      {editing && (
        <div className="ml-6 flex items-center gap-2">
          <label className="text-xs text-dark-muted">Marks:</label>
          <input type="number" min={1} value={form.marks} onChange={e => setForm(f => ({ ...f, marks: +e.target.value }))} className="input text-xs w-20" />
          {q.questionType === 'OBJECTIVE' && <>
            <label className="text-xs text-dark-muted ml-3">Explanation:</label>
            <input value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} placeholder="optional" className="input text-xs flex-1" />
          </>}
        </div>
      )}
    </div>
  );
}

// ── Add Question Form ─────────────────────────────────────────────────────────
function AddQuestionForm({ type, onSave, onCancel, nextOrder }: any) {
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [modelAnswer, setModelAnswer] = useState('');
  const [marks, setMarks] = useState(1);
  const [explanation, setExplanation] = useState('');
  const [saving, setSaving] = useState(false);
  const optionLabels = ['A', 'B', 'C', 'D'];

  const save = async () => {
    if (!text.trim()) return toast.error('Question text required');
    if (type === 'OBJECTIVE' && options.some(o => !o.trim())) return toast.error('Fill all 4 options');
    setSaving(true);
    const dto = type === 'OBJECTIVE'
      ? { questionType: 'OBJECTIVE', text, options, correctAnswer, marks, explanation, order: nextOrder }
      : { questionType: 'SUBJECTIVE', text, modelAnswer, marks, order: nextOrder };
    await onSave(dto);
    setSaving(false);
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-brand-500/40 bg-brand-900/5 p-4 space-y-3">
      <p className="text-xs font-bold text-brand-400 uppercase">{type === 'OBJECTIVE' ? '+ MCQ Question' : '+ Subjective Question'}</p>

      <textarea value={text} onChange={e => setText(e.target.value)} rows={2} placeholder="Question text…" className="input text-sm w-full resize-none" />

      {type === 'OBJECTIVE' && (
        <div className="grid grid-cols-2 gap-2">
          {options.map((opt, oi) => (
            <div key={oi} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs',
              correctAnswer === oi ? 'border-green-500/40 bg-green-500/10' : 'border-gray-200 dark:border-dark-border'
            )}>
              <span className="font-bold text-dark-muted">{optionLabels[oi]}.</span>
              <input value={opt} onChange={e => { const o = [...options]; o[oi] = e.target.value; setOptions(o); }}
                placeholder={`Option ${optionLabels[oi]}`} className="bg-transparent flex-1 outline-none min-w-0 text-gray-900 dark:text-white" />
              <button onClick={() => setCorrectAnswer(oi)} className={cn('w-4 h-4 rounded-full border-2 flex-shrink-0', correctAnswer === oi ? 'border-green-400 bg-green-400' : 'border-gray-400')} />
            </div>
          ))}
        </div>
      )}

      {type === 'SUBJECTIVE' && (
        <textarea value={modelAnswer} onChange={e => setModelAnswer(e.target.value)} rows={3} placeholder="Model answer (optional)…" className="input text-sm w-full resize-none" />
      )}

      <div className="flex items-center gap-3">
        <label className="text-xs text-dark-muted">Marks:</label>
        <input type="number" min={1} value={marks} onChange={e => setMarks(+e.target.value)} className="input text-xs w-20" />
        {type === 'OBJECTIVE' && <>
          <label className="text-xs text-dark-muted">Explanation:</label>
          <input value={explanation} onChange={e => setExplanation(e.target.value)} placeholder="optional" className="input text-xs flex-1" />
        </>}
        <div className="ml-auto flex gap-2">
          <button onClick={onCancel} className="btn-secondary text-xs px-3 py-1.5">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Add
          </button>
        </div>
      </div>
    </div>
  );
}
