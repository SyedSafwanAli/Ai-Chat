'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Megaphone, Plus, Trash2, X, RefreshCw, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Announcement {
  id: number;
  title: string;
  body: string;
  type: 'info' | 'warning' | 'success';
  created_at: string;
  created_by_email: string;
}

const typeConfig = {
  info:    { label: 'Info',    icon: Info,         badge: 'bg-blue-100 text-blue-700',   border: 'border-l-blue-500',   bg: 'bg-blue-50/50'   },
  warning: { label: 'Warning', icon: AlertTriangle, badge: 'bg-amber-100 text-amber-700', border: 'border-l-amber-500',  bg: 'bg-amber-50/50'  },
  success: { label: 'Success', icon: CheckCircle2,  badge: 'bg-green-100 text-green-700', border: 'border-l-green-500',  bg: 'bg-green-50/50'  },
};

function CreateModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [title,  setTitle]  = useState('');
  const [body,   setBody]   = useState('');
  const [type,   setType]   = useState<'info' | 'warning' | 'success'>('info');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const submit = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!body.trim())  { setError('Message body is required.'); return; }
    setSaving(true); setError('');
    try {
      await api.post('/super-admin/announcements', { title: title.trim(), body: body.trim(), type });
      onDone(); onClose();
    } catch (e: unknown) { setError((e as Error).message || 'Failed to create.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">New Announcement</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors"><X className="h-4 w-4 text-gray-500" /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Scheduled maintenance on Feb 28"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Message</label>
            <textarea rows={4} value={body} onChange={e => setBody(e.target.value)} placeholder="Enter the announcement content here…"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Type</label>
            <div className="flex gap-2">
              {(['info', 'warning', 'success'] as const).map(t => {
                const c = typeConfig[t];
                const Icon = c.icon;
                return (
                  <button key={t} onClick={() => setType(t)}
                    className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-medium transition-colors',
                      type === t ? `${c.badge} border-transparent ring-2 ring-offset-1 ring-current` : 'border-gray-200 text-gray-500 hover:bg-gray-50')}>
                    <Icon className="h-3.5 w-3.5" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={submit} disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-orange-500 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
            <Megaphone className="h-4 w-4" />
            {saving ? 'Posting…' : 'Post Announcement'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AnnouncementsPage() {
  const { user }  = useAuth();
  const router    = useRouter();
  const [items,      setItems]      = useState<Announcement[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting,   setDeleting]   = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'super_admin') { router.replace('/'); return; }
  }, [user, router]);

  const fetchAll = useCallback(() => {
    setLoading(true);
    api.get<{ announcements: Announcement[] }>('/super-admin/announcements')
      .then(({ announcements }) => setItems(announcements))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete announcement "${title}"?`)) return;
    setDeleting(id);
    try {
      await api.delete(`/super-admin/announcements/${id}`);
      fetchAll();
    } catch (e: unknown) { alert((e as Error).message || 'Delete failed.'); }
    finally { setDeleting(null); }
  };

  return (
    <MainLayout pageTitle="Announcements" pageDescription="Post notices to all businesses">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Announcements</h2>
          <p className="text-sm text-gray-500 mt-0.5">System-wide notices for all businesses</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors shadow-sm">
            <Plus className="h-4 w-4" />
            New Announcement
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-300">
          <Megaphone className="h-14 w-14 mb-4 opacity-40" />
          <p className="text-base font-medium text-gray-400">No announcements yet</p>
          <p className="text-sm text-gray-300 mt-1">Create one to notify all businesses on the platform.</p>
          <button onClick={() => setShowCreate(true)}
            className="mt-5 flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
            <Plus className="h-4 w-4" />
            Create First Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const c = typeConfig[item.type] ?? typeConfig.info;
            const Icon = c.icon;
            return (
              <div key={item.id} className={cn('rounded-2xl border-l-4 border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all p-5', c.border, c.bg)}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn('rounded-xl p-2 flex-shrink-0', c.badge)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', c.badge)}>
                          {c.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{item.body}</p>
                      <p className="text-[11px] text-gray-400 mt-2">
                        Posted by {item.created_by_email} · {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(item.id, item.title)} disabled={deleting === item.id}
                    className="flex-shrink-0 rounded-xl border border-red-200 bg-red-50 p-2 text-red-500 hover:bg-red-100 disabled:opacity-50 transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onDone={fetchAll} />}
    </MainLayout>
  );
}
