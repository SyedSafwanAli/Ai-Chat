'use client';

import { useState } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/lib/api';
import {
  ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, AlertCircle,
  Mail, UserCircle2, Activity, Calendar,
} from 'lucide-react';

type ToastType = 'success' | 'error';
interface Toast { type: ToastType; message: string }

export default function PlatformAccountPage() {
  const { user } = useAuth();

  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCur,   setShowCur]   = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showCon,   setShowCon]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState<Toast | null>(null);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) return showToast('error', 'All fields are required.');
    if (newPw.length < 8)         return showToast('error', 'New password must be at least 8 characters.');
    if (newPw !== confirmPw)      return showToast('error', 'New passwords do not match.');
    if (newPw === currentPw)      return showToast('error', 'New password must be different from current.');

    setSaving(true);
    try {
      await api.put('/auth/password', { currentPassword: currentPw, newPassword: newPw });
      showToast('success', 'Password changed successfully!');
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      showToast('error', err instanceof ApiError ? err.message : 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : 'SA';
  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—';

  const infoRows = [
    { label: 'Email Address', value: user?.email ?? '—',    icon: Mail          },
    { label: 'Role',          value: 'Super Administrator', icon: ShieldCheck   },
    { label: 'Account Status', value: 'Active',             icon: Activity      },
    { label: 'Member Since',  value: joinedDate,            icon: Calendar      },
  ];

  return (
    <MainLayout pageTitle="My Account" pageDescription="Profile info and security settings">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Profile Hero Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Violet gradient banner */}
          <div className="h-24 bg-gradient-to-r from-violet-600 to-violet-400" />

          <div className="px-6 pb-6">
            {/* Avatar overlapping the banner */}
            <div className="-mt-10 mb-4 flex items-end justify-between">
              <div className="h-20 w-20 rounded-2xl bg-violet-700 border-4 border-white shadow-md flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{initials}</span>
              </div>
              <span className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">
                <ShieldCheck className="h-3.5 w-3.5" />
                Super Admin
              </span>
            </div>

            <h2 className="text-base font-bold text-gray-900">Super Admin</h2>
            <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>

            {/* Info grid */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              {infoRows.map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-xl bg-gray-50 px-4 py-3 flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-violet-100">
                    <Icon className="h-3.5 w-3.5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
                    <p className="text-xs font-medium text-gray-800 truncate">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-50">
              <Lock className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
              <p className="text-xs text-gray-400">Keep your account secure</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">

            {/* Current password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCur ? 'text' : 'password'}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm placeholder:text-gray-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
                <button type="button" onClick={() => setShowCur(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm placeholder:text-gray-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPw.length > 0 && newPw.length < 8 && (
                <p className="mt-1 text-xs text-rose-500">At least 8 characters required</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showCon ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 pr-10 text-sm placeholder:text-gray-400 focus:border-violet-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                />
                <button type="button" onClick={() => setShowCon(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCon ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPw.length > 0 && newPw !== confirmPw && (
                <p className="mt-1 text-xs text-rose-500">Passwords do not match</p>
              )}
            </div>

            {/* Strength hint */}
            {newPw.length >= 8 && newPw === confirmPw && (
              <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-100 px-3 py-2.5">
                <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                <p className="text-xs text-green-700 font-medium">Passwords match — ready to save</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !currentPw || !newPw || !confirmPw}
              className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Changing Password…' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Quick Links */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gray-50">
              <UserCircle2 className="h-4 w-4 text-gray-500" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Quick Access</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Platform Overview', href: '/platform',               badge: 'Dashboard' },
              { label: 'Manage Businesses', href: '/platform/businesses',    badge: 'Businesses' },
              { label: 'Analytics',         href: '/platform/analytics',     badge: 'Charts' },
              { label: 'Audit Logs',        href: '/platform/audit',         badge: 'Logs' },
            ].map(({ label, href, badge }) => (
              <a
                key={href}
                href={href}
                className="group flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:border-violet-300 hover:bg-violet-50 transition-colors"
              >
                <span className="text-xs font-medium text-gray-700 group-hover:text-violet-700">{label}</span>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500 group-hover:bg-violet-100 group-hover:text-violet-600">{badge}</span>
              </a>
            ))}
          </div>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-xl z-50 transition-all ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            : <AlertCircle  className="h-4 w-4 flex-shrink-0" />}
          {toast.message}
        </div>
      )}
    </MainLayout>
  );
}
