"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Flame, CheckCircle2, MessageSquare, Users } from "lucide-react";
import type { HotLead } from "@/lib/types";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export function HotLeadsPanel({ hotLeads }: { hotLeads: HotLead[] }) {
  const router = useRouter();
  const [contactedIds, setContactedIds] = useState<number[]>(
    hotLeads.filter((l) => l.contacted).map((l) => l.id)
  );
  const [loadingId, setLoadingId] = useState<number | null>(null);

  const markContacted = async (id: number) => {
    const nowContacted = !contactedIds.includes(id);
    setLoadingId(id);
    try {
      await api.patch(`/conversations/${id}/contacted`, { contacted: nowContacted });
      setContactedIds((prev) =>
        nowContacted ? [...prev, id] : prev.filter((i) => i !== id)
      );
    } catch {
      // silently ignore — button reverts visually since state not updated
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-card overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-rose-500" />
          <h3 className="text-sm font-semibold text-gray-900">Hot Leads</h3>
        </div>
        {hotLeads.length > 0 && (
          <span className="rounded-full bg-rose-50 text-rose-600 px-2 py-0.5 text-xs font-semibold">
            {hotLeads.length}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {hotLeads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No hot leads yet</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              High-intent customers will appear here as they interact with your AI
            </p>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {hotLeads.map((lead) => {
              const isContacted = contactedIds.includes(lead.id);
              return (
                <div
                  key={lead.id}
                  className={cn(
                    "rounded-xl p-4 transition-all duration-200",
                    isContacted
                      ? "bg-gray-50"
                      : "bg-rose-50/40 border border-rose-100"
                  )}
                >
                  {/* Lead info */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={cn(
                        "h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center font-semibold text-sm",
                        isContacted
                          ? "bg-gray-200 text-gray-500"
                          : "bg-rose-100 text-rose-700"
                      )}
                    >
                      {lead.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-semibold truncate",
                          isContacted ? "text-gray-400" : "text-gray-900"
                        )}
                      >
                        {lead.name}
                      </p>
                      <span className="text-[10px] text-gray-400">{lead.time}</span>
                    </div>
                  </div>

                  {/* Last message */}
                  {lead.lastMessage && (
                    <div className="flex items-start gap-1.5 mb-3">
                      <MessageSquare className="h-3 w-3 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {lead.lastMessage}
                      </p>
                    </div>
                  )}

                  {/* Action */}
                  <button
                    onClick={() => markContacted(lead.id)}
                    disabled={loadingId === lead.id}
                    className={cn(
                      "w-full flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed",
                      isContacted
                        ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        : "bg-rose-600 text-white hover:bg-rose-700"
                    )}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {loadingId === lead.id ? "Saving…" : isContacted ? "Contacted" : "Mark as Contacted"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100 px-5 py-3">
        <button
          onClick={() => router.push('/leads')}
          className="w-full text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
        >
          View All Leads →
        </button>
      </div>
    </div>
  );
}
