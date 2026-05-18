'use client';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Video, Calendar, Clock, User, ChevronRight } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';
import { format, isFuture, isPast } from 'date-fns';

export default function LiveClassesPage() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['live-sessions'],
    queryFn: () => api.get('/live-sessions').then(r => r.data),
  });

  const upcoming = (sessions ?? []).filter((s: any) => !s.startedAt || isFuture(new Date(s.scheduledAt)));
  const live = (sessions ?? []).filter((s: any) => s.startedAt && !s.endedAt);
  const past = (sessions ?? []).filter((s: any) => s.endedAt);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Live now */}
      {live.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Live Now</h2>
          </div>
          <div className="space-y-3">
            {live.map((s: any) => <SessionCard key={s.id} session={s} status="live" />)}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section>
        <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-500" /> Upcoming
        </h2>
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}</div>
        ) : upcoming.length === 0 ? (
          <div className="card p-10 text-center">
            <Video className="w-14 h-14 mx-auto mb-4 text-dark-muted opacity-30" />
            <p className="text-gray-900 dark:text-white font-medium mb-1">No upcoming classes</p>
            <p className="text-dark-muted text-sm">Your instructors haven't scheduled live classes yet. Check back soon!</p>
            <Link href="/explore" className="btn-primary mt-4 inline-block text-sm">Explore Courses</Link>
          </div>
        ) : upcoming.map((s: any) => <SessionCard key={s.id} session={s} status="upcoming" />)}
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Past Classes</h2>
          <div className="space-y-3">
            {past.map((s: any) => <SessionCard key={s.id} session={s} status="past" />)}
          </div>
        </section>
      )}
    </div>
  );
}

function SessionCard({ session, status }: { session: any; status: 'live' | 'upcoming' | 'past' }) {
  return (
    <div className={cn('card p-5 flex items-center gap-4', status === 'live' && 'border-red-500/50 bg-red-500/5')}>
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0',
        status === 'live' ? 'bg-red-500/20' : status === 'upcoming' ? 'bg-brand-900/20' : 'bg-gray-100 dark:bg-dark-bg')}>
        <Video className={cn('w-6 h-6', status === 'live' ? 'text-red-400' : status === 'upcoming' ? 'text-brand-500' : 'text-dark-muted')} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {status === 'live' && <span className="badge bg-red-500 text-white text-[10px] animate-pulse">LIVE</span>}
          <p className="font-semibold text-gray-900 dark:text-white truncate">{session.title}</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-dark-muted">
          <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{session.instructor?.name}</span>
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{format(new Date(session.scheduledAt), 'MMM d, h:mm a')}</span>
          {session.course && <span>📚 {session.course.title}</span>}
        </div>
      </div>

      {status === 'live' && (
        <Link href={`/live-classes/${session.id}`} className="btn-primary text-sm px-4 py-2 flex items-center gap-2 bg-red-600 hover:bg-red-700">
          Join Now <ChevronRight className="w-4 h-4" />
        </Link>
      )}
      {status === 'upcoming' && (
        <span className="text-sm text-dark-muted whitespace-nowrap">{formatRelativeTime(session.scheduledAt)}</span>
      )}
      {status === 'past' && session.recordingUrl && (
        <Link href={session.recordingUrl} target="_blank" className="btn-secondary text-sm px-4 py-2">
          Watch Recording
        </Link>
      )}
    </div>
  );
}
