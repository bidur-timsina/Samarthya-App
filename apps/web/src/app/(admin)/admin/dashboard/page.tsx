'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Users, BookOpen, DollarSign, TrendingUp } from 'lucide-react';
import { formatPrice, formatRelativeTime } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '@/store/auth.store';

function StatCard({ icon: Icon, label, value, color, sub }: any) {
  return (
    <div className="stat-card">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-dark-muted">{label}</p>
        {sub && <p className="text-xs text-green-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';

  const { data: overview } = useQuery({ queryKey: ['analytics', 'overview'], queryFn: () => api.get('/analytics/overview').then(r => r.data) });
  const { data: revenue } = useQuery({ queryKey: ['analytics', 'revenue'], queryFn: () => api.get('/analytics/revenue').then(r => r.data), enabled: !isTeacher });
  const { data: topCourses } = useQuery({ queryKey: ['analytics', 'top-courses'], queryFn: () => api.get('/analytics/top-courses').then(r => r.data) });
  const { data: recentStudents } = useQuery({ queryKey: ['analytics', 'recent-students'], queryFn: () => api.get('/analytics/recent-students').then(r => r.data) });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-dark-muted text-sm">Shubha Yatra Academy Overview</p>
      </div>

      {/* Stats */}
      <div className={`grid gap-4 ${isTeacher ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
        <StatCard icon={Users}      label="Total Students"   value={overview?.totalStudents ?? 0}                           color="bg-brand-900" />
        <StatCard icon={BookOpen}   label="Published Courses" value={overview?.totalCourses ?? 0}                           color="bg-green-600" />
        {!isTeacher && <StatCard icon={DollarSign} label="Total Revenue" value={formatPrice(overview?.totalRevenue ?? 0)}   color="bg-amber-500" />}
        <StatCard icon={TrendingUp} label="Active Enrollments" value={overview?.totalEnrollments ?? 0}                     color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart — admin only */}
        {!isTeacher && (
          <div className="xl:col-span-2 card p-5">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Revenue (Last 6 months)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenue ?? []}>
                <defs>
                  <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D2B6B" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0D2B6B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#8B96A7', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B96A7', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                <Tooltip formatter={(v: number) => [formatPrice(v), 'Revenue']} contentStyle={{ background: '#1C2230', border: '1px solid #2A3346', borderRadius: '12px', color: '#E6EDF3' }} />
                <Area type="monotone" dataKey="revenue" stroke="#3B63BB" strokeWidth={2} fill="url(#revGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top Courses */}
        <div className={`card p-5 ${isTeacher ? 'xl:col-span-3' : ''}`}>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Courses</h3>
          <div className="space-y-3">
            {(topCourses ?? []).slice(0, 5).map((course: any, i: number) => (
              <div key={course.id} className="flex items-center gap-3">
                <span className="text-dark-muted text-sm w-5">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white truncate">{course.title}</p>
                  <p className="text-xs text-dark-muted">{course._count?.enrollments ?? 0} students</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Students */}
      <div className="card overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-border">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Students</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-dark-border">
          {(recentStudents ?? []).map((student: any) => (
            <div key={student.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-9 h-9 rounded-full bg-brand-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {student.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{student.name}</p>
                <p className="text-xs text-dark-muted">{student.email}</p>
              </div>
              <p className="text-xs text-dark-muted flex-shrink-0">{formatRelativeTime(student.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
