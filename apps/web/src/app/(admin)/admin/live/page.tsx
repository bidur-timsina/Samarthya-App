'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Video, Plus, Trash2, ExternalLink, Calendar, Link2, ChevronDown } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const EMPTY_FORM = { title: '', description: '', courseId: '', externalLink: '', scheduledAt: '', maxAttendees: 100 };

export default function AdminLivePage() {
  const qc = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['admin', 'live-sessions'],
    queryFn: () => api.get('/live-sessions').then(r => r.data),
    refetchInterval: 10000,
  });

  const { data: coursesData } = useQuery({
    queryKey: ['admin', 'courses', 'all'],
    queryFn: () => api.get('/courses', { params: { all: true, limit: 200 } }).then(r => r.data),
  });
  const courses = coursesData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/live-sessions', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'live-sessions'] });
      toast.success('Live class scheduled');
      setShowNew(false);
      setForm(EMPTY_FORM);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create session'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/live-sessions/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'live-sessions'] }); toast.success('Deleted'); },
  });

  const startMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/live-sessions/${id}/start`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'live-sessions'] }),
  });

  const endMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/live-sessions/${id}/end`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'live-sessions'] }),
  });

  const list = Array.isArray(sessions) ? sessions : sessions?.data ?? [];

  const statusColor = (s: string) => {
    if (s === 'LIVE') return 'bg-red-500/20 text-red-400';
    if (s === 'ENDED') return 'bg-gray-500/20 text-dark-muted';
    return 'bg-amber-500/20 text-amber-400';
  };

  const handleCreate = () => {
    const payload: any = {
      title: form.title,
      description: form.description || undefined,
      maxAttendees: form.maxAttendees,
      scheduledAt: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      externalLink: form.externalLink || undefined,
      courseId: form.courseId || undefined,
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Live Classes</h1>
          <p className="text-dark-muted text-sm">{list.length} sessions total</p>
        </div>
        <button onClick={() => setShowNew(v => !v)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Session
        </button>
      </div>

      {/* New session form */}
      {showNew && (
        <div className="card p-6 space-y-4 border-brand-900/40">
          <h2 className="font-semibold text-gray-900 dark:text-white">Schedule Live Class</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Title *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="input" placeholder="e.g. Loksewa Mock Test Discussion" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="input resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Course picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Link to Course (optional)</label>
              <div className="relative">
                <select
                  value={form.courseId}
                  onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                  className="input appearance-none pr-10 w-full"
                >
                  <option value="">— No specific course —</option>
                  {courses.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted pointer-events-none" />
              </div>
            </div>

            {/* External class link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <span className="flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5" /> External Class Link</span>
              </label>
              <input
                type="text"
                value={form.externalLink}
                onChange={e => setForm(f => ({ ...f, externalLink: e.target.value }))}
                className="input"
                placeholder="https://meet.google.com/... or Zoom link"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Scheduled Time</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} className="input" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Max Attendees</label>
              <input type="number" min={1} value={form.maxAttendees} onChange={e => setForm(f => ({ ...f, maxAttendees: Number(e.target.value) }))} className="input" />
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <button onClick={() => setShowNew(false)} className="btn-secondary px-5">Cancel</button>
            <button onClick={handleCreate} disabled={createMutation.isPending || !form.title} className="btn-primary px-5">
              {createMutation.isPending ? 'Scheduling…' : 'Schedule'}
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-dark-muted">Loading...</div>
        ) : list.length === 0 ? (
          <div className="p-14 text-center">
            <Video className="w-12 h-12 mx-auto mb-3 text-dark-muted opacity-30" />
            <p className="text-dark-muted mb-4">No live sessions yet</p>
            <button onClick={() => setShowNew(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Schedule First Session
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-dark-border">
                {['Session', 'Course', 'Status', 'Scheduled', 'Actions'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
              {list.map((session: any) => (
                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{session.title}</p>
                    {session.externalLink && (
                      <a href={session.externalLink} target="_blank" rel="noreferrer" className="text-xs text-brand-400 hover:underline flex items-center gap-1 mt-0.5">
                        <Link2 className="w-3 h-3" /> Join Link
                      </a>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm text-dark-muted">
                    {session.course?.title ?? <span className="text-xs opacity-50">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn('badge', statusColor(session.status ?? 'SCHEDULED'))}>
                      {session.status === 'LIVE' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse inline-block mr-1" />}
                      {session.status ?? 'Scheduled'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-dark-muted">
                    {session.scheduledAt ? (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(session.scheduledAt).toLocaleString('en-NP', { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      {session.status !== 'LIVE' && session.status !== 'ENDED' && (
                        <button onClick={() => startMutation.mutate(session.id)} className="text-xs btn-primary px-3 py-1.5">
                          Go Live
                        </button>
                      )}
                      {session.status === 'LIVE' && (
                        <>
                          {session.externalLink ? (
                            <a href={session.externalLink} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border">
                              <ExternalLink className="w-4 h-4 text-brand-400" />
                            </a>
                          ) : null}
                          <button onClick={() => endMutation.mutate(session.id)} className="text-xs bg-red-500/20 text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-500/30 transition-colors">
                            End
                          </button>
                        </>
                      )}
                      <button onClick={() => { if (confirm('Delete this session?')) deleteMutation.mutate(session.id); }} className="p-1.5 rounded-lg hover:bg-red-500/10">
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
