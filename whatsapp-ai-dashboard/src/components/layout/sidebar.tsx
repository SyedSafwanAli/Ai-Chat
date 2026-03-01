"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Zap,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bot,
  Circle,
  LogOut,
  LifeBuoy,
  UserCircle,
  Building2,
  Package,
  CreditCard,
  ScrollText,
  Megaphone,
  BarChart3,
  Reply,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { label: "Dashboard",          href: "/",                  icon: LayoutDashboard },
  { label: "Conversations",      href: "/conversations",     icon: MessageSquare   },
  { label: "Leads",              href: "/leads",             icon: Users           },
  { label: "AI Usage",           href: "/ai-usage",          icon: Zap             },
  { label: "Bot Overview",       href: "/bot",               icon: Bot             },
  { label: "Quick Replies",      href: "/quick-replies",     icon: Reply           },
  { label: "Reports",            href: "/reports",           icon: BarChart3       },
  { label: "Business Settings",  href: "/business-settings", icon: Settings        },
  { label: "Support",            href: "/support",           icon: LifeBuoy        },
  { label: "Account",            href: "/account",           icon: UserCircle      },
];

const adminNavItems: NavItem[] = [
  { label: "Overview",      href: "/platform",               icon: LayoutDashboard },
  { label: "Businesses",    href: "/platform/businesses",    icon: Building2       },
  { label: "Packages",      href: "/platform/packages",      icon: Package         },
  { label: "Credits",       href: "/platform/credits",       icon: CreditCard      },
  { label: "Audit Logs",    href: "/platform/audit",         icon: ScrollText      },
  { label: "Support",       href: "/platform/support",       icon: LifeBuoy        },
  { label: "Announcements", href: "/platform/announcements", icon: Megaphone       },
  { label: "Analytics",     href: "/platform/analytics",     icon: BarChart3       },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Derive initials from email (e.g. "admin@example.com" → "AD")
  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen flex flex-col",
        "bg-white border-r border-gray-200",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-[64px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-16 border-b border-gray-200 flex-shrink-0",
          collapsed ? "justify-center px-0" : "px-5 gap-3"
        )}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600">
          <Bot className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">WA AI</p>
            <p className="text-[10px] text-gray-400 truncate">Automation Suite</p>
          </div>
        )}
      </div>

      {/* WhatsApp Status — only for business users */}
      {user?.role !== 'super_admin' && !collapsed && (
        <div className="mx-4 mt-3 mb-1 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
          <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500 flex-shrink-0" />
          <span className="text-xs font-medium text-emerald-700">WhatsApp Connected</span>
        </div>
      )}
      {user?.role !== 'super_admin' && collapsed && (
        <div className="flex justify-center mt-3 mb-1">
          <div className="h-2 w-2 rounded-full bg-emerald-500" title="WhatsApp Connected" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">

        {/* Main Menu — business users only */}
        {user?.role !== 'super_admin' && (
          <>
            {!collapsed && (
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Main Menu
              </p>
            )}
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg transition-all duration-150",
                    "group relative",
                    collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      collapsed ? "h-5 w-5" : "h-4 w-4",
                      isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-3 hidden group-hover:flex items-center">
                      <div className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg whitespace-nowrap">
                        {item.label}
                      </div>
                      <div className="absolute right-full border-4 border-transparent border-r-gray-900" />
                    </div>
                  )}
                </Link>
              );
            })}
          </>
        )}

        {/* Platform Admin — super_admin only */}
        {user?.role === 'super_admin' && (
          <>
            {!collapsed && (
              <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                Platform Admin
              </p>
            )}
            {adminNavItems.map((item) => {
              const isActive =
                item.href === '/platform'
                  ? pathname === '/platform'
                  : pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center rounded-lg transition-all duration-150",
                    "group relative",
                    collapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
                    isActive
                      ? "bg-violet-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={cn(
                      "flex-shrink-0 transition-colors",
                      collapsed ? "h-5 w-5" : "h-4 w-4",
                      isActive ? "text-white" : "text-gray-500 group-hover:text-violet-600"
                    )}
                  />
                  {!collapsed && (
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-3 hidden group-hover:flex items-center">
                      <div className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg whitespace-nowrap">
                        {item.label}
                      </div>
                      <div className="absolute right-full border-4 border-transparent border-r-gray-900" />
                    </div>
                  )}
                </Link>
              );
            })}
          </>
        )}

      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200 p-3 space-y-2">
        {/* User profile */}
        <div
          className={cn(
            "flex items-center rounded-lg px-2 py-2",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <div className="h-7 w-7 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-700">{initials}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate capitalize">{user?.role ?? 'Admin'}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email ?? ''}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className={cn(
            "flex w-full items-center rounded-lg border border-gray-200",
            "py-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200",
            "transition-colors duration-150 group relative",
            collapsed ? "justify-center" : "gap-2 px-3"
          )}
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span className="text-xs font-medium">Logout</span>}
          {collapsed && (
            <div className="absolute left-full ml-3 hidden group-hover:flex items-center">
              <div className="rounded-md bg-gray-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg whitespace-nowrap">
                Logout
              </div>
              <div className="absolute right-full border-4 border-transparent border-r-gray-900" />
            </div>
          )}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className={cn(
            "flex w-full items-center justify-center rounded-lg border border-gray-200",
            "py-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700",
            "transition-colors duration-150"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
