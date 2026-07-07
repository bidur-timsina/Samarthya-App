'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Compass, BookOpen, ClipboardList,
  Target, Video, MessageSquare, User, ChevronLeft, ChevronRight,
  LogOut, Bell,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNotificationCount } from '@/hooks/use-notifications';
import Image from 'next/image';

const NAV = [
  { href: '/dashboard',    icon: LayoutDashboard, label: 'Home' },
  { href: '/explore',      icon: Compass,         label: 'Explore' },
  { href: '/courses',      icon: BookOpen,        label: 'My Courses' },
  { href: '/exams',        icon: ClipboardList,   label: 'Exams' },
  { href: '/goals',        icon: Target,          label: 'Goals' },
  { href: '/live-classes', icon: Video,           label: 'Live Classes' },
  { href: '/chat',         icon: MessageSquare,   label: 'Chat' },
  { href: '/profile',      icon: User,            label: 'Profile' },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();
  const { data: notifCount } = useNotificationCount();

  return (
    <aside className={cn(
      'hidden md:flex flex-col h-screen bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border transition-all duration-300 sticky top-0',
      collapsed ? 'w-16' : 'w-60',
    )}>
      {/* Logo */}
      <div className={cn('flex items-center gap-3 p-4 border-b border-gray-200 dark:border-dark-border', collapsed && 'justify-center')}>
        <Image src="/logo.png" alt="SYA Logo" width={36} height={36} className="object-contain flex-shrink-0" />
        {!collapsed && (
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Shubha Yatra</p>
            <p className="text-[10px] text-dark-muted uppercase tracking-wider">Academy</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          const showBadge = label === 'Chat' && (notifCount?.count ?? 0) > 0;
          return (
            <Link
              key={href}
              href={href}
              className={cn('nav-item relative group', active && 'active', collapsed && 'justify-center px-2')}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" />
              {!collapsed && <span className="flex-1">{label}</span>}
              {showBadge && (
                <span className={cn('absolute bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center', collapsed ? 'w-4 h-4 top-1 right-1' : 'w-5 h-5 right-3')}>
                  {notifCount?.count}
                </span>
              )}
              {collapsed && (
                <span className="absolute left-full ml-2 bg-gray-900 text-white text-xs px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 transition-opacity">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-dark-border space-y-1">
        {!collapsed && user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{user.name?.[0]?.toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-[10px] text-dark-muted capitalize">{user.role?.toLowerCase()}</p>
            </div>
          </div>
        )}
        <button
          onClick={() => logout()}
          className={cn('nav-item w-full text-red-500 hover:bg-red-500/10 hover:text-red-500 dark:hover:bg-red-500/10', collapsed && 'justify-center px-2')}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <button
          onClick={() => setCollapsed(p => !p)}
          className={cn('nav-item w-full', collapsed && 'justify-center px-2')}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>
      </div>
    </aside>
  );
}
