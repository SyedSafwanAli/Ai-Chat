'use client';

import { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { api } from '@/lib/api';
import {
  Zap, Plus, Pencil, Trash2, X, Search, Copy, Check, RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickReply {
  id: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
}

function ReplyModal({
  initial,
  onClose,
  onDone,
}: {
  initial?: QuickReply;
  onClose: () => void;
  onDone: () => void;
}) {
  const [title,  setTitle]  = useState(initial?.title ?? '');
  const [body,   setBody]   = useState(initial?.body  ?? '');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const submit = async () => {
    if (!title.trim()) { setError('Title is required.'); return; }
    if (!body.trim())  { setError('Message body is required.'); return; }
    setSaving(true); setError('');
    try {
      if (initial) {
        await api.put(`/quick-replies/${initial.id}`, { title: title.trim(), body: body.trim() });
      } else {
        await api.post('/quick-replies', { title: title.trim(), body: body.trim() });
      }
      onDone(); onClose();
    } catch (e: unknown) {
      setError((e as Error).message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">
            {initial ? 'Edit Quick Reply' : 'New Quick Reply'}
          </h3>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Title / Shortcut
              <span className="text-gray-400 font-normal ml-1">(e.g. "Price inquiry")</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Delivery info, Price list, Office hours"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">
              Message Body
              <span className="text-gray-400 font-normal ml-1">(the full reply text)</span>
            </label>
            <textarea
              rows={5}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Type the reply message that will be sent to the customer…"
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
            <p className="text-[11px] text-gray-400 mt-1">{body.length} characters</p>
          </div>
          {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Zap className="h-4 w-4" />
            {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function QuickRepliesPage() {
  const [replies,    setReplies]    = useState<QuickReply[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [showModal,  setShowModal]  = useState(false);
  const [editItem,   setEditItem]   = useState<QuickReply | undefined>();
  const [deleting,   setDeleting]   = useState<number | null>(null);
  const [search,     setSearch]     = useState('');
  const [copied,     setCopied]     = useState<number | null>(null);

  const fetchAll = useCallback(() => {
    setLoading(true);
    api.get<{ replies: QuickReply[] }>('/quick-replies')
      .then(({ replies: r }) => setReplies(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (r: QuickReply) => {
    if (!confirm(`Delete "${r.title}"?`)) return;
    setDeleting(r.id);
    try {
      await api.delete(`/quick-replies/${r.id}`);
      fetchAll();
    } catch (e: unknown) {
      alert((e as Error).message || 'Delete failed.');
    } finally {
      setDeleting(null);
    }
  };

  const handleCopy = (r: QuickReply) => {
    navigator.clipboard.writeText(r.body).then(() => {
      setCopied(r.id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const filtered = replies.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.body.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout pageTitle="Quick Replies" pageDescription="Saved reply templates for fast responses">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Quick Replies</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {replies.length} saved template{replies.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>
          <button
            onClick={() => { setEditItem(undefined); setShowModal(true); }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Reply
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search templates by title or content…"
          className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-300">
          <Zap className="h-14 w-14 mb-4 opacity-40" />
          {replies.length === 0 ? (
            <>
              <p className="text-base font-medium text-gray-400">No quick replies yet</p>
              <p className="text-sm text-gray-300 mt-1">Create templates for common responses to save time.</p>
              <button
                onClick={() => { setEditItem(undefined); setShowModal(true); }}
                className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create First Template
              </button>
            </>
          ) : (
            <>
              <p className="text-base font-medium text-gray-400">No results for "{search}"</p>
              <button onClick={() => setSearch('')} className="mt-3 text-sm text-blue-600 hover:underline">Clear search</button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all p-5 flex flex-col gap-3"
            >
              {/* Title row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-blue-50">
                    <Zap className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-900 truncate">{r.title}</h4>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleCopy(r)}
                    title="Copy message"
                    className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
                  >
                    {copied === r.id ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => { setEditItem(r); setShowModal(true); }}
                    title="Edit"
                    className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(r)}
                    disabled={deleting === r.id}
                    title="Delete"
                    className="rounded-lg border border-red-200 bg-red-50 p-1.5 text-red-400 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Body preview */}
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-3 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                {r.body}
              </p>

              {/* Footer */}
              <p className="text-[11px] text-gray-400">
                Updated {new Date(r.updated_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ReplyModal
          initial={editItem}
          onClose={() => setShowModal(false)}
          onDone={fetchAll}
        />
      )}
    </MainLayout>
  );
}
