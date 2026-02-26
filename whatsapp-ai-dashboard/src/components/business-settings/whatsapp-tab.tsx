"use client";

import { useState, useEffect } from "react";
import {
  MessageCircle, CheckCircle2, XCircle, Eye, EyeOff,
  ExternalLink, Loader2, AlertTriangle, Unplug,
} from "lucide-react";
import { api } from "@/lib/api";

interface WhatsAppStatus {
  phone_number_id: string;
  token_set: boolean;
  connected: boolean;
}

export function WhatsAppTab() {
  const [status,      setStatus]      = useState<WhatsAppStatus | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [phoneId,     setPhoneId]     = useState("");
  const [token,       setToken]       = useState("");
  const [showToken,   setShowToken]   = useState(false);
  const [saving,      setSaving]      = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [toast,       setToast]       = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showMsg = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    api.get<{ whatsapp: WhatsAppStatus }>("/whatsapp")
      .then((data) => {
        setStatus(data.whatsapp);
        setPhoneId(data.whatsapp.phone_number_id || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleConnect = async () => {
    if (!phoneId.trim() || !token.trim()) return;
    setSaving(true);
    try {
      await api.put("/whatsapp", { phone_number_id: phoneId.trim(), token: token.trim() });
      setStatus({ phone_number_id: phoneId.trim(), token_set: true, connected: true });
      setToken("");
      showMsg("success", "WhatsApp connected successfully!");
    } catch (err: unknown) {
      showMsg("error", err instanceof Error ? err.message : "Failed to connect WhatsApp.");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect WhatsApp? Your bot will stop responding to messages.")) return;
    setDisconnecting(true);
    try {
      await api.delete("/whatsapp");
      setStatus({ phone_number_id: "", token_set: false, connected: false });
      setPhoneId("");
      showMsg("success", "WhatsApp disconnected.");
    } catch {
      showMsg("error", "Failed to disconnect.");
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium ${
          toast.type === "success"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
            : "bg-rose-50 text-rose-700 border border-rose-200"
        }`}>
          {toast.type === "success"
            ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            : <XCircle className="h-4 w-4 flex-shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Connection status badge */}
      <div className={`flex items-center gap-3 rounded-xl border p-4 ${
        status?.connected
          ? "bg-emerald-50 border-emerald-200"
          : "bg-gray-50 border-gray-200"
      }`}>
        <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${
          status?.connected ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
        }`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold ${status?.connected ? "text-emerald-800" : "text-gray-700"}`}>
            {status?.connected ? "WhatsApp Connected" : "WhatsApp Not Connected"}
          </p>
          <p className={`text-xs mt-0.5 ${status?.connected ? "text-emerald-600" : "text-gray-500"}`}>
            {status?.connected
              ? `Phone Number ID: ${status.phone_number_id}`
              : "Enter your credentials below to connect your WhatsApp Business number."}
          </p>
        </div>
        {status?.connected && (
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
          >
            {disconnecting
              ? <Loader2 className="h-3 w-3 animate-spin" />
              : <Unplug className="h-3 w-3" />}
            Disconnect
          </button>
        )}
      </div>

      {/* Credentials form */}
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-900 mb-1">WhatsApp Business API Credentials</p>
          <p className="text-xs text-gray-500">
            Get these from{" "}
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
            >
              Meta Developer Portal <ExternalLink className="h-3 w-3" />
            </a>
            {" "}→ Your App → WhatsApp → API Setup
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700">
            Phone Number ID <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={phoneId}
            onChange={(e) => setPhoneId(e.target.value)}
            placeholder="e.g. 123456789012345"
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm font-mono text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <p className="text-[10px] text-gray-400">Found under WhatsApp → API Setup → Phone Number ID</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-gray-700">
            Permanent Access Token <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={status?.token_set ? "Leave blank to keep existing token" : "Paste your permanent token here"}
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 pr-10 text-sm font-mono text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[10px] text-gray-400">
            Generate a permanent token from Meta Business Manager. System user token recommended.
          </p>
        </div>

        <button
          onClick={handleConnect}
          disabled={saving || !phoneId.trim() || (!token.trim() && !status?.token_set)}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          {saving ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Connecting…</>
          ) : (
            <><MessageCircle className="h-4 w-4" /> {status?.connected ? "Update Credentials" : "Connect WhatsApp"}</>
          )}
        </button>
      </div>

      {/* Setup guide */}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
        <p className="text-xs font-semibold text-blue-800 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" /> Setup Checklist
        </p>
        <ol className="space-y-1.5 text-xs text-blue-700 list-decimal list-inside">
          <li>Go to <strong>developers.facebook.com</strong> → Create App → Business type</li>
          <li>Add <strong>WhatsApp</strong> product to your app</li>
          <li>Add a phone number and verify it</li>
          <li>Copy the <strong>Phone Number ID</strong> and paste above</li>
          <li>Generate a <strong>Permanent Access Token</strong> via System User in Business Manager</li>
          <li>
            Register webhook URL:{" "}
            <code className="bg-blue-100 px-1 rounded font-mono text-[10px]">
              https://yourdomain.com/api/webhook/whatsapp
            </code>
          </li>
          <li>Set verify token in your <code className="bg-blue-100 px-1 rounded font-mono text-[10px]">.env</code> file: <code className="bg-blue-100 px-1 rounded font-mono text-[10px]">WHATSAPP_VERIFY_TOKEN</code></li>
          <li>Subscribe to <strong>messages</strong> webhook field</li>
        </ol>
      </div>
    </div>
  );
}
