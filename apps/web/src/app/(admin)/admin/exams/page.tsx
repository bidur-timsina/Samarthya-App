'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { ClipboardList, Plus, Pencil, Trash2, Search } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminExamsPage() {
  const [search, setSearch] = useState('');
  const [typeTab, setTypeTab] = useState<'ALL' | 'FORMAL' | 'PRACTICE'>('ALL');
  const qc = useQueryClient();

  const { data: exams, isLoading } = useQuery({
    queryKey: ['admin', 'exams', { search, typeTab }],
    queryFn: () => api.get('/exams', { params: { search, type: typeTab === 'ALL' ? undefined : typeTab, limit: 50 } }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/exams/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'exams'] }); toast.success('Exam deleted'); },
  });

  const list = (Array.isArray(exams) ? exams : exams?.data ?? []).filter((e: any) =>
    !search || e.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exams</h1>
          <p className="text-dark-muted text-sm">{list.length} exams total</p>
        </div>
        <Link href="/admin/exams/new" className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Exam
        </Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
          <input type="text" placeholder="Search exams..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-11" />
        </div>
        <div className="flex bg-gray-100 dark:bg-dark-surface rounded-xl p-1 border border-gray-200 dark:border-dark-border gap-1">
          {(['ALL', 'FORMAL', 'PRACTICE'] as const).map(t => (
            <button key={t} onClick={() => setTypeTab(t)}
              className={cn('px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                typeTab === t ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm' : 'text-dark-muted hover:text-gray-900 dark:hover:text-white')}>
              {t.charAt(0) + t.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-dark-muted">Loading...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-border">
                {['Title', 'Type', 'Duration', 'Questions', 'Pass %', 'Created', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <ClipboardList className="w-12 h-12 mx-auto mb-3 text-dark-muted opacity-30" />
                    <p className="text-dark-muted mb-4">No exams found</p>
                    <Link href="/admin/exams/new" className="btn-primary inline-flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Create First Exam
                    </Link>
                  </td>
                </tr>
              ) : list.map((exam: any) => (
                <tr key={exam.id} className="hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{exam.title}</p>
                    {exam.courseId && <p className="text-xs text-dark-muted">Linked to course</p>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn('badge', exam.type === 'FORMAL' ? 'bg-brand-900/20 text-brand-400' : 'bg-amber-500/20 text-amber-400')}>
                      {exam.type === 'FORMAL' ? 'Exam' : 'Practice'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-dark-muted">{exam.duration} min</td>
                  <td className="px-5 py-3 text-sm text-dark-muted">{exam.questionCount ?? exam._count?.questions ?? 0}</td>
                  <td className="px-5 py-3 text-sm text-dark-muted">{exam.passPercent ?? 60}%</td>
                  <td className="px-5 py-3 text-sm text-dark-muted">{formatRelativeTime(exam.createdAt)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/admin/exams/${exam.id}/edit`} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
                        <Pencil className="w-4 h-4 text-brand-400" />
                      </Link>
                      <button
                        onClick={() => { if (confirm('Delete exam?')) deleteMutation.mutate(exam.id); }}
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
    </div>
  );
}
