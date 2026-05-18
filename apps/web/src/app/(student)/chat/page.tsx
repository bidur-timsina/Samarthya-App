'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { MessageSquare, Send, Search, Bot, Hash } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { io, Socket } from 'socket.io-client';

export default function ChatPage() {
  const { user } = useAuthStore();
  const [activeChannel, setActiveChannel] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'courses' | 'direct'>('all');
  const qc = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const { data: channels } = useQuery({
    queryKey: ['chat', 'channels'],
    queryFn: () => api.get('/chat/channels').then(r => r.data),
  });

  const { data: messages } = useQuery({
    queryKey: ['chat', 'messages', activeChannel],
    queryFn: () => activeChannel ? api.get(`/chat/channels/${activeChannel}/messages`).then(r => r.data) : null,
    enabled: !!activeChannel,
  });

  const sendMutation = useMutation({
    mutationFn: (content: string) => api.post(`/chat/channels/${activeChannel}/messages`, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['chat', 'messages', activeChannel] }); setMessage(''); },
  });

  useEffect(() => {
    socketRef.current = io(`${process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '')}/chat`);
    socketRef.current.on('new-message', () => qc.invalidateQueries({ queryKey: ['chat', 'messages', activeChannel] }));
    return () => { socketRef.current?.disconnect(); };
  }, [activeChannel]);

  useEffect(() => {
    if (activeChannel && socketRef.current) {
      socketRef.current.emit('join-channel', { channelId: activeChannel });
    }
  }, [activeChannel]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const filteredChannels = (channels ?? []).filter((c: any) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (tab === 'courses' && c.type !== 'COURSE') return false;
    if (tab === 'direct' && c.type !== 'DIRECT') return false;
    return true;
  });

  const activeChannelData = (channels ?? []).find((c: any) => c.id === activeChannel);

  return (
    <div className="h-[calc(100vh-120px)] card flex overflow-hidden -m-2">
      {/* Channel list */}
      <div className="w-72 flex-shrink-0 border-r border-gray-200 dark:border-dark-border flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-dark-border">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-muted" />
            <input type="text" placeholder="Search chats..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 py-2 text-sm" />
          </div>
          <div className="flex gap-1">
            {(['all', 'courses', 'direct'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} className={cn('flex-1 py-1 text-xs rounded-lg font-medium capitalize transition-all', tab === t ? 'bg-brand-900 text-white' : 'text-dark-muted hover:text-gray-900 dark:hover:text-white')}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* AI Assistant pinned */}
          <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-brand-900/10 hover:bg-brand-900/20 transition-all text-left mb-2">
            <div className="w-9 h-9 rounded-xl bg-brand-900 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">AI Assistant</p>
              <p className="text-xs text-dark-muted truncate">Ask questions, review exams...</p>
            </div>
          </button>

          {filteredChannels.map((channel: any) => (
            <button key={channel.id} onClick={() => setActiveChannel(channel.id)} className={cn('w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left', activeChannel === channel.id ? 'bg-brand-900/10' : 'hover:bg-gray-100 dark:hover:bg-dark-surface')}>
              <div className="w-9 h-9 rounded-xl bg-dark-surface flex items-center justify-center flex-shrink-0">
                <Hash className="w-4 h-4 text-dark-muted" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{channel.name}</p>
                {channel.messages?.[0] ? (
                  <p className="text-xs text-dark-muted truncate">{channel.messages[0].sender?.name}: {channel.messages[0].content}</p>
                ) : (
                  <p className="text-xs text-dark-muted">No messages yet</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Message area */}
      {activeChannel ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-dark-surface flex items-center justify-center">
              <Hash className="w-4 h-4 text-dark-muted" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{activeChannelData?.name}</p>
              <p className="text-xs text-dark-muted capitalize">{activeChannelData?.type?.toLowerCase()} channel</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {(messages ?? []).slice().reverse().map((msg: any) => (
              <div key={msg.id} className={cn('flex gap-3', msg.sender?.id === user?.id && 'flex-row-reverse')}>
                <div className="w-8 h-8 rounded-full bg-brand-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {msg.sender?.name?.[0]}
                </div>
                <div className={cn('max-w-xs', msg.sender?.id === user?.id && 'items-end flex flex-col')}>
                  <div className={cn('px-4 py-2.5 rounded-2xl text-sm', msg.sender?.id === user?.id ? 'bg-brand-900 text-white rounded-tr-sm' : 'bg-gray-100 dark:bg-dark-surface text-gray-900 dark:text-white rounded-tl-sm')}>
                    {msg.content}
                  </div>
                  <p className="text-[10px] text-dark-muted mt-1 px-1">{msg.sender?.name} · {formatRelativeTime(msg.createdAt)}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 dark:border-dark-border">
            <form onSubmit={e => { e.preventDefault(); if (message.trim()) sendMutation.mutate(message); }} className="flex gap-3">
              <input type="text" placeholder="Type a message..." value={message} onChange={e => setMessage(e.target.value)} className="input flex-1" />
              <button type="submit" disabled={!message.trim() || sendMutation.isPending} className="btn-primary px-4 py-2.5">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center p-8">
          <MessageSquare className="w-16 h-16 text-dark-muted opacity-30" />
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">Select a channel</p>
            <p className="text-dark-muted text-sm">Choose a conversation from the left panel</p>
          </div>
        </div>
      )}
    </div>
  );
}
