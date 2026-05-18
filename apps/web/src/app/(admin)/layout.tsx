'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { useAuthStore } from '@/store/auth.store';
import Cookies from 'js-cookie';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, fetchMe } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const token = Cookies.get('accessToken');
    if (!token && !isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (!user && token) {
      fetchMe();
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'TEACHER') {
      router.replace('/dashboard');
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-bg">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-bg">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  );
}
