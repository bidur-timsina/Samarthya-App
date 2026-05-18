'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Bell, Sun, Moon, Search, Menu } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useState } from 'react';
import { useNotificationCount } from '@/hooks/use-notifications';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Home',
  '/explore':      'Explore',
  '/courses':      'My Courses',
  '/exams':        'Exams',
  '/goals':        'Goals',
  '/live-classes': 'Live Classes',
  '/chat':         'Chat',
  '/profile':      'Profile',
};

export function Header() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const { data: notifCount } = useNotificationCount();
  const { user } = useAuthStore();

  const title = Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k))?.[1] ?? 'Samarthya Institute';

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md border-b border-gray-200 dark:border-dark-border px-6 py-3">
      <div className="flex items-center gap-4">
        {/* Breadcrumb */}
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-dark-muted">
            <Link href="/dashboard" className="hover:text-brand-500 transition-colors">Home</Link>
            {title !== 'Home' && (
              <>
                <span>/</span>
                <span className="text-gray-900 dark:text-white font-medium">{title}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors text-dark-muted hover:text-gray-900 dark:hover:text-white">
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors text-dark-muted hover:text-gray-900 dark:hover:text-white"
          >
            {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>

          {/* Notifications */}
          <Link href="/notifications" className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-dark-surface transition-colors text-dark-muted hover:text-gray-900 dark:hover:text-white">
            <Bell className="w-4.5 h-4.5" />
            {(notifCount?.count ?? 0) > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Link>

          {/* Avatar */}
          <Link href="/profile" className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center flex-shrink-0 hover:ring-2 hover:ring-brand-500 transition-all">
            <span className="text-white text-sm font-bold">{user?.name?.[0]?.toUpperCase()}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
