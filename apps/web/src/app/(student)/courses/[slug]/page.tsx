'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ChevronDown, ChevronRight, Play, FileText, ClipboardList, Lock, ArrowLeft, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/utils';

type Lesson = {
  id: string; title: string; type: string;
  duration?: number; isFree: boolean; order: number;
  videoUrl?: string; content?: string;
};
type Chapter = { id: string; title: string; order: number; lessons: Lesson[] };

function LessonIcon({ type }: { type: string }) {
  if (type === 'VIDEO') return <Play className="w-3.5 h-3.5" />;
  if (type === 'NOTE') return <FileText className="w-3.5 h-3.5" />;
  if (type === 'QUIZ') return <ClipboardList className="w-3.5 h-3.5" />;
  return <BookOpen className="w-3.5 h-3.5" />;
}

function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
  } catch {}
  return null;
}

function VideoPlayer({ url }: { url: string }) {
  const ytId = getYouTubeId(url);
  if (!ytId) return (
    <div className="w-full aspect-video bg-dark-border rounded-2xl flex items-center justify-center">
      <p className="text-dark-muted text-sm">Invalid video link</p>
    </div>
  );
  return (
    <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden">
      <iframe
        src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
        title="Lesson video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}

function NoteViewer({ content }: { content: string }) {
  return (
    <div className="card p-6 prose prose-invert max-w-none">
      <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-sm">{content}</div>
    </div>
  );
}

export default function CourseViewerPage() {
  const { slug } = useParams<{ slug: string }>();
  const [mounted, setMounted] = useState(false);
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const { data: course, isLoading } = useQuery({
    queryKey: ['course', slug],
    queryFn: () => api.get(`/courses/${slug}`).then(r => r.data),
    enabled: !!slug,
  });

  const toggleChapter = (id: string) => {
    setOpenChapters(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectLesson = (lesson: Lesson) => {
    if (!course?.isEnrolled && !lesson.isFree) return;
    setActiveLesson(lesson);
  };

  if (!mounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <BookOpen className="w-12 h-12 text-dark-muted opacity-30" />
        <p className="text-dark-muted">Course not found</p>
        <Link href="/courses" className="btn-secondary text-sm">Back to My Courses</Link>
      </div>
    );
  }

  const chapters: Chapter[] = course.chapters ?? [];
  const totalLessons = chapters.reduce((a: number, c: Chapter) => a + c.lessons.length, 0);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/courses" className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
          <ArrowLeft className="w-5 h-5 text-dark-muted" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{course.title}</h1>
          <p className="text-xs text-dark-muted">{course.category?.name} · {totalLessons} lessons</p>
        </div>
        {!course.isEnrolled && (
          <span className="badge bg-amber-500/20 text-amber-400 text-xs">Preview mode — enroll to unlock all</span>
        )}
      </div>

      <div className="flex gap-6 h-[calc(100vh-200px)]">
        {/* Sidebar — chapters & lessons */}
        <div className="w-72 flex-shrink-0 overflow-y-auto space-y-1.5">
          {chapters.map((chapter, ci) => {
            const open = openChapters.has(chapter.id);
            return (
              <div key={chapter.id} className="card overflow-hidden">
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-dark-surface/60 transition-colors"
                >
                  <span className="w-6 h-6 rounded-lg bg-brand-900/20 text-brand-400 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {ci + 1}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">{chapter.title}</span>
                  {open ? <ChevronDown className="w-4 h-4 text-dark-muted flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-dark-muted flex-shrink-0" />}
                </button>

                {open && (
                  <div className="border-t border-gray-100 dark:border-dark-border divide-y divide-gray-100 dark:divide-dark-border/50">
                    {chapter.lessons.map(lesson => {
                      const locked = !course.isEnrolled && !lesson.isFree;
                      const active = activeLesson?.id === lesson.id;
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => selectLesson(lesson)}
                          disabled={locked}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                            active ? 'bg-brand-900/20' : 'hover:bg-gray-50 dark:hover:bg-dark-surface/40',
                            locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                          )}
                        >
                          <span className={cn('flex-shrink-0', active ? 'text-brand-400' : 'text-dark-muted')}>
                            {locked ? <Lock className="w-3.5 h-3.5" /> : <LessonIcon type={lesson.type} />}
                          </span>
                          <span className={cn('flex-1 text-xs truncate', active ? 'text-brand-400 font-medium' : 'text-gray-700 dark:text-gray-300')}>
                            {lesson.title}
                          </span>
                          {lesson.duration && (
                            <span className="text-[10px] text-dark-muted flex-shrink-0">{formatDuration(lesson.duration)}</span>
                          )}
                          {lesson.isFree && !course.isEnrolled && (
                            <span className="text-[10px] text-green-400 font-medium flex-shrink-0">Free</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {!activeLesson ? (
            /* Course overview */
            <div className="space-y-4">
              {course.thumbnail && (
                <div className="w-full aspect-video rounded-2xl overflow-hidden bg-dark-border">
                  <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="card p-6 space-y-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{course.title}</h2>
                {course.description && <p className="text-sm text-dark-muted leading-relaxed">{course.description}</p>}
                <div className="flex items-center gap-4 text-sm text-dark-muted pt-2 border-t border-gray-100 dark:border-dark-border">
                  <span>{totalLessons} lessons</span>
                  <span>·</span>
                  <span>{chapters.length} chapters</span>
                  {course.studentCount !== undefined && <><span>·</span><span>{course.studentCount} students</span></>}
                </div>
                <p className="text-xs text-dark-muted">Select a lesson from the sidebar to start learning.</p>
              </div>
            </div>
          ) : activeLesson.type === 'VIDEO' && activeLesson.videoUrl ? (
            <div className="space-y-4">
              <VideoPlayer url={activeLesson.videoUrl} />
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white">{activeLesson.title}</h2>
                {activeLesson.duration && <p className="text-xs text-dark-muted mt-1">{formatDuration(activeLesson.duration)}</p>}
              </div>
            </div>
          ) : activeLesson.type === 'NOTE' && activeLesson.content ? (
            <div className="space-y-4">
              <div className="card p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-400" /> {activeLesson.title}
                </h2>
              </div>
              <NoteViewer content={activeLesson.content} />
            </div>
          ) : (
            <div className="card p-10 text-center">
              <LessonIcon type={activeLesson.type} />
              <p className="text-gray-900 dark:text-white font-semibold mt-3">{activeLesson.title}</p>
              <p className="text-sm text-dark-muted mt-1">Content not available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
