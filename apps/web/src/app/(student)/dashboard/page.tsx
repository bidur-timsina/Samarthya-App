'use client';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { BookOpen, CheckCircle, Trophy, Flame, ChevronRight, Bell, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime, getLevelName } from '@/lib/utils';
import Image from 'next/image';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-dark-muted">{label}</p>
      </div>
    </div>
  );
}

function BannerCarousel({ banners }: { banners: any[] }) {
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const reset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setIdx(i => (i + 1) % banners.length), 4000);
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    reset();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [banners.length]);

  if (!banners.length) return null;
  const b = banners[idx];

  return (
    <div className="relative rounded-2xl overflow-hidden h-44 md:h-52 group">
      {/* Image */}
      <img
        src={b.image}
        alt={b.title}
        className="w-full h-full object-cover transition-opacity duration-500"
      />
      {/* Gradient overlay + title */}
      {b.title && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
          <p className="text-white font-semibold text-sm md:text-base">{b.title}</p>
        </div>
      )}
      {/* Clickable link */}
      {b.link && (
        <a href={b.link} target="_blank" rel="noopener noreferrer" className="absolute inset-0" />
      )}
      {/* Prev / Next arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={() => { setIdx(i => (i - 1 + banners.length) % banners.length); reset(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={() => { setIdx(i => (i + 1) % banners.length); reset(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => { setIdx(i); reset(); }}
                className={`h-1.5 rounded-full transition-all ${i === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const { user } = useAuthStore();

  const { data: enrollments } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => api.get('/enrollments/my').then(r => r.data),
  });

  const { data: xpData } = useQuery({
    queryKey: ['goals', 'my'],
    queryFn: () => api.get('/goals/my').then(r => r.data),
  });

  const { data: announcements } = useQuery({
    queryKey: ['cms', 'announcements'],
    queryFn: () => api.get('/cms/announcements').then(r => r.data),
  });

  const { data: banners } = useQuery({
    queryKey: ['cms', 'banners'],
    queryFn: () => api.get('/cms/banners').then(r => r.data),
  });

  const courses = enrollments ?? [];
  const xp = xpData?.xp;
  const streak = xp?.streak ?? 0;
  const level = xp?.level ?? 1;
  const activeBanners = (banners ?? []).filter((b: any) => b.isActive);

  if (!mounted) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* CMS Banner Carousel */}
      {activeBanners.length > 0 && <BannerCarousel banners={activeBanners} />}

      {/* Welcome banner */}
      <div className="bg-gradient-brand rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-full opacity-10">
          <div className="w-64 h-64 rounded-full bg-white -translate-y-16 translate-x-16" />
        </div>
        <div className="relative">
          <div className="flex items-center gap-2 mb-1">
            {streak > 0 ? (
              <span className="badge bg-orange-500/20 text-orange-300 border border-orange-500/30">
                <Flame className="w-3 h-3" /> {streak} day streak
              </span>
            ) : (
              <span className="badge bg-white/10 text-white/70">Start your streak today!</span>
            )}
          </div>
          <h1 className="text-2xl font-bold mt-2">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-white/70 text-sm mt-1">Level {level} — {getLevelName(level)} • {xp?.totalXP ?? 0} XP</p>

          {xp && (
            <div className="mt-4 max-w-xs">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>{xp.totalXP} XP</span>
                <span>{xp.totalXP + (xp.nextLevel - xp.progress)} XP to level {level + 1}</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min((xp.progress / xp.nextLevel) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen}    label="Active Courses"    value={courses.length}                       color="bg-brand-900" />
        <StatCard icon={CheckCircle} label="Lessons Done"      value={xp?.totalXP ?? 0}                    color="bg-green-600" />
        <StatCard icon={Trophy}      label="Current Level"     value={`Lv. ${level}`}                      color="bg-amber-500" />
        <StatCard icon={Flame}       label="Day Streak"        value={streak}                              color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Continue Learning */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Continue Learning</h2>
            <Link href="/courses" className="text-sm text-brand-500 hover:text-brand-400 flex items-center gap-1 transition-colors">
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="card p-8 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-dark-muted opacity-40" />
              <p className="text-dark-muted mb-4">You haven't enrolled in any courses yet.</p>
              <Link href="/explore" className="btn-primary inline-flex items-center gap-2">
                Explore Courses <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {courses.slice(0, 3).map((enrollment: any) => (
                <CourseProgressCard key={enrollment.id} enrollment={enrollment} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar widgets */}
        <div className="space-y-4">
          {/* Announcements */}
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-brand-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Updates</h3>
            </div>
            {(announcements ?? []).slice(0, 4).length === 0 ? (
              <p className="text-dark-muted text-sm">No announcements yet.</p>
            ) : (
              <div className="space-y-3">
                {(announcements ?? []).slice(0, 4).map((a: any) => (
                  <div key={a.id} className="border-l-2 border-brand-900 pl-3">
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{a.title}</p>
                    <p className="text-xs text-dark-muted">{formatRelativeTime(a.publishedAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick links */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-3">Quick Access</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/exams', label: 'Take Exam', icon: '📝' },
                { href: '/goals', label: 'My Goals', icon: '🎯' },
                { href: '/live-classes', label: 'Live Class', icon: '📡' },
                { href: '/chat', label: 'AI Chat', icon: '🤖' },
              ].map(({ href, label, icon }) => (
                <Link key={href} href={href} className="p-3 rounded-xl bg-gray-50 dark:bg-dark-bg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors text-center">
                  <p className="text-xl mb-1">{icon}</p>
                  <p className="text-xs font-medium text-gray-700 dark:text-dark-muted">{label}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseProgressCard({ enrollment }: { enrollment: any }) {
  const course = enrollment.course;
  const total = course.chapters?.flatMap((c: any) => c.lessons).length ?? 0;

  return (
    <Link href={`/courses/${course.id}`} className="card p-4 flex items-center gap-4 hover:border-brand-900/50 transition-all group">
      <div className="w-14 h-14 rounded-xl bg-brand-900/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
        {course.thumbnail ? (
          <Image src={course.thumbnail} alt={course.title} width={56} height={56} className="object-cover w-full h-full rounded-xl" />
        ) : (
          <BookOpen className="w-6 h-6 text-brand-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 dark:text-white text-sm truncate group-hover:text-brand-500 transition-colors">{course.title}</p>
        <p className="text-xs text-dark-muted">{course.category?.name} • {total} lessons</p>
        <div className="mt-2 h-1.5 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
          <div className="h-full bg-brand-700 rounded-full w-1/3 transition-all" />
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-dark-muted group-hover:text-brand-500 flex-shrink-0 transition-colors" />
    </Link>
  );
}
