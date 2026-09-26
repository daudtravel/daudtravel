"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, ExternalLink, LogOut, Menu, UserRound } from "lucide-react";
import { Link, usePathname } from "@/src/i18n/routing";
import LocaleSwitcher from "@/src/i18n/LocaleSwitcher";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import { fullName, initials } from "@/src/utlis/admin/format";
import { adminPaths } from "@/src/utlis/admin/paths";
import { usePermissions } from "../access/usePermissions";
import { ADMIN_NAV, findActiveNavItem } from "./nav";

export default function Topbar({
  onOpenMenu,
  onLogout,
}: {
  onOpenMenu: () => void;
  onLogout: () => void;
}) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const { user } = usePermissions();

  const active = findActiveNavItem(pathname);
  const group = active
    ? ADMIN_NAV.find((g) => g.items.includes(active))
    : null;
  const sectionLabel =
    pathname === adminPaths.profile
      ? t("nav.profile")
      : active
        ? t(`nav.${active.key}`)
        : null;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-gray-100 bg-white/95 px-4 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80 lg:px-8 print:hidden">
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-green transition-colors hover:bg-brand-green-50 lg:hidden"
        aria-label={t("shell.openMenu")}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        {group && group.key !== "overview" && (
          <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            {t(`nav.groups.${group.key}`)}
          </p>
        )}
        {sectionLabel && (
          <p className="truncate text-base font-bold text-brand-green">
            {sectionLabel}
          </p>
        )}
      </div>

      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden items-center gap-1.5 rounded-full border border-brand-green-100 px-3 py-1.5 text-sm font-medium text-brand-green transition-colors hover:bg-brand-green-50 sm:flex"
      >
        <ExternalLink className="h-4 w-4" />
        {t("shell.viewWebsite")}
      </a>

      <LocaleSwitcher />

      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-full py-1 pe-2 ps-1 transition-colors hover:bg-brand-green-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green"
              aria-label={t("shell.accountMenu")}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green text-xs font-bold text-brand-cream">
                {initials(user)}
              </span>
              <span className="hidden max-w-[10rem] truncate text-sm font-semibold text-gray-700 md:block">
                {user.firstName}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="font-normal">
              <p className="truncate text-sm font-semibold text-gray-900">
                {fullName(user)}
              </p>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={adminPaths.profile}>
                <UserRound />
                {t("shell.profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="sm:hidden">
              <a href="/" target="_blank" rel="noopener noreferrer">
                <ExternalLink />
                {t("shell.viewWebsite")}
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onLogout}
              className="text-red-600 focus:bg-red-50 focus:text-red-700"
            >
              <LogOut className="rtl:rotate-180" />
              {t("shell.logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  );
}
