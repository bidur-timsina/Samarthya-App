'use client';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { User, Settings, Bell, Shield, HelpCircle, LogOut, ChevronRight, Camera, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { user, logout, setUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  // next-themes only knows the theme on the client; gate on mount to avoid a hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const dark = mounted && theme === 'dark';
  const qc = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: user?.name ?? '', bio: (user as any)?.bio ?? '', location: (user as any)?.location ?? '' });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch('/users/me', data).then(r => r.data),
    onSuccess: (data) => { setUser(data); setEditing(false); toast.success('Profile updated'); },
  });

  const SETTINGS = [
    { icon: Settings,   label: 'App Settings',       description: 'Theme, language, preferences', href: null },
    { icon: Bell,       label: 'Notifications',       description: 'Push and email preferences', href: null },
    { icon: Shield,     label: 'Privacy & Security',  description: 'Password, sessions', href: null },
    { icon: HelpCircle, label: 'Help & Support',      description: 'FAQs, contact us', href: null },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile header */}
      <div className="card p-6">
        <div className="flex items-start gap-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-brand-900 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand-500 border-2 border-white dark:border-dark-card flex items-center justify-center hover:bg-brand-400 transition-colors">
              <Camera className="w-3 h-3 text-white" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="badge bg-green-500/20 text-green-400">{user?.role?.toLowerCase()}</span>
                </div>
              </div>
              <button onClick={() => setEditing(!editing)} className="btn-secondary text-sm px-4 py-2">
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="text-dark-muted">📧 {user?.email}</div>
              {user && 'createdAt' in user && <div className="text-dark-muted">📅 Joined {format(new Date((user as any).createdAt), 'MMM yyyy')}</div>}
            </div>
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(form); }} className="mt-5 pt-5 border-t border-gray-100 dark:border-dark-border space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-dark-muted mb-1.5">Full Name</label>
                <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-medium text-dark-muted mb-1.5">Location</label>
                <input className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="City, Nepal" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-dark-muted mb-1.5">Bio</label>
                <textarea rows={2} className="input resize-none" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Brief bio..." />
              </div>
            </div>
            <p className="text-xs text-dark-muted">Email and phone can only be changed by an administrator.</p>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary w-full">
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
      </div>

      {/* Settings */}
      <div className="card divide-y divide-gray-100 dark:divide-dark-border overflow-hidden">
        {/* Theme toggle */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-dark-bg flex items-center justify-center">
              {dark ? <Moon className="w-4.5 h-4.5 text-brand-400" /> : <Sun className="w-4.5 h-4.5 text-amber-400" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Appearance</p>
              <p className="text-xs text-dark-muted capitalize">{mounted ? theme : 'light'} mode</p>
            </div>
          </div>
          <button
            onClick={() => setTheme(dark ? 'light' : 'dark')}
            className={cn('w-12 h-6 rounded-full transition-all relative flex-shrink-0', dark ? 'bg-brand-900' : 'bg-gray-200')}
          >
            <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', dark ? 'translate-x-6' : 'translate-x-0.5')} />
          </button>
        </div>

        {SETTINGS.map(({ icon: Icon, label, description }) => (
          <button key={label} className="flex items-center gap-3 p-4 w-full hover:bg-gray-50 dark:hover:bg-dark-surface transition-colors text-left">
            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-dark-bg flex items-center justify-center flex-shrink-0">
              <Icon className="w-4.5 h-4.5 text-gray-600 dark:text-dark-muted" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
              <p className="text-xs text-dark-muted">{description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-dark-muted" />
          </button>
        ))}
      </div>

      {/* Sign out */}
      <button onClick={logout} className="w-full card p-4 flex items-center gap-3 hover:bg-red-500/5 hover:border-red-500/30 transition-all group">
        <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
          <LogOut className="w-4.5 h-4.5 text-red-500" />
        </div>
        <span className="text-sm font-medium text-red-500">Sign Out</span>
      </button>
    </div>
  );
}
