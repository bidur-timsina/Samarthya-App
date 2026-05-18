'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { BookOpen, Plus, Search, Eye, EyeOff, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminCoursesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'courses', { search, page }],
    queryFn: () => api.get('/courses', { params: { search, page, limit: 15, all: true } }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, published }: { id: string; published: boolean }) =>
      api.patch(`/courses/${id}`, { isPublished: published }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'courses'] }); toast.success('Course updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/courses/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'courses'] }); toast.success('Course deleted'); },
  });

  const courses = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Courses</h1>
          <p className="text-dark-muted text-sm">{meta?.total ?? 0} courses total</p>
        </div>
        <Link href="/admin/courses/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Course
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="input pl-11"
        />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-dark-muted">Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-border">
                {['Course', 'Category', 'Price', 'Students', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {courses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 text-dark-muted opacity-30" />
                    <p className="text-dark-muted">No courses found</p>
                    <Link href="/admin/courses/new" className="btn-primary inline-flex items-center gap-2 mt-4">
                      <Plus className="w-4 h-4" /> Create First Course
                    </Link>
                  </td>
                </tr>
              ) : courses.map((c: any) => (
                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-900/20 overflow-hidden flex-shrink-0">
                        {c.thumbnail
                          ? <Image src={c.thumbnail} alt={c.title} width={40} height={40} className="object-cover w-full h-full" />
                          : <BookOpen className="w-5 h-5 text-brand-500 m-auto mt-2.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{c.title}</p>
                        <p className="text-xs text-dark-muted">{c.level}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-dark-muted">{c.category?.name ?? '—'}</td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {Number(c.price) === 0 ? <span className="text-green-400">Free</span> : formatPrice(Number(c.price))}
                  </td>
                  <td className="px-5 py-3 text-sm text-dark-muted">{c.studentCount ?? c._count?.enrollments ?? 0}</td>
                  <td className="px-5 py-3">
                    <span className={cn('badge', c.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400')}>
                      {c.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-dark-muted">{formatRelativeTime(c.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => publishMutation.mutate({ id: c.id, published: !c.isPublished })}
                        title={c.isPublished ? 'Unpublish' : 'Publish'}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                      >
                        {c.isPublished
                          ? <EyeOff className="w-4 h-4 text-dark-muted" />
                          : <Eye className="w-4 h-4 text-green-400" />}
                      </button>
                      <Link
                        href={`/admin/courses/${c.id}/edit`}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-brand-400" />
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm('Delete this course? This cannot be undone.')) {
                            deleteMutation.mutate(c.id);
                          }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Prev</button>
          <span className="text-sm text-dark-muted">Page {page} of {meta.totalPages}</span>
          <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}
