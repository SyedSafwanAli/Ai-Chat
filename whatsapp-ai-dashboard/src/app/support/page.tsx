"use client";

import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Send, LifeBuoy, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupportMessage {
  id: number;
  message: string;
  sender: "user" | "admin";
  created_at: string;
}

function formatTime(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString([], {
    month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function SupportPage() {
  const { user } = useAuth();
  const [messages,  setMessages]  = useState<SupportMessage[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [text,      setText]      = useState("");
  const [sending,   setSending]   = useState(false);
  const [toast,     setToast]     = useState<string | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    api.get<{ messages: SupportMessage[] }>("/support")
      .then((data) => setMessages(data.messages ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const msg = text.trim();
    setText("");
    setSending(true);
    try {
      await api.post("/support", { message: msg });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          message: msg,
          sender: "user",
          created_at: new Date().toISOString(),
        },
      ]);
    } catch {
      setText(msg);
      showToast("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const businessName = user?.business_name || user?.email?.split("@")[0] || "Business";

  return (
    <MainLayout pageTitle="Support" pageDescription="Chat with the WA AI support team">
      <div className="max-w-3xl mx-auto">

        {/* Header card */}
        <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50 p-5 mb-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <LifeBuoy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">WA AI Support Team</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Hi <span className="font-medium text-blue-700">{businessName}</span>! Describe your issue and we&apos;ll get back to you shortly.
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">Online</span>
          </div>
        </div>

        {/* Chat window */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-card flex flex-col" style={{ height: "calc(100vh - 300px)", minHeight: "400px" }}>

          {/* Messages */}
          <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/30">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                <LifeBuoy className="h-12 w-12 text-gray-200 mb-3" />
                <p className="text-sm font-medium text-gray-400">No messages yet</p>
                <p className="text-xs text-gray-300 mt-1">Start a conversation — we typically reply within a few hours.</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  return (
                    <div key={msg.id} className={cn("flex gap-3", isUser && "justify-end")}>
                      {!isUser && (
                        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-blue-600 flex items-center justify-center">
                          <LifeBuoy className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div className={cn("max-w-[75%]", isUser && "items-end flex flex-col")}>
                        <div className={cn(
                          "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                          isUser
                            ? "bg-blue-600 text-white rounded-tr-sm"
                            : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
                        )}>
                          {msg.message}
                        </div>
                        <div className={cn("mt-1 flex items-center gap-1", isUser && "justify-end")}>
                          <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                          {isUser && <CheckCheck className="h-3 w-3 text-blue-400" />}
                        </div>
                      </div>
                      {isUser && (
                        <div className="h-8 w-8 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-blue-700">
                            {(user?.email ?? "U").slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-gray-100 p-4 bg-white rounded-b-xl">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your issue or question… (Enter to send)"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-4 w-4" />
                {sending ? "Sending…" : "Send"}
              </button>
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
            {toast}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
