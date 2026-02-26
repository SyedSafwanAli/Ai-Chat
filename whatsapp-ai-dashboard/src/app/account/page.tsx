"use client";

import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/contexts/AuthContext";
import { api, ApiError } from "@/lib/api";
import { User, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

type ToastType = "success" | "error";

interface Toast { type: ToastType; message: string }

export default function AccountPage() {
  const { user } = useAuth();

  const [currentPw,  setCurrentPw]  = useState("");
  const [newPw,      setNewPw]      = useState("");
  const [confirmPw,  setConfirmPw]  = useState("");
  const [showCur,    setShowCur]    = useState(false);
  const [showNew,    setShowNew]    = useState(false);
  const [showCon,    setShowCon]    = useState(false);
  const [saving,     setSaving]     = useState(false);
  const [toast,      setToast]      = useState<Toast | null>(null);

  const showToast = (type: ToastType, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw || !newPw || !confirmPw) return showToast("error", "All fields are required.");
    if (newPw.length < 8) return showToast("error", "New password must be at least 8 characters.");
    if (newPw !== confirmPw) return showToast("error", "New passwords do not match.");
    if (newPw === currentPw) return showToast("error", "New password must be different from current.");

    setSaving(true);
    try {
      await api.put("/auth/password", { currentPassword: currentPw, newPassword: newPw });
      showToast("success", "Password changed successfully!");
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      showToast("error", err instanceof ApiError ? err.message : "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "US";
  const businessName = user?.business_name || "—";
  const roleBadge: Record<string, string> = {
    super_admin: "bg-violet-100 text-violet-700",
    admin:       "bg-blue-100 text-blue-700",
    manager:     "bg-emerald-100 text-emerald-700",
  };

  return (
    <MainLayout pageTitle="Account" pageDescription="View your profile and manage security settings">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Profile card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-white">{initials}</span>
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{businessName}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
              <span className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${roleBadge[user?.role ?? "manager"] ?? "bg-gray-100 text-gray-600"}`}>
                {user?.role?.replace("_", " ") ?? "manager"}
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "Email",    value: user?.email ?? "—",        icon: User  },
              { label: "Role",     value: user?.role?.replace("_", " ") ?? "—", icon: User },
              { label: "Business", value: businessName,               icon: User  },
              { label: "Status",   value: "Active",                  icon: User  },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-lg bg-gray-50 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-800 capitalize">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Change password card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Lock className="h-4 w-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Change Password</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showCur ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button type="button" onClick={() => setShowCur((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCur ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">New Password</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPw.length > 0 && newPw.length < 8 && (
                <p className="mt-1 text-xs text-rose-500">Password must be at least 8 characters</p>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Confirm New Password</label>
              <div className="relative">
                <input
                  type={showCon ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button type="button" onClick={() => setShowCon((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showCon ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPw.length > 0 && newPw !== confirmPw && (
                <p className="mt-1 text-xs text-rose-500">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={saving || !currentPw || !newPw || !confirmPw}
              className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Changing Password…" : "Change Password"}
            </button>
          </form>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg transition-all ${
          toast.type === "success" ? "bg-emerald-600" : "bg-red-600"
        }`}>
          {toast.type === "success"
            ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          {toast.message}
        </div>
      )}
    </MainLayout>
  );
}
