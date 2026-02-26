"use client";

import { useState } from "react";
import { Search, Filter, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import type { Conversation } from "@/lib/types";
import { LeadStatusBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 6;

export function ConversationsTable({ conversations }: { conversations: Conversation[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [page, setPage] = useState(1);

  const filtered = conversations.filter((c) => {
    const matchesSearch =
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || c.leadStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-card">
      {/* Table Header */}
      <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Recent Conversations</h3>
          <p className="text-xs text-gray-400 mt-0.5">{filtered.length} total conversations</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={cn(
                "rounded-lg border border-gray-200 bg-gray-50 pl-8 pr-3 py-1.5 text-xs",
                "text-gray-900 placeholder:text-gray-400 w-44",
                "focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              )}
            />
          </div>
          {/* Filter */}
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className={cn(
                "rounded-lg border border-gray-200 bg-gray-50 pl-7 pr-6 py-1.5 text-xs",
                "text-gray-600 appearance-none cursor-pointer",
                "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              )}
            >
              <option value="All">All Status</option>
              <option value="Hot">Hot</option>
              <option value="Warm">Warm</option>
              <option value="Cold">Cold</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Customer
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Last Message
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                Platform
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">No conversations found</p>
                </td>
              </tr>
            ) : (
              paginated.map((conv) => (
                <tr
                  key={conv.id}
                  className="group hover:bg-blue-50/30 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-700">
                          {conv.initials}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{conv.customerName}</p>
                        <p className="text-[10px] text-gray-400">{conv.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-gray-600 max-w-[220px] truncate">{conv.lastMessage}</p>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-gray-500">{conv.platform}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <LeadStatusBadge status={conv.leadStatus} />
                  </td>
                  <td className="px-4 py-3.5 hidden sm:table-cell">
                    <span className="text-xs text-gray-400">{conv.time}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3">
        <p className="text-xs text-gray-400">
          Showing {Math.min((page - 1) * ITEMS_PER_PAGE + 1, filtered.length)}–
          {Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                "h-7 w-7 rounded-lg text-xs font-medium transition-colors",
                p === page
                  ? "bg-blue-600 text-white"
                  : "text-gray-500 hover:bg-gray-100"
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
