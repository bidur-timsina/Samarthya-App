'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { ClipboardList, Search, Clock, CheckCircle, XCircle, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const STATUS_FILTERS = ['All', 'Open', 'Attempted', 'Completed'];
const TYPE_TABS = ['Exams', 'Practice'];

export default function ExamsPage() {
  const [typeTab, setTypeTab] = useState('Exams');
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');

  const { data: exams, isLoading } = useQuery({
    queryKey: ['exams', { type: typeTab === 'Practice' ? 'PRACTICE' : 'FORMAL' }],
    queryFn: () => api.get('/exams', { params: { type: typeTab === 'Practice' ? 'PRACTICE' : 'FORMAL' } }).then(r => r.data),
  });

  const filtered = (exams ?? []).filter((e: any) => {
    if (search && !e.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (status === 'Attempted' && !e.myAttempt) return false;
    if (status === 'Completed' && !e.myAttempt?.passed) return false;
    if (status === 'Open' && e.myAttempt) return false;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Type tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-surface rounded-xl w-fit">
        {TYPE_TABS.map(t => (
          <button key={t} onClick={() => setTypeTab(t)} className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all', typeTab === t ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm' : 'text-dark-muted hover:text-gray-900 dark:hover:text-white')}>
            {t}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <input type="text" placeholder="Search exams..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-11" />
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(s => {
          const count = s === 'All' ? (exams ?? []).length :
                        s === 'Attempted' ? (exams ?? []).filter((e: any) => e.myAttempt).length :
                        s === 'Completed' ? (exams ?? []).filter((e: any) => e.myAttempt?.passed).length :
                        (exams ?? []).filter((e: any) => !e.myAttempt).length;
          return (
            <button key={s} onClick={() => setStatus(s)} className={cn('badge px-3 py-1.5 cursor-pointer gap-2 transition-all', status === s ? 'bg-brand-900 text-white' : 'bg-gray-100 dark:bg-dark-surface text-dark-muted hover:bg-gray-200 dark:hover:bg-dark-card')}>
              {s}
              <span className={cn('w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold', status === s ? 'bg-white/20' : 'bg-dark-border')}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Exam list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <ClipboardList className="w-16 h-16 mx-auto mb-4 text-dark-muted opacity-30" />
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No exams available</p>
          <p className="text-dark-muted text-sm">Check back soon or explore courses to unlock exams</p>
          <Link href="/explore" className="btn-primary mt-4 inline-block">Explore Courses</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exam: any) => <ExamCard key={exam.id} exam={exam} />)}
        </div>
      )}
    </div>
  );
}

function ExamCard({ exam }: { exam: any }) {
  const attempted = !!exam.myAttempt;
  const passed = exam.myAttempt?.passed;

  return (
    <div className="card p-5 flex items-center gap-5">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
        passed ? 'bg-green-500/10' : attempted ? 'bg-red-500/10' : 'bg-brand-900/10')}>
        {passed ? <CheckCircle className="w-6 h-6 text-green-400" /> :
         attempted ? <XCircle className="w-6 h-6 text-red-400" /> :
         <ClipboardList className="w-6 h-6 text-brand-500" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 dark:text-white">{exam.title}</p>
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-dark-muted">
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{exam.duration} min</span>
          <span>{exam.questionCount} questions</span>
          {exam.course && <span>📚 {exam.course.title}</span>}
          {attempted && <span className="text-amber-400 font-medium">Score: {exam.myAttempt?.score}/{exam.myAttempt?.total}</span>}
        </div>
      </div>

      <div className="flex-shrink-0">
        {attempted ? (
          <Link href={`/exams/${exam.id}/results`} className="btn-secondary text-sm px-4 py-2">
            View Results
          </Link>
        ) : (
          <Link href={`/exams/${exam.id}/start`} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
            <PlayCircle className="w-4 h-4" /> Start
          </Link>
        )}
      </div>
    </div>
  );
}
