'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { MessageSquare, Send, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SupportThread {
  user_id: number;
  email: string;
  business_name: string;
  last_message: string | null;
  last_sender: string | null;
  last_message_at: string | null;
  unread_count: number;
}

interface SupportMessage {
  id: number;
  user_id: number;
  message: string;
  sender: 'user' | 'admin';
  created_at: string;
}

export default function SupportPage() {
  const { user }  = useAuth();
  const router    = useRouter();

  const [threads,       setThreads]       = useState<SupportThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [activeUserId,  setActiveUserId]  = useState<number | null>(null);
  const [messages,      setMessages]      = useState<SupportMessage[]>([]);
  const [msgsLoading,   setMsgsLoading]   = useState(false);
  const [replyText,     setReplyText]     = useState('');
  const [replySending,  setReplySending]  = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') { router.replace('/'); return; }
  }, [user, router]);

  const fetchThreads = useCallback(() => {
    setThreadsLoading(true);
    api.get<{ threads: SupportThread[] }>('/super-admin/support')
      .then(({ threads: t }) => setThreads(t))
      .catch(() => {})
      .finally(() => setThreadsLoading(false));
  }, []);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const loadMessages = useCallback((userId: number) => {
    setActiveUserId(userId);
    setMsgsLoading(true);
    setMessages([]);
    api.get<{ messages: SupportMessage[] }>(`/super-admin/support/${userId}`)
      .then(({ messages: msgs }) => setMessages(msgs))
      .catch(() => {})
      .finally(() => setMsgsLoading(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleReply = async () => {
    if (!replyText.trim() || !activeUserId || replySending) return;
    setReplySending(true);
    const text = replyText.trim();
    setReplyText('');
    try {
      await api.post(`/super-admin/support/${activeUserId}`, { message: text });
      await loadMessages(activeUserId);
      fetchThreads();
    } catch {
      setReplyText(text);
    } finally {
      setReplySending(false);
    }
  };

  const activeThread = threads.find(t => t.user_id === activeUserId);

  return (
    <MainLayout pageTitle="Support Center" pageDescription="Business support threads">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Support Center</h2>
          <p className="text-sm text-gray-500 mt-0.5">{threads.length} active thread{threads.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={fetchThreads} disabled={threadsLoading}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
          <RefreshCw className={cn('h-4 w-4', threadsLoading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5" style={{ height: 'calc(100vh - 220px)' }}>
        {/* Thread List */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Business Threads</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threadsLoading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              </div>
            ) : threads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-300">
                <MessageSquare className="h-8 w-8 mb-2" />
                <p className="text-xs">No support threads yet.</p>
              </div>
            ) : threads.map((t) => (
              <button key={t.user_id} onClick={() => loadMessages(t.user_id)}
                className={cn(
                  'w-full text-left px-4 py-3.5 border-b border-gray-50 transition-colors',
                  activeUserId === t.user_id ? 'bg-violet-50' : 'hover:bg-gray-50'
                )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{t.business_name}</p>
                    {t.unread_count > 0 && (
                      <span className="flex-shrink-0 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                        {t.unread_count}
                      </span>
                    )}
                  </div>
                  {t.last_message_at && (
                    <span className="text-[10px] text-gray-400 flex-shrink-0">
                      {new Date(t.last_message_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">{t.email}</p>
                {t.last_message && (
                  <p className={cn('text-xs mt-1 truncate', t.unread_count > 0 ? 'font-semibold text-gray-700' : 'text-gray-400')}>
                    {t.last_sender === 'admin' ? 'You: ' : ''}{t.last_message}
                  </p>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Panel */}
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col overflow-hidden">
          {!activeUserId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <MessageSquare className="h-12 w-12 mb-3" />
              <p className="text-sm font-medium text-gray-400">Select a business thread</p>
              <p className="text-xs text-gray-300 mt-1">Click on a thread on the left to view messages</p>
            </div>
          ) : (
            <>
              {/* Thread Header */}
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <p className="text-sm font-semibold text-gray-900">{activeThread?.business_name}</p>
                <p className="text-xs text-gray-500">{activeThread?.email}</p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgsLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-8">No messages yet.</p>
                ) : messages.map((msg) => (
                  <div key={msg.id} className={cn('flex', msg.sender === 'admin' ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[70%] rounded-2xl px-4 py-2.5',
                      msg.sender === 'admin'
                        ? 'rounded-br-sm bg-violet-600 text-white'
                        : 'rounded-bl-sm bg-gray-100 text-gray-800')}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={cn('text-[10px] mt-1', msg.sender === 'admin' ? 'text-violet-200' : 'text-gray-400')}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Reply Box */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex items-end gap-2">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(); } }}
                    placeholder="Type a reply… (Enter to send)"
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                  />
                  <button onClick={handleReply} disabled={!replyText.trim() || replySending}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 transition-colors">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
