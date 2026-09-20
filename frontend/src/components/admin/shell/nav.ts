import {
  BarChart3,
  BedDouble,
  Coins,
  CreditCard,
  Handshake,
  FileQuestion,
  Film,
  LayoutDashboard,
  Link2,
  ListChecks,
  Map as MapIcon,
  Route,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Truck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { adminPaths } from "@/src/utlis/admin/paths";
import type { AccessRequirement } from "../access/usePermissions";

export interface AdminNavItem {
  /** Translation key under admin.nav */
  key: string;
  href: string;
  icon: LucideIcon;
  requires: AccessRequirement;
  /** Match only the exact path (for the dashboard). */
  exact?: boolean;
}

export interface AdminNavGroup {
  /** Translation key under admin.nav.groups */
  key: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    key: "overview",
    items: [
      {
        key: "dashboard",
        href: adminPaths.dashboard,
        icon: LayoutDashboard,
        requires: "authenticated",
        exact: true,
      },
    ],
  },
  {
    key: "operations",
    items: [
      {
        key: "drivers",
        href: adminPaths.drivers,
        icon: Truck,
        requires: { module: "DRIVERS" },
      },
      {
        key: "partners",
        href: adminPaths.partners,
        icon: Handshake,
        requires: { module: "PARTNERS" },
      },
    ],
  },
  {
    key: "finance",
    items: [
      {
        key: "currency",
        href: adminPaths.currency,
        icon: Coins,
        requires: { module: "CURRENCY" },
      },
    ],
  },
  {
    key: "website",
    items: [
      {
        key: "websiteTours",
        href: adminPaths.websiteTours,
        icon: MapIcon,
        requires: { module: "WEBSITE" },
      },
      {
        key: "websiteTransfers",
        href: adminPaths.websiteTransfers,
        icon: Route,
        requires: { module: "WEBSITE" },
      },
      {
        key: "websiteAccommodations",
        href: adminPaths.websiteAccommodations,
        icon: BedDouble,
        requires: { module: "WEBSITE" },
      },
      {
        key: "paymentLinks",
        href: adminPaths.websitePaymentLinks,
        icon: Link2,
        requires: { module: "WEBSITE" },
      },
      {
        key: "insuranceSettings",
        href: adminPaths.websiteInsuranceSettings,
        icon: ShieldCheck,
        requires: { module: "WEBSITE" },
      },
      {
        key: "faqs",
        href: adminPaths.websiteFaqs,
        icon: FileQuestion,
        requires: { module: "WEBSITE" },
      },
      {
        key: "videos",
        href: adminPaths.websiteVideos,
        icon: Film,
        requires: { module: "WEBSITE" },
      },
    ],
  },
  {
    key: "onlineOrders",
    items: [
      {
        key: "paymentsOverview",
        href: adminPaths.ordersOverview,
        icon: BarChart3,
        requires: { module: "ONLINE_ORDERS" },
      },
      {
        key: "paymentStatuses",
        href: adminPaths.ordersStatuses,
        icon: ListChecks,
        requires: { module: "ONLINE_ORDERS" },
      },
      {
        key: "tourOrders",
        href: adminPaths.ordersTours,
        icon: ShoppingBag,
        requires: { module: "ONLINE_ORDERS" },
      },
      {
        key: "transferOrders",
        href: adminPaths.ordersTransfers,
        icon: Route,
        requires: { module: "ONLINE_ORDERS" },
      },
      {
        key: "paymentLinkOrders",
        href: adminPaths.ordersPaymentLinks,
        icon: CreditCard,
        requires: { module: "ONLINE_ORDERS" },
      },
      {
        key: "insuranceSubmissions",
        href: adminPaths.ordersInsurance,
        icon: Shield,
        requires: { module: "ONLINE_ORDERS" },
      },
    ],
  },
  {
    key: "administration",
    items: [
      {
        key: "users",
        href: adminPaths.users,
        icon: Users,
        requires: "superAdmin",
      },
      {
        key: "roles",
        href: adminPaths.roles,
        icon: UserCog,
        requires: "superAdmin",
      },
    ],
  },
];

/** Strips the locale prefix: `/ka/admin/users` → `/admin/users`. */
export function stripLocale(pathname: string): string {
  const parts = pathname.split("/");
  // ["", "ka", "admin", ...]
  return "/" + parts.slice(2).join("/");
}

export function isNavItemActive(item: AdminNavItem, path: string): boolean {
  const clean = path.replace(/\/+$/, "") || "/";
  if (item.exact) return clean === item.href;
  return clean === item.href || clean.startsWith(item.href + "/");
}

/** The nav item matching the current path (longest match wins). */
export function findActiveNavItem(path: string): AdminNavItem | null {
  let best: AdminNavItem | null = null;
  for (const group of ADMIN_NAV) {
    for (const item of group.items) {
      if (
        isNavItemActive(item, path) &&
        (!best || item.href.length > best.href.length)
      ) {
        best = item;
      }
    }
  }
  return best;
}
