"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout/main-layout";
import { LeadStatusBadge } from "@/components/ui/badge";
import {
  Search, Filter, Users, Phone, MessageSquare,
  SlidersHorizontal, ArrowUpRight,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface LeadRow {
  id: number;
  customer_name: string;
  customer_phone: string;
  platform: string;
  lead_status: 'hot' | 'warm' | 'cold';
  last_message: string;
  last_message_at: string;
  last_customer_message: string;
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

function timeAgo(iso: string) {
  if (!iso) return "-";
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff} min ago`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} day${Math.floor(h / 24) > 1 ? "s" : ""} ago`;
}

export default function LeadsPage() {
  const router = useRouter();
  const [rows,         setRows]         = useState<LeadRow[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    api.get<{ leads?: LeadRow[]; conversations?: LeadRow[] }>("/leads?limit=100")
      .then((data) => setRows(data.leads ?? data.conversations ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusCounts = {
    All:  rows.length,
    Hot:  rows.filter((l) => l.lead_status === "hot").length,
    Warm: rows.filter((l) => l.lead_status === "warm").length,
    Cold: rows.filter((l) => l.lead_status === "cold").length,
  };

  const filtered = rows.filter((l) => {
    const matchSearch = l.customer_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || capitalize(l.lead_status) === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <MainLayout pageTitle="Leads" pageDescription="Manage and track customer leads">
      {/* Status count cards */}
      <div className="grid gap-4 sm:grid-cols-4 mb-5">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="rounded-xl border border-gray-200 bg-white p-4 shadow-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">
                {status === "All" ? "Total Leads" : `${status} Leads`}
              </span>
              {status !== "All"
                ? <LeadStatusBadge status={status as "Hot" | "Warm" | "Cold"} />
                : <Users className="h-4 w-4 text-gray-400" />
              }
            </div>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-card">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-900">All Leads</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 w-44 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-gray-200 bg-gray-50 pl-7 pr-6 py-1.5 text-xs text-gray-600 appearance-none cursor-pointer focus:border-blue-500 focus:outline-none"
              >
                <option value="All">All Status</option>
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cold">Cold</option>
              </select>
            </div>
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50">
              <SlidersHorizontal className="h-3 w-3" />
              Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Lead</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Message</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Platform</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Last Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((lead) => (
                  <tr key={lead.id} className="hover:bg-blue-50/20 transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center text-xs font-semibold",
                          lead.lead_status === "hot"  ? "bg-rose-100 text-rose-700"
                          : lead.lead_status === "warm" ? "bg-amber-100 text-amber-700"
                          : "bg-gray-100 text-gray-600"
                        )}>
                          {getInitials(lead.customer_name)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{lead.customer_name}</p>
                          <p className="text-[10px] text-gray-400">{lead.customer_phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-600 max-w-[240px] truncate">
                        {lead.last_customer_message || lead.last_message || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <LeadStatusBadge status={capitalize(lead.lead_status) as "Hot" | "Warm" | "Cold"} />
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        <span className="text-xs text-gray-500">{capitalize(lead.platform || "whatsapp")}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden xl:table-cell">
                      <span className="text-xs text-gray-400">{timeAgo(lead.last_message_at)}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" title="Call">
                          <Phone className="h-3.5 w-3.5" />
                        </button>
                        <button className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Message">
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => router.push(`/conversations?id=${lead.id}`)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors" title="View Conversation">
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center">
                <Users className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No leads found</p>
              </div>
            )}
          </div>
        )}

        <div className="border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-400">{filtered.length} lead{filtered.length !== 1 ? "s" : ""} shown</p>
        </div>
      </div>
    </MainLayout>
  );
}
