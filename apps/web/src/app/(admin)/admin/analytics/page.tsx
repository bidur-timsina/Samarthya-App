'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Users, BookOpen, DollarSign, TrendingUp, Award, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { formatPrice } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#0D2B6B', '#1A3A8A', '#3B63BB', '#5A7FC9', '#8FA8D8'];

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

function StatTile({ icon: Icon, label, value, color, sub }: any) {
  return (
    <Card>
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-dark-muted">{label}</p>
          {sub && <p className="text-xs text-green-400 mt-0.5">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

const tooltip = { contentStyle: { background: '#1C2230', border: '1px solid #2A3346', borderRadius: '12px', color: '#E6EDF3', fontSize: 12 } };

export default function AdminAnalyticsPage() {
  const { user } = useAuthStore();
  const isTeacher = user?.role === 'TEACHER';

  const { data: overview } = useQuery({ queryKey: ['analytics', 'overview'], queryFn: () => api.get('/analytics/overview').then(r => r.data) });
  const { data: revenue } = useQuery({ queryKey: ['analytics', 'revenue'], queryFn: () => api.get('/analytics/revenue').then(r => r.data), enabled: !isTeacher });
  const { data: topCourses } = useQuery({ queryKey: ['analytics', 'top-courses'], queryFn: () => api.get('/analytics/top-courses').then(r => r.data) });
  const { data: recentStudents } = useQuery({ queryKey: ['analytics', 'recent-students'], queryFn: () => api.get('/analytics/recent-students').then(r => r.data) });
  const { data: enrollTrend } = useQuery({ queryKey: ['analytics', 'enroll-trend'], queryFn: () => api.get('/analytics/enrollment-trend').then(r => r.data) });

  const revList = revenue ?? [];
  const topList = (topCourses ?? []).slice(0, 5);
  const categoryData = topList.map((c: any) => ({ name: c.category?.name ?? 'Other', value: c._count?.enrollments ?? 0 }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-dark-muted text-sm">Performance overview for Shubha Yatra Academy</p>
      </div>

      {/* KPI tiles */}
      <div className={`grid gap-4 ${isTeacher ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-2 lg:grid-cols-4'}`}>
        <StatTile icon={Users}      label="Total Students"    value={overview?.totalStudents ?? 0}                   color="bg-brand-900" />
        <StatTile icon={BookOpen}   label="Active Courses"    value={overview?.totalCourses ?? 0}                    color="bg-green-600" />
        {!isTeacher && <StatTile icon={DollarSign} label="Total Revenue" value={formatPrice(overview?.totalRevenue ?? 0)} color="bg-amber-500" />}
        <StatTile icon={TrendingUp} label="Total Enrollments" value={overview?.totalEnrollments ?? 0}                color="bg-purple-600" />
      </div>

      {/* Revenue + Enrollments */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {!isTeacher && (
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revList}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0D2B6B" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#0D2B6B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A3346" />
                <XAxis dataKey="month" tick={{ fill: '#8B96A7', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8B96A7', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatPrice(v), 'Revenue']} {...tooltip} />
                <Area type="monotone" dataKey="revenue" stroke="#3B63BB" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}

        <Card className={isTeacher ? 'xl:col-span-2' : ''}>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Monthly Enrollments</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={enrollTrend ?? revList}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A3346" />
              <XAxis dataKey="month" tick={{ fill: '#8B96A7', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8B96A7', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip {...tooltip} />
              <Bar dataKey="enrollments" fill="#3B63BB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Top Courses + Category Pie */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 card overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-dark-border">
            <h3 className="font-semibold text-gray-900 dark:text-white">Top Courses by Enrollment</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-dark-border">
            {topList.length === 0 && <p className="p-6 text-center text-dark-muted text-sm">No data yet</p>}
            {topList.map((c: any, i: number) => {
              const max = topList[0]?._count?.enrollments ?? 1;
              const pct = Math.round(((c._count?.enrollments ?? 0) / max) * 100);
              return (
                <div key={c.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="text-dark-muted font-mono text-sm w-5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{c.title}</p>
                    <div className="mt-1.5 h-1.5 bg-gray-100 dark:bg-dark-border rounded-full overflow-hidden">
                      <div className="h-full bg-brand-700 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">{c._count?.enrollments ?? 0}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">By Category</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                  {categoryData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltip} />
                <Legend formatter={(v) => <span style={{ color: '#8B96A7', fontSize: 12 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-dark-muted text-sm">No enrollment data</div>
          )}
        </Card>
      </div>

      {/* Recent Students */}
      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-dark-border flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Students</h3>
          <a href="/admin/students" className="text-sm text-brand-400 hover:text-brand-500">View all →</a>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-dark-border">
          {(recentStudents ?? []).slice(0, 8).map((s: any) => (
            <div key={s.id} className="flex items-center gap-4 px-5 py-3">
              <div className="w-9 h-9 rounded-full bg-brand-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {s.name?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{s.name}</p>
                <p className="text-xs text-dark-muted">{s.email}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-dark-muted">{new Date(s.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-green-400">{s._count?.enrollments ?? 0} enrolled</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
