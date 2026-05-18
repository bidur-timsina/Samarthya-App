'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Search, Users, ToggleLeft, ToggleRight, BookOpen, X, ChevronDown, Trash2, UserPlus } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

// ── Enroll Modal ──────────────────────────────────────────────────────────────
function EnrollModal({ student, onClose }: { student: { id: string; name: string; email: string }; onClose: () => void }) {
  const qc = useQueryClient();
  const [courseId, setCourseId] = useState('');
  const [tier, setTier] = useState('BASIC');

  const { data: coursesData } = useQuery({
    queryKey: ['admin', 'courses', 'all'],
    queryFn: () => api.get('/courses', { params: { all: true, limit: 200 } }).then(r => r.data),
  });

  const { data: existingEnrollments } = useQuery({
    queryKey: ['admin', 'student-enrollments', student.id],
    queryFn: () => api.get('/enrollments').then(r =>
      (r.data as any[]).filter((e: any) => e.user.id === student.id)
    ),
  });

  const enrollMutation = useMutation({
    mutationFn: () => api.post('/enrollments/admin/enroll', { userId: student.id, courseId, tier }),
    onSuccess: () => {
      toast.success(`${student.name} enrolled successfully!`);
      qc.invalidateQueries({ queryKey: ['admin', 'student-enrollments', student.id] });
      qc.invalidateQueries({ queryKey: ['admin', 'students'] });
      setCourseId('');
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Enrollment failed'),
  });

  const removeMutation = useMutation({
    mutationFn: (enrollmentId: string) => api.delete(`/enrollments/admin/${enrollmentId}`),
    onSuccess: () => {
      toast.success('Enrollment removed');
      qc.invalidateQueries({ queryKey: ['admin', 'student-enrollments', student.id] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to remove'),
  });

  const courses = coursesData?.data ?? [];
  const enrolledCourseIds = new Set((existingEnrollments ?? []).map((e: any) => e.course.id));
  const availableCourses = courses.filter((c: any) => !enrolledCourseIds.has(c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface rounded-2xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-dark-border overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-dark-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-900 flex items-center justify-center text-white font-bold">
              {student.name[0]}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{student.name}</p>
              <p className="text-xs text-dark-muted">{student.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
            <X className="w-5 h-5 text-dark-muted" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-brand-400" /> Enroll in Course
            </h3>
            <div className="relative">
              <select value={courseId} onChange={e => setCourseId(e.target.value)} className="input appearance-none pr-10 w-full">
                <option value="">— Select a course —</option>
                {availableCourses.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.title} {Number(c.price) > 0 ? `(NPR ${Number(c.price).toLocaleString()})` : '(Free)'}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted pointer-events-none" />
            </div>
            <div className="flex gap-2">
              {(['BASIC', 'STANDARD', 'PREMIUM'] as const).map(t => (
                <button key={t} onClick={() => setTier(t)}
                  className={cn('flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors',
                    tier === t ? 'bg-brand-600 border-brand-600 text-white' : 'border-gray-200 dark:border-dark-border text-dark-muted hover:border-brand-500 hover:text-brand-400'
                  )}>
                  {t}
                </button>
              ))}
            </div>
            <button onClick={() => enrollMutation.mutate()} disabled={!courseId || enrollMutation.isPending} className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
              {enrollMutation.isPending ? 'Enrolling…' : 'Enroll Student'}
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Current Enrollments
              <span className="ml-2 text-xs font-normal text-dark-muted">({(existingEnrollments ?? []).length})</span>
            </h3>
            {(existingEnrollments ?? []).length === 0 ? (
              <p className="text-sm text-dark-muted text-center py-4">Not enrolled in any course yet</p>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {(existingEnrollments ?? []).map((e: any) => (
                  <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-dark-bg border border-gray-100 dark:border-dark-border">
                    <div className="w-8 h-8 rounded-lg bg-brand-900/20 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-4 h-4 text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{e.course.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold text-brand-400 uppercase">{e.tier}</span>
                        <span className="text-[10px] text-dark-muted">·</span>
                        <span className={cn('text-[10px] font-medium', e.status === 'ACTIVE' ? 'text-green-400' : 'text-amber-400')}>{e.status}</span>
                      </div>
                    </div>
                    <button onClick={() => { if (confirm(`Remove from "${e.course.title}"?`)) removeMutation.mutate(e.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Create Student Modal ──────────────────────────────────────────────────────
function CreateStudentModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  const createMutation = useMutation({
    mutationFn: () => api.post('/users', { ...form, role: 'STUDENT' }).then(r => r.data),
    onSuccess: () => {
      toast.success('Student account created');
      qc.invalidateQueries({ queryKey: ['admin', 'students'] });
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
              <UserPlus className="w-5 h-5 text-brand-400" />
            </div>
            <p className="font-semibold text-gray-900 dark:text-white">Add Student</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors">
            <X className="w-5 h-5 text-dark-muted" />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-dark-muted mb-1.5">Full Name *</label>
            <input required className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Student name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-muted mb-1.5">Email *</label>
            <input required type="email" className="input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="student@example.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-muted mb-1.5">Phone (optional)</label>
            <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+977 98XXXXXXXX" />
          </div>
          <div>
            <label className="block text-xs font-medium text-dark-muted mb-1.5">Password</label>
            <input type="password" className="input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Default: Student@123" />
            <p className="text-xs text-dark-muted mt-1">Leave blank to use default password: Student@123</p>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1 disabled:opacity-50">
              {createMutation.isPending ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminStudentsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [enrollTarget, setEnrollTarget] = useState<{ id: string; name: string; email: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin', 'students', { search, page }],
    queryFn: () => api.get('/users', { params: { search, page, limit: 20 } }).then(r => r.data),
    placeholderData: prev => prev,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/users/${id}/toggle-active`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'students'] }); toast.success('Status updated'); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'students'] }); toast.success('Student deleted'); },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to delete'),
  });

  const students = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="text-dark-muted text-sm">{meta?.total ?? 0} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Student
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="input pl-11"
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 dark:border-dark-border">
              {['Student', 'Email', 'Phone', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-dark-muted uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-dark-border">
            {students.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-dark-muted">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No students found
                </td>
              </tr>
            ) : students.map((s: any) => (
              <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-dark-surface/50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {s.name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                      <p className="text-xs text-dark-muted">{s.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-sm text-dark-muted">{s.email}</td>
                <td className="px-5 py-3 text-sm text-dark-muted">{s.phone ?? '—'}</td>
                <td className="px-5 py-3 text-sm text-dark-muted">{formatRelativeTime(s.createdAt)}</td>
                <td className="px-5 py-3">
                  <span className={cn('badge', s.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400')}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEnrollTarget({ id: s.id, name: s.name, email: s.email })}
                      title="Enroll in course"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-900/20 hover:bg-brand-900/40 text-brand-400 text-xs font-medium transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Enroll
                    </button>
                    <button
                      onClick={() => toggleMutation.mutate(s.id)}
                      title={s.isActive ? 'Deactivate' : 'Activate'}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                    >
                      {s.isActive
                        ? <ToggleRight className="w-5 h-5 text-green-400" />
                        : <ToggleLeft className="w-5 h-5 text-dark-muted" />}
                    </button>
                    <button
                      onClick={() => { if (confirm(`Permanently delete "${s.name}"? This cannot be undone.`)) deleteMutation.mutate(s.id); }}
                      title="Delete student"
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

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Prev</button>
          <span className="text-sm text-dark-muted">Page {page} of {meta.totalPages}</span>
          <button disabled={page === meta.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary px-4 py-2 text-sm disabled:opacity-40">Next</button>
        </div>
      )}

      {enrollTarget && <EnrollModal student={enrollTarget} onClose={() => setEnrollTarget(null)} />}
      {showCreate && <CreateStudentModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
