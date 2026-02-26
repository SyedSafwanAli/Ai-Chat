"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Search, Menu, LifeBuoy, ChevronDown, UserCircle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface TopbarProps {
  sidebarCollapsed: boolean;
  onMobileMenuToggle: () => void;
  pageTitle?: string;
  pageDescription?: string;
}

export function Topbar({
  sidebarCollapsed,
  onMobileMenuToggle,
  pageTitle = "Dashboard",
  pageDescription,
}: TopbarProps) {
  const router       = useRouter();
  const { user, logout } = useAuth();

  const [searchQuery,  setSearchQuery]  = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const displayName = user?.role === "super_admin"
    ? "Super Admin"
    : user?.business_name || user?.email?.split("@")[0] || "Business";
  const initials = displayName.slice(0, 2).toUpperCase();

  const roleLabel =
    user?.role === "super_admin" ? "Super Admin" :
    user?.role === "admin"       ? "Admin" :
    "Manager";

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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

        {/* Bell — navigate to leads */}
        <button
          onClick={() => router.push("/leads")}
          className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="View Leads"
        >
          <Bell className="h-5 w-5" />
        </button>

        {/* Help → Support page */}
        <button
          onClick={() => router.push("/support")}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          title="Support"
        >
          <LifeBuoy className="h-5 w-5" />
        </button>

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
              <button
                onClick={() => { setUserMenuOpen(false); router.push("/support"); }}
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LifeBuoy className="h-3.5 w-3.5 text-gray-400" />
                Support
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
