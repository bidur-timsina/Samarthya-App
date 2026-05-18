'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Search, Filter, Star, Users, Clock, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, formatPrice, formatDuration } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

const LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'price', label: 'Price: Low to High' },
  { value: 'enrollments', label: 'Most Popular' },
];

export default function ExplorePage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');
  const [sort, setSort] = useState('createdAt');
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/courses/categories').then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['courses', 'explore', { search, category, level, sort, page }],
    queryFn: () => api.get('/courses', { params: { search, category, level, sort, page, limit: 12 } }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const courses = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-muted" />
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="input pl-12 py-3 text-base"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setCategory(''); setPage(1); }} className={cn('badge px-3 py-1.5 cursor-pointer transition-all', !category ? 'bg-brand-900 text-white' : 'bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-dark-muted hover:bg-gray-200 dark:hover:bg-dark-card')}>
            All
          </button>
          {(categories ?? []).map((cat: any) => (
            <button key={cat.id} onClick={() => { setCategory(cat.slug); setPage(1); }} className={cn('badge px-3 py-1.5 cursor-pointer transition-all', category === cat.slug ? 'bg-brand-900 text-white' : 'bg-gray-100 dark:bg-dark-surface text-gray-600 dark:text-dark-muted hover:bg-gray-200 dark:hover:bg-dark-card')}>
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          {/* Level */}
          <select value={level} onChange={e => { setLevel(e.target.value); setPage(1); }} className="input py-1.5 w-auto">
            <option value="">All Levels</option>
            {LEVELS.map(l => <option key={l} value={l}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>)}
          </select>

          {/* Sort */}
          <select value={sort} onChange={e => setSort(e.target.value)} className="input py-1.5 w-auto">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4 animate-pulse space-y-3">
              <div className="h-40 bg-dark-border rounded-xl" />
              <div className="h-4 bg-dark-border rounded w-3/4" />
              <div className="h-3 bg-dark-border rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-dark-muted opacity-30" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No courses found</p>
          <p className="text-dark-muted">Try adjusting your filters or search query</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-dark-muted">{meta?.total ?? 0} courses found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course: any) => <CourseCard key={course.id} course={course} />)}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary px-3 py-2 disabled:opacity-40">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-dark-muted">Page {page} of {meta.totalPages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page === meta.totalPages} className="btn-secondary px-3 py-2 disabled:opacity-40">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CourseCard({ course }: { course: any }) {
  const price = Number(course.price);
  return (
    <Link href={`/courses/${course.slug}`} className="card overflow-hidden hover:border-brand-900/50 hover:-translate-y-1 transition-all duration-200 group flex flex-col">
      {/* Thumbnail */}
      <div className="h-44 bg-gradient-to-br from-brand-900/30 to-brand-700/20 relative overflow-hidden flex-shrink-0">
        {course.thumbnail ? (
          <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="w-12 h-12 text-brand-500/50" />
          </div>
        )}
        {/* Price badge */}
        <div className="absolute top-3 right-3">
          {price === 0 ? (
            <span className="badge bg-green-500 text-white font-semibold px-3 py-1">Free</span>
          ) : (
            <span className="badge bg-dark-bg/90 text-white font-semibold px-3 py-1">{formatPrice(price)}</span>
          )}
        </div>
        <div className="absolute bottom-3 left-3">
          <span className={cn('badge', { 'bg-green-500/20 text-green-400': course.level === 'BEGINNER', 'bg-blue-500/20 text-blue-400': course.level === 'INTERMEDIATE', 'bg-purple-500/20 text-purple-400': course.level === 'ADVANCED' })}>
            {course.level?.charAt(0) + course.level?.slice(1).toLowerCase()}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <span className="text-xs text-brand-500 font-medium mb-1">{course.category?.name}</span>
        <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug mb-2 line-clamp-2 group-hover:text-brand-500 transition-colors">{course.title}</h3>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-dark-muted mt-auto pt-3 border-t border-gray-100 dark:border-dark-border">
          <span className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            {course.avgRating > 0 ? course.avgRating.toFixed(1) : 'New'}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {course.studentCount > 0 ? course.studentCount : 'Be first!'}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {course.totalLessons} lessons
          </span>
        </div>
      </div>
    </Link>
  );
}
