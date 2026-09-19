"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronsLeft, ChevronsRight, LogOut } from "lucide-react";
import { Link, usePathname } from "@/src/i18n/routing";
import { cn } from "@/src/utlis/cn";
import { fullName, initials } from "@/src/utlis/admin/format";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { usePermissions } from "../access/usePermissions";
import { ADMIN_NAV, isNavItemActive } from "./nav";
import { adminPaths } from "@/src/utlis/admin/paths";

interface SidebarContentProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onLogout: () => void;
  onNavigate?: () => void;
}

export default function SidebarContent({
  collapsed = false,
  onToggleCollapsed,
  onLogout,
  onNavigate,
}: SidebarContentProps) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const { user, allows } = usePermissions();

  const groups = ADMIN_NAV.map((group) => ({
    ...group,
    items: group.items.filter((item) => allows(item.requires)),
  })).filter((group) => group.items.length > 0);

  const roleLabel = user?.isAdmin
    ? t("shell.superAdmin")
    : user?.roles?.length
      ? user.roles.map((r) => r.name).join(", ")
      : t("shell.noRoles");

  return (
    <div className="flex h-full flex-col bg-brand-green-dark text-brand-cream">
      {/* Brand */}
      <div
        className={cn(
          "flex shrink-0 items-center border-b border-white/10",
          collapsed ? "justify-center px-2 py-4" : "gap-3 px-5 py-4"
        )}
      >
        <Link
          href={adminPaths.dashboard}
          onClick={onNavigate}
          className={cn(
            "flex items-center justify-center rounded-2xl bg-brand-cream shadow-sm transition-opacity hover:opacity-90",
            collapsed ? "h-11 w-11" : "h-14 px-3"
          )}
          aria-label={t("shell.brand")}
        >
          {collapsed ? (
            <Image
              src="/favicon-32x32.png"
              alt=""
              width={24}
              height={24}
              className="h-6 w-6"
            />
          ) : (
            <Image
              src="/images/Logo.png"
              alt={t("shell.brand")}
              width={220}
              height={78}
              className="h-11 w-auto"
              priority
            />
          )}
        </Link>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
              {t("shell.subtitle")}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto py-4",
          collapsed ? "px-2" : "px-3"
        )}
        aria-label={t("shell.navigation")}
      >
        {groups.map((group) => (
          <div key={group.key} className="mb-5 last:mb-0">
            {!collapsed ? (
              <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-brand-yellow/80">
                {t(`nav.groups.${group.key}`)}
              </p>
            ) : (
              <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isNavItemActive(item, pathname);
                const label = t(`nav.${item.key}`);
                const link = (
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-yellow",
                      collapsed
                        ? "h-11 w-11 justify-center mx-auto"
                        : "gap-3 px-3 py-2.5",
                      active
                        ? "bg-white/10 text-white"
                        : "text-brand-cream/75 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {active && (
                      <span className="absolute inset-y-2 start-0 w-1 rounded-e-full bg-brand-yellow" />
                    )}
                    <Icon
                      className={cn(
                        "h-[18px] w-[18px] shrink-0",
                        active ? "text-brand-yellow" : "text-brand-cream/60 group-hover:text-brand-cream"
                      )}
                    />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
                return (
                  <li key={item.key}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User + actions */}
      <div className="shrink-0 border-t border-white/10 p-3">
        {!collapsed && user && (
          <Link
            href={adminPaths.profile}
            onClick={onNavigate}
            className="mb-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-sm font-bold text-brand-green-dark">
              {initials(user)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-white">
                {fullName(user)}
              </span>
              <span className="block truncate text-xs text-brand-cream/60">
                {roleLabel}
              </span>
            </span>
          </Link>
        )}
        <div className={cn("flex gap-1", collapsed && "flex-col items-center")}>
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              "flex items-center gap-2 rounded-xl text-sm font-medium text-brand-cream/75 transition-colors hover:bg-red-500/15 hover:text-red-200",
              collapsed ? "h-10 w-10 justify-center" : "flex-1 px-3 py-2"
            )}
            aria-label={t("shell.logout")}
            title={collapsed ? t("shell.logout") : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0 rtl:rotate-180" />
            {!collapsed && <span>{t("shell.logout")}</span>}
          </button>
          {onToggleCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-cream/60 transition-colors hover:bg-white/5 hover:text-white"
              aria-label={collapsed ? t("shell.expand") : t("shell.collapse")}
              title={collapsed ? t("shell.expand") : t("shell.collapse")}
            >
              {collapsed ? (
                <ChevronsRight className="h-4 w-4 rtl:rotate-180" />
              ) : (
                <ChevronsLeft className="h-4 w-4 rtl:rotate-180" />
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
