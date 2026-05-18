'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Save, Loader2, Shield, Bell, Globe, Palette } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

export default function AdminSettingsPage() {
  const { user } = useAuthStore();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const changePasswordMutation = useMutation({
    mutationFn: (data: any) => api.patch('/users/me/password', data),
    onSuccess: () => {
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirm: '' });
    },
    onError: () => toast.error('Failed to change password — check current password'),
  });

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirm) return toast.error('Passwords do not match');
    if (passwordForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    changePasswordMutation.mutate({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-dark-muted text-sm">Manage your admin account and preferences</p>
      </div>

      {/* Admin Profile */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-brand-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Admin Account</h2>
        </div>
        <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-dark-bg rounded-xl">
          <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center text-white text-xl font-bold">
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{user?.name ?? 'Admin'}</p>
            <p className="text-sm text-dark-muted">{user?.email}</p>
            <span className="badge bg-brand-900/20 text-brand-400 text-xs mt-1">Administrator</span>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-amber-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Change Password</h2>
        </div>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={e => setPasswordForm(f => ({ ...f, currentPassword: e.target.value }))}
              className="input"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={e => setPasswordForm(f => ({ ...f, newPassword: e.target.value }))}
              className="input"
              placeholder="Minimum 8 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirm}
              onChange={e => setPasswordForm(f => ({ ...f, confirm: e.target.value }))}
              className="input"
              placeholder="Repeat new password"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changePasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword}
              className="btn-primary flex items-center gap-2"
            >
              {changePasswordMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Platform Info */}
      <div className="card p-6 space-y-3">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="w-5 h-5 text-green-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Platform Info</h2>
        </div>
        {[
          { label: 'Institute Name', value: 'Samarthya Institute' },
          { label: 'Platform Version', value: '1.0.0' },
          { label: 'API Base', value: 'http://localhost:4000/api/v1' },
          { label: 'Environment', value: 'Development' },
        ].map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-dark-border last:border-0">
            <span className="text-sm text-dark-muted">{label}</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
          </div>
        ))}
      </div>

      {/* Notifications */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-5 h-5 text-purple-400" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
        </div>
        {[
          { label: 'New student enrollments', sub: 'Get notified when students enroll' },
          { label: 'Payment received', sub: 'Alerts for successful payments' },
          { label: 'Exam submissions', sub: 'When students complete exams' },
        ].map(({ label, sub }) => (
          <label key={label} className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
              <p className="text-xs text-dark-muted">{sub}</p>
            </div>
            <div className="relative w-10 h-5 rounded-full bg-brand-700">
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-white rounded-full shadow" />
            </div>
          </label>
        ))}
      </div>
    </div>
  );
}
