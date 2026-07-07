'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { LayoutDashboard, BookOpen, Users, ClipboardList, BarChart2, Megaphone, Video, Settings, LogOut, Shield, Tag } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const ALL_NAV = [
  { href: '/admin/dashboard',  icon: LayoutDashboard, label: 'Dashboard',    roles: ['ADMIN', 'TEACHER'] },
  { href: '/admin/courses',    icon: BookOpen,        label: 'Courses',      roles: ['ADMIN', 'TEACHER'] },
  { href: '/admin/categories', icon: Tag,             label: 'Categories',   roles: ['ADMIN'] },
  { href: '/admin/students',   icon: Users,           label: 'Students',     roles: ['ADMIN'] },
  { href: '/admin/teachers',   icon: Shield,          label: 'Teachers',     roles: ['ADMIN'] },
  { href: '/admin/exams',      icon: ClipboardList,   label: 'Exams',        roles: ['ADMIN', 'TEACHER'] },
  { href: '/admin/live',       icon: Video,           label: 'Live Classes', roles: ['ADMIN', 'TEACHER'] },
  { href: '/admin/analytics',  icon: BarChart2,       label: 'Analytics',    roles: ['ADMIN'] },
  { href: '/admin/cms',        icon: Megaphone,       label: 'CMS',          roles: ['ADMIN'] },
  { href: '/admin/settings',   icon: Settings,        label: 'Settings',     roles: ['ADMIN'] },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const NAV = ALL_NAV.filter(item => item.roles.includes(user?.role ?? ''));

  return (
    <aside className="w-60 flex-shrink-0 bg-white dark:bg-dark-surface border-r border-gray-200 dark:border-dark-border flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center gap-3">
        <Image src="/logo.png" alt="SYA Logo" width={36} height={36} className="object-contain flex-shrink-0" />
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white leading-none">Shubha Yatra</p>
          <p className="text-[10px] text-dark-muted uppercase tracking-wider">{user?.role === 'TEACHER' ? 'Teacher Panel' : 'Admin Panel'}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn('nav-item', (pathname === href || pathname.startsWith(href + '/')) && 'active')}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* User + Sign Out */}
      <div className="p-3 border-t border-gray-200 dark:border-dark-border space-y-1">
        {/* Admin identity */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate leading-none">{user?.name ?? 'Admin'}</p>
            <span className="text-[10px] text-brand-400 font-medium uppercase tracking-wide flex items-center gap-1">
              <Shield className="w-2.5 h-2.5" />
              {user?.role ?? 'Admin'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="nav-item w-full text-red-500 hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
