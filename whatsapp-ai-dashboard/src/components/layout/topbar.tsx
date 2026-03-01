"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Search, Menu, ChevronDown, UserCircle, LogOut,
  Users, MessageSquare, Building2, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

interface TopbarProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
  pageTitle?: string;
  pageDescription?: string;
}

interface NotifItem {
  type: string;
  count: number;
  label: string;
  href: string;
}

interface NotifData {
  items: NotifItem[];
  total: number;
}

const NOTIF_ICONS: Record<string, React.ElementType> = {
  hot_leads:           Users,
  unread_support:      MessageSquare,
  pending_businesses:  Building2,
};

export function Topbar({
  sidebarCollapsed,
  onMobileMenuToggle,
  pageTitle = "Dashboard",
  pageDescription,
}: TopbarProps) {
  const router           = useRouter();
  const { user, logout } = useAuth();

  const [searchQuery,  setSearchQuery]  = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [bellOpen,     setBellOpen]     = useState(false);
  const [notifs,       setNotifs]       = useState<NotifData>({ items: [], total: 0 });
  const [notifsLoaded, setNotifsLoaded] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  const displayName = user?.role === "super_admin"
    ? "Super Admin"
    : user?.business_name || user?.email?.split("@")[0] || "Business";
  const initials  = displayName.slice(0, 2).toUpperCase();
  const roleLabel =
    user?.role === "super_admin" ? "Super Admin" :
    user?.role === "admin"       ? "Admin" :
    "Manager";

  // Close user menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close bell on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const fetchNotifs = useCallback(() => {
    api.get<NotifData>('/notifications')
      .then((data) => { setNotifs(data); setNotifsLoaded(true); })
      .catch(() => { setNotifsLoaded(true); });
  }, []);

  // Fetch notifications on mount + every 60 seconds
  useEffect(() => {
    if (!user) return;
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60_000);
    return () => clearInterval(interval);
  }, [user, fetchNotifs]);

  const handleBellToggle = () => {
    setBellOpen((o) => !o);
    if (!bellOpen) fetchNotifs(); // refresh on open
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/conversations?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 z-30 h-16 bg-white border-b border-gray-200",
        "flex items-center justify-between px-4 md:px-6",
        "transition-all duration-300",
        sidebarCollapsed ? "left-[64px]" : "left-[240px]"
      )}
    >
      {/* Left: mobile menu + page title */}
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-900">{pageTitle}</h1>
          {pageDescription && (
            <p className="text-xs text-gray-500 hidden sm:block">{pageDescription}</p>
          )}
        </div>
      </div>

      {/* Center: Search */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-sm mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations… (Enter)"
            className={cn(
              "w-full rounded-lg border border-gray-200 bg-gray-50",
              "pl-9 pr-4 py-2 text-sm text-gray-900 placeholder:text-gray-400",
              "focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20",
              "transition-all duration-150"
            )}
          />
        </div>
      </form>

      {/* Right: actions */}
      <div className="flex items-center gap-1">

        {/* Bell — notification dropdown */}
        <div ref={bellRef} className="relative">
          <button
            onClick={handleBellToggle}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {notifs.total > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {notifs.total > 9 ? '9+' : notifs.total}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {bellOpen && (
            <div className="absolute right-0 top-full mt-1 w-72 rounded-xl border border-gray-200 bg-white shadow-xl z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Notifications</p>
                <button onClick={() => setBellOpen(false)} className="rounded-md p-0.5 hover:bg-gray-200 transition-colors">
                  <X className="h-3.5 w-3.5 text-gray-400" />
                </button>
              </div>

              {/* Items */}
              {!notifsLoaded ? (
                <div className="py-6 flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                </div>
              ) : notifs.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-300">
                  <Bell className="h-7 w-7 mb-2 opacity-50" />
                  <p className="text-xs text-gray-400 font-medium">All caught up!</p>
                  <p className="text-[11px] text-gray-300 mt-0.5">No new notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {notifs.items.map((item) => {
                    const Icon = NOTIF_ICONS[item.type] ?? Bell;
                    return (
                      <button
                        key={item.type}
                        onClick={() => { setBellOpen(false); router.push(item.href); }}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-blue-50 transition-colors"
                      >
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
                          <Icon className="h-4 w-4 text-red-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-800 leading-snug">{item.label}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Tap to view →</p>
                        </div>
                        <span className="flex-shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                          {item.count > 9 ? '9+' : item.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Footer */}
              {notifs.items.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2.5">
                  <button
                    onClick={() => { setBellOpen(false); fetchNotifs(); }}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Refresh notifications
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 mx-1" />

        {/* User menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-white">{initials}</span>
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-gray-900 max-w-[120px] truncate">{displayName}</p>
              <p className="text-[10px] text-gray-400">{roleLabel}</p>
            </div>
            <ChevronDown className={cn(
              "h-3.5 w-3.5 text-gray-400 hidden sm:block transition-transform",
              userMenuOpen && "rotate-180"
            )} />
          </button>

          {/* Dropdown */}
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-800 truncate">{displayName}</p>
                <p className="text-[10px] text-gray-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setUserMenuOpen(false); router.push("/account"); }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <UserCircle className="h-3.5 w-3.5 text-gray-400" />
                Account & Password
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => { setUserMenuOpen(false); logout(); }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
