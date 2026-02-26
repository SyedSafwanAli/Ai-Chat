"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { LeadStatusBadge } from "@/components/ui/badge";
import { Search, MessageSquare, Phone, Send, ChevronDown, Check } from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ConvRow {
  id: number;
  customer_name: string;
  customer_phone: string;
  platform: string;
  lead_status: string;
  last_message: string;
  last_message_at: string;
  is_contacted: number;
}

interface Message {
  id: number;
  conversation_id: number;
  sender: "customer" | "bot";
  message: string;
  response_type: string;
  created_at: string;
}

function getInitials(name: string) {
  const words = name.trim().split(" ");
  return words.length >= 2
    ? (words[0][0] + words[words.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function formatTime(iso: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(iso: string) {
  if (!iso) return "";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff} min ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} day ago`;
}

const STATUS_OPTIONS = [
  { value: "hot",  label: "Hot",  color: "text-rose-600 bg-rose-50 hover:bg-rose-100" },
  { value: "warm", label: "Warm", color: "text-amber-600 bg-amber-50 hover:bg-amber-100" },
  { value: "cold", label: "Cold", color: "text-gray-600 bg-gray-50 hover:bg-gray-100" },
];

export default function ConversationsPage() {
  const searchParams = useSearchParams();
  const initialId    = searchParams.get("id") ? parseInt(searchParams.get("id")!, 10) : null;

  const [rows,           setRows]           = useState<ConvRow[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [search,         setSearch]         = useState("");
  const [statusFilter,   setStatusFilter]   = useState("All");
  const [selected,       setSelected]       = useState<number | null>(initialId);
  const [messages,       setMessages]       = useState<Message[]>([]);
  const [msgLoading,     setMsgLoading]     = useState(false);
  const [replyText,      setReplyText]      = useState("");
  const [sending,        setSending]        = useState(false);
  const [statusOpen,     setStatusOpen]     = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const chatRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation list
  useEffect(() => {
    api.get<{ conversations: ConvRow[] }>("/conversations?limit=50")
      .then((data) => {
        setRows(data.conversations);
        if (!initialId && data.conversations.length) setSelected(data.conversations[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [initialId]);

  // Load messages when selected conversation changes
  const loadMessages = useCallback((id: number) => {
    setMsgLoading(true);
    setMessages([]);
    api.get<{ conversation: ConvRow & { messages: Message[] } }>(`/conversations/${id}`)
      .then((data) => setMessages(data.conversation.messages ?? []))
      .catch(() => {})
      .finally(() => setMsgLoading(false));
  }, []);

  useEffect(() => {
    if (selected) loadMessages(selected);
  }, [selected, loadMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const filtered = rows.filter((c) => {
    const matchesSearch =
      c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.last_message || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || capitalize(c.lead_status) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedConv = rows.find((c) => c.id === selected);

  const handleSend = async () => {
    if (!replyText.trim() || !selected || sending) return;
    const text = replyText.trim();
    setSending(true);
    setReplyText("");
    try {
      await api.post(`/conversations/${selected}/reply`, { message: text });
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          conversation_id: selected,
          sender: "bot",
          message: text,
          response_type: "manual",
          created_at: new Date().toISOString(),
        },
      ]);
      setRows((prev) =>
        prev.map((r) =>
          r.id === selected ? { ...r, last_message: text, last_message_at: new Date().toISOString() } : r
        )
      );
    } catch {
      setReplyText(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selected || updatingStatus) return;
    setStatusOpen(false);
    setUpdatingStatus(true);
    try {
      await api.patch(`/conversations/${selected}/status`, { lead_status: newStatus });
      setRows((prev) =>
        prev.map((r) => r.id === selected ? { ...r, lead_status: newStatus } : r)
      );
    } catch {
      // state not updated on failure — visually reverts
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <MainLayout pageTitle="Conversations" pageDescription="All WhatsApp conversations">
      <div className="flex gap-4 h-[calc(100vh-120px)]">

        {/* ── Left: list ── */}
        <div className="w-80 flex-shrink-0 flex flex-col rounded-xl border border-gray-200 bg-white shadow-card overflow-hidden">
          <div className="p-3 border-b border-gray-100 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="flex gap-1.5">
              {["All", "Hot", "Warm", "Cold"].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "flex-1 rounded-lg py-1 text-xs font-medium transition-colors",
                    statusFilter === f
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center">
                <MessageSquare className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-xs text-gray-400">No conversations found</p>
              </div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv.id)}
                  className={cn(
                    "w-full text-left p-3.5 hover:bg-gray-50 transition-colors",
                    selected === conv.id && "bg-blue-50 border-l-2 border-l-blue-600"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                      <span className="text-xs font-semibold text-blue-700">
                        {getInitials(conv.customer_name)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-gray-900 truncate">{conv.customer_name}</p>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(conv.last_message_at)}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 truncate mb-1">{conv.last_message}</p>
                      <LeadStatusBadge status={capitalize(conv.lead_status) as "Hot" | "Warm" | "Cold"} />
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ── Right: chat detail ── */}
        {selectedConv ? (
          <div className="flex-1 flex flex-col rounded-xl border border-gray-200 bg-white shadow-card overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                  <span className="text-sm font-semibold text-blue-700">
                    {getInitials(selectedConv.customer_name)}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{selectedConv.customer_name}</p>
                    <LeadStatusBadge status={capitalize(selectedConv.lead_status) as "Hot" | "Warm" | "Cold"} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedConv.customer_phone} · WhatsApp</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedConv.customer_phone}`}
                  className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-100 transition-colors"
                  title="Call"
                >
                  <Phone className="h-4 w-4" />
                </a>

                {/* Set Lead Status dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setStatusOpen((o) => !o)}
                    disabled={updatingStatus}
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
                  >
                    {updatingStatus ? "Saving…" : "Set Status"}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {statusOpen && (
                    <div className="absolute right-0 top-full mt-1 w-36 rounded-xl border border-gray-200 bg-white shadow-lg z-20 overflow-hidden">
                      {STATUS_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => handleStatusChange(opt.value)}
                          className={cn(
                            "flex w-full items-center justify-between px-3 py-2.5 text-xs font-semibold transition-colors",
                            opt.color
                          )}
                        >
                          {opt.label}
                          {selectedConv.lead_status === opt.value && <Check className="h-3 w-3" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages area */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50/40">
              {msgLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                  <MessageSquare className="h-10 w-10 text-gray-200 mb-3" />
                  <p className="text-sm font-medium text-gray-400">No messages yet</p>
                  <p className="text-xs text-gray-300 mt-1">Messages will appear here once the customer sends one</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isCustomer = msg.sender === "customer";
                  return (
                    <div key={msg.id} className={cn("flex gap-3", !isCustomer && "justify-end")}>
                      {isCustomer && (
                        <div className="h-7 w-7 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-blue-700">
                            {getInitials(selectedConv.customer_name)}
                          </span>
                        </div>
                      )}
                      <div className={cn("max-w-[70%]", !isCustomer && "items-end flex flex-col")}>
                        <div className={cn(
                          "rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed",
                          isCustomer
                            ? "bg-white border border-gray-200 rounded-tl-sm text-gray-800"
                            : "bg-blue-600 rounded-tr-sm text-white"
                        )}>
                          {msg.message}
                        </div>
                        <div className={cn("mt-1 flex items-center gap-1.5", !isCustomer && "justify-end")}>
                          <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                          {!isCustomer && (
                            <span className={cn(
                              "rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
                              msg.response_type === "manual"
                                ? "bg-violet-50 text-violet-600"
                                : "bg-blue-50 text-blue-600"
                            )}>
                              {msg.response_type === "manual" ? "Manual" : "AI"}
                            </span>
                          )}
                        </div>
                      </div>
                      {!isCustomer && (
                        <div className={cn(
                          "h-7 w-7 flex-shrink-0 rounded-full flex items-center justify-center",
                          msg.response_type === "manual" ? "bg-violet-600" : "bg-blue-600"
                        )}>
                          <span className="text-[10px] font-semibold text-white">
                            {msg.response_type === "manual" ? "ME" : "AI"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Reply input */}
            <div className="border-t border-gray-100 p-4 bg-white">
              <div className="flex items-center gap-3">
                <input
                  ref={inputRef}
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a manual reply… (Enter to send)"
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  onClick={handleSend}
                  disabled={!replyText.trim() || sending}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                <p className="text-[10px] text-gray-400">
                  AI Auto-Reply is active · Manual replies tagged as <span className="text-violet-500 font-medium">Manual</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center rounded-xl border border-gray-200 bg-white">
            <div className="text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-gray-300 mb-3" />
              <p className="text-sm text-gray-400">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop to close status dropdown */}
      {statusOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setStatusOpen(false)} />
      )}
    </MainLayout>
  );
}
