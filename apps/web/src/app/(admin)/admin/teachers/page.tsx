'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Search, Shield, UserPlus, X, Trash2, ToggleLeft, ToggleRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

// ── Add Teacher Modal ─────────────────────────────────────────────────────────
function AddTeacherModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPw, setShowPw] = useState(false);

  const createMutation = useMutation({
    mutationFn: () => api.post('/users', { ...form, role: 'TEACHER', password: form.password || 'Teacher@123' }).then(r => r.data),
    onSuccess: () => {
      toast.success('Teacher account created');
      qc.invalidateQueries({ queryKey: ['admin', 'teachers'] });
      onClose();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create account'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-dark-border overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-900/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-brand-400" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">Add Teacher</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
            <X className="w-5 h-5 text-dark-muted" />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-dark-muted mb-1.5">Full Name *</label>
            <input required className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Teacher's full name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-muted mb-1.5">Email *</label>
            <input required type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="teacher@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-muted mb-1.5">Phone (optional)</label>
            <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+977 98XXXXXXXX" />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-muted mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                className="input pr-10"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Default: Teacher@123"
              />
              <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-muted hover:text-white transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-dark-muted mt-1">Leave blank to use default: Teacher@123</p>
          </div>

          <div className="bg-brand-900/10 border border-brand-900/30 rounded-xl p-3">
            <p className="text-xs text-brand-400 font-medium">Teacher permissions:</p>
            <ul className="mt-1.5 space-y-0.5">
              {['Can create & edit courses', 'Can create & edit exams', 'Can schedule live classes', 'Cannot access Students, CMS, Analytics'].map(p => (
                <li key={p} className="text-xs text-dark-muted flex items-center gap-1.5">
                  <span className="text-brand-400">·</span> {p}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
              {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {createMutation.isPending ? 'Creating…' : 'Create Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminTeachersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const { data } = useQuery({
    queryKey: ['admin', 'teachers', search],
    queryFn: () => api.get('/users', { params: { search, limit: 100, role: 'TEACHER' } }).then(r => r.data?.data ?? r.data ?? []),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/toggle-active`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'teachers'] }); toast.success('Status updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'teachers'] }); toast.success('Teacher removed'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete'),
  });

  const teachers = data ?? [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Teachers</h1>
          <p className="text-dark-muted text-sm">{teachers.length} teacher{teachers.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input pl-11"
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-dark-border">
              {['Teacher', 'Email', 'Phone', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
            {teachers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-14 text-center text-dark-muted">
                  <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>No teachers yet</p>
                  <button onClick={() => setShowAdd(true)} className="btn-primary mt-4 inline-flex items-center gap-2 text-sm">
                    <UserPlus className="w-4 h-4" /> Add First Teacher
                  </button>
                </td>
              </tr>
            ) : teachers.map((t: any) => (
              <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {t.name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t.name}</p>
                      <span className="text-[10px] text-brand-400 font-semibold uppercase flex items-center gap-1">
                        <Shield className="w-2.5 h-2.5" /> Teacher
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-dark-muted">{t.email}</td>
                <td className="px-5 py-3 text-sm text-dark-muted">{t.phone ?? '—'}</td>
                <td className="px-5 py-3 text-sm text-dark-muted">{formatRelativeTime(t.createdAt)}</td>
                <td className="px-5 py-3">
                  <span className={cn('badge', t.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                    {t.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleMutation.mutate(t.id)}
                      title={t.isActive ? 'Deactivate' : 'Activate'}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                    >
                      {t.isActive
                        ? <ToggleRight className="w-5 h-5 text-green-400" />
                        : <ToggleLeft className="w-5 h-5 text-dark-muted" />}
                    </button>
                    <button
                      onClick={() => { if (confirm(`Remove teacher "${t.name}"? They will lose admin access.`)) deleteMutation.mutate(t.id); }}
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
      </div>

      {showAdd && <AddTeacherModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
