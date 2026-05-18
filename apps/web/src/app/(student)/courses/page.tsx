'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BookOpen, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function CoursesPage() {
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => api.get('/enrollments/my').then(r => r.data),
  });

  const courses = enrollments ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
        <span className="badge bg-brand-900/20 text-brand-400">{courses.length} enrolled</span>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}</div>
      ) : courses.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-dark-muted opacity-30" />
          <p className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No courses yet</p>
          <p className="text-dark-muted mb-6">Enroll in a course to start your learning journey</p>
          <Link href="/explore" className="btn-primary inline-flex items-center gap-2">
            Explore Courses <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((enrollment: any) => {
            const course = enrollment.course;
            const total = course.chapters?.flatMap((c: any) => c.lessons).length ?? 0;
            return (
              <Link key={enrollment.id} href={`/courses/${course.slug}`} className="card p-5 flex items-center gap-5 hover:border-brand-900/40 transition-all group">
                <div className="w-16 h-16 rounded-xl bg-brand-900/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {course.thumbnail ? (
                    <Image src={course.thumbnail} alt={course.title} width={64} height={64} className="object-cover w-full h-full rounded-xl" />
                  ) : (
                    <BookOpen className="w-7 h-7 text-brand-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white group-hover:text-brand-500 transition-colors truncate">{course.title}</p>
                  <p className="text-sm text-dark-muted">{course.category?.name} · {total} lessons</p>
                  <div className="mt-2.5 h-1.5 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden max-w-xs">
                    <div className="h-full bg-brand-700 rounded-full w-1/4 transition-all" />
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-dark-muted group-hover:text-brand-500 flex-shrink-0 transition-colors" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
