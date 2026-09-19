"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/src/auth/authProvider";
import { usePathname } from "@/src/i18n/routing";
import { ADMIN_FORBIDDEN_EVENT } from "@/src/utlis/axiosInstance";
import { cn } from "@/src/utlis/cn";
import { TooltipProvider } from "@/src/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/src/components/ui/sheet";
import SidebarContent from "./SidebarContent";
import Topbar from "./Topbar";
import FullScreenLoader from "./FullScreenLoader";
import { useAdminMode } from "./useAdminMode";

const COLLAPSED_KEY = "admin.sidebarCollapsed";

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, logout, checkAuth } = useAuth();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const t = useTranslations("admin.shell");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Not signed in → admin login, then back here.
  useEffect(() => {
    if (!isLoading && !user) {
      const next = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      router.replace(`/${locale}/admin/login?next=${next}`);
    }
  }, [isLoading, user, locale, router]);

  useAdminMode();

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(COLLAPSED_KEY) === "1");
    } catch {
      // storage unavailable
    }
  }, []);

  // 403 from any request: tell the user once and reload permissions (they may
  // have been changed by an administrator in the meantime).
  useEffect(() => {
    const onForbidden = () => {
      toast.error(t("forbidden"), { id: "admin-forbidden" });
      void checkAuth();
    };
    window.addEventListener(ADMIN_FORBIDDEN_EVENT, onForbidden);
    return () => window.removeEventListener(ADMIN_FORBIDDEN_EVENT, onForbidden);
  }, [t, checkAuth]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const handleLogout = useCallback(() => {
    queryClient.clear();
    logout(`/${locale}/admin/login`);
  }, [queryClient, logout, locale]);

  if (isLoading || !user) {
    return <FullScreenLoader label={t("loading")} />;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="admin-theme min-h-screen bg-[#F7F4EE] print:bg-white">
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 start-0 z-40 hidden transition-[width] duration-200 lg:block print:hidden",
            collapsed ? "w-[76px]" : "w-[272px]"
          )}
        >
          <SidebarContent
            collapsed={collapsed}
            onToggleCollapsed={toggleCollapsed}
            onLogout={handleLogout}
          />
        </aside>

        {/* Mobile sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side={locale === "ar" ? "right" : "left"}
            aria-describedby={undefined}
            className="w-[290px] max-w-[85vw] border-none p-0 [&>button]:text-brand-cream"
          >
            <SheetTitle className="sr-only">{t("navigation")}</SheetTitle>
            <SidebarContent
              onLogout={handleLogout}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div
          className={cn(
            "flex min-h-screen flex-col transition-[padding] duration-200 print:ps-0",
            collapsed ? "lg:ps-[76px]" : "lg:ps-[272px]"
          )}
        >
          <Topbar
            onOpenMenu={() => setMobileOpen(true)}
            onLogout={handleLogout}
          />
          <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 lg:px-8 lg:py-8 print:max-w-none print:p-0">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
