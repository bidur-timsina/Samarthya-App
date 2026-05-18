'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useState } from 'react';
import { Flame, Star, Trophy, Target, Zap, Clock, CheckCircle, Medal } from 'lucide-react';
import { cn, getLevelName } from '@/lib/utils';

const TABS = ['Goals', 'Leaderboard', 'Badges'] as const;
type Tab = typeof TABS[number];

export default function GoalsPage() {
  const [tab, setTab] = useState<Tab>('Goals');

  const { data, isLoading } = useQuery({
    queryKey: ['goals', 'my'],
    queryFn: () => api.get('/goals/my').then(r => r.data),
  });

  const xp = data?.xp;
  const goals = data?.goals ?? [];
  const badges = data?.badges ?? [];
  const leaderboard = data?.leaderboard ?? [];

  if (isLoading) return <GoalsSkeleton />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* XP Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-brand rounded-2xl p-6 text-white">
          <p className="text-white/70 text-sm mb-1">Current Level</p>
          <h2 className="text-3xl font-bold">Level {xp?.level ?? 1}</h2>
          <p className="text-white/80 text-sm">{getLevelName(xp?.level ?? 1)}</p>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-white/70 mb-1">
              <span>{xp?.progress ?? 0} XP</span>
              <span>{xp?.nextLevel ?? 100} XP needed</span>
            </div>
            <div className="h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${Math.min(((xp?.progress ?? 0) / (xp?.nextLevel ?? 100)) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Flame, label: 'Day Streak', value: xp?.streak ?? 0, color: 'text-orange-400', bg: 'bg-orange-500/10' },
            { icon: Zap, label: 'Total XP', value: xp?.totalXP ?? 0, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { icon: Trophy, label: 'Badges', value: badges.length, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { icon: Target, label: 'Goals', value: goals.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="card p-4 flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', bg)}>
                <Icon className={cn('w-5 h-5', color)} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-xs text-dark-muted">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Challenge */}
      <div className="card p-5 border-l-4 border-l-amber-500">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-6 h-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Daily Practice</h3>
              <span className="badge bg-amber-500/20 text-amber-400">+50 XP</span>
            </div>
            <p className="text-sm text-dark-muted">Complete 5 practice questions today to earn bonus XP</p>
          </div>
          <button className="btn-primary text-sm px-4 py-2 whitespace-nowrap">Start Now</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-dark-surface rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-5 py-2 rounded-lg text-sm font-medium transition-all', tab === t ? 'bg-white dark:bg-dark-card text-gray-900 dark:text-white shadow-sm' : 'text-dark-muted hover:text-gray-900 dark:hover:text-white')}>
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'Goals' && (
        <div className="space-y-3">
          {goals.length === 0 ? (
            <div className="card p-8 text-center">
              <Target className="w-12 h-12 mx-auto mb-3 text-dark-muted opacity-30" />
              <p className="text-dark-muted">No goals yet. Set your first learning goal!</p>
              <button className="btn-primary mt-4">Create Goal</button>
            </div>
          ) : goals.map((goal: any) => (
            <div key={goal.id} className="card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-900/20 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-brand-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{goal.title}</p>
                <div className="mt-1.5 h-1.5 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                  <div className="h-full bg-brand-700 rounded-full" style={{ width: `${Math.min((goal.currentXP / goal.targetXP) * 100, 100)}%` }} />
                </div>
                <p className="text-xs text-dark-muted mt-1">{goal.currentXP} / {goal.targetXP} XP</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Leaderboard' && (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-dark-border">
            {leaderboard.map((entry: any) => (
              <div key={entry.user.id} className={cn('flex items-center gap-4 p-4', entry.rank <= 3 && 'bg-amber-500/5')}>
                <span className={cn('w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
                  entry.rank === 1 ? 'bg-amber-400 text-amber-900' :
                  entry.rank === 2 ? 'bg-gray-300 text-gray-700' :
                  entry.rank === 3 ? 'bg-amber-700 text-amber-100' : 'bg-dark-surface text-dark-muted')}>
                  {entry.rank}
                </span>
                <div className="w-9 h-9 rounded-full bg-brand-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {entry.user.name[0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">{entry.user.name}</p>
                  <p className="text-xs text-dark-muted">Level {entry.level} — {getLevelName(entry.level)}</p>
                </div>
                <span className="font-bold text-amber-400">{entry.totalXP.toLocaleString()} XP</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Badges' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {badges.length === 0 ? (
            <div className="col-span-full card p-8 text-center">
              <Medal className="w-12 h-12 mx-auto mb-3 text-dark-muted opacity-30" />
              <p className="text-dark-muted">No badges yet. Keep learning to earn them!</p>
            </div>
          ) : badges.map((badge: any) => (
            <div key={badge.id} className="card p-5 text-center hover:border-brand-900/50 transition-all">
              <div className="text-4xl mb-3">{badge.icon}</div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{badge.name}</p>
              <p className="text-xs text-dark-muted mt-1">{badge.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function GoalsSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
      <div className="grid grid-cols-2 gap-4">
        <div className="h-48 bg-dark-card rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-[88px] bg-dark-card rounded-2xl" />)}</div>
      </div>
    </div>
  );
}
