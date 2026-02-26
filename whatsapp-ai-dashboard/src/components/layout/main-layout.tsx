"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageDescription?: string;
}

export function MainLayout({ children, pageTitle, pageDescription }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Route guard — redirect to /login if not authenticated
  // Super admin has no business — redirect them to /platform for all business pages
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
      return;
    }
    if (!isLoading && user?.role === 'super_admin' && !pathname.startsWith('/platform')) {
      router.replace('/platform');
    }
  }, [user, isLoading, router, pathname]);

  // Show spinner while checking auth or before redirect fires
  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((c) => !c)}
      />

      {/* Topbar */}
      <Topbar
        sidebarCollapsed={sidebarCollapsed}
        onMobileMenuToggle={() => setMobileOpen((o) => !o)}
        pageTitle={pageTitle}
        pageDescription={pageDescription}
      />

      {/* Main content */}
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          sidebarCollapsed ? "pl-[64px]" : "pl-[240px]"
        )}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
