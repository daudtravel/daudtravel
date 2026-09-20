/**
 * Every back-office URL in one place (without the locale prefix — use the
 * next-intl router/Link from "@/src/i18n/routing", which adds it).
 */
export const adminPaths = {
  dashboard: "/admin",
  login: "/admin/login",
  profile: "/admin/profile",

  users: "/admin/users",
  userNew: "/admin/users/new",
  user: (id: string) => `/admin/users/${encodeURIComponent(id)}`,
  roles: "/admin/roles",
  roleNew: "/admin/roles/new",
  role: (id: string) => `/admin/roles/${encodeURIComponent(id)}`,

  drivers: "/admin/drivers",
  driverNew: "/admin/drivers/new",
  currency: "/admin/currency",
  partners: "/admin/partners",

  websiteTours: "/admin/website/tours",
  websiteTourNew: "/admin/website/tours/new",
  websiteTour: (id: string) =>
    `/admin/website/tours/${encodeURIComponent(id)}`,
  websiteTransfers: "/admin/website/transfers",
  websiteTransferNew: "/admin/website/transfers/new",
  websiteTransfer: (id: string) =>
    `/admin/website/transfers/${encodeURIComponent(id)}`,
  websiteAccommodations: "/admin/website/accommodations",
  websiteAccommodationNew: "/admin/website/accommodations/new",
  websiteAccommodation: (id: string) =>
    `/admin/website/accommodations/${encodeURIComponent(id)}`,
  websitePaymentLinks: "/admin/website/payment-links",
  websitePaymentLinkNew: "/admin/website/payment-links/new",
  websitePaymentLink: (slug: string) =>
    `/admin/website/payment-links/${encodeURIComponent(slug)}`,
  websiteInsuranceSettings: "/admin/website/insurance-settings",
  websiteFaqs: "/admin/website/faqs",
  websiteFaqNew: "/admin/website/faqs/new",
  websiteFaq: (id: string) => `/admin/website/faqs/${encodeURIComponent(id)}`,
  websiteVideos: "/admin/website/videos",
  websiteVideoNew: "/admin/website/videos/new",
  websiteVideo: (id: string) =>
    `/admin/website/videos/${encodeURIComponent(id)}`,

  ordersOverview: "/admin/orders/overview",
  ordersStatuses: "/admin/orders/statuses",
  ordersTours: "/admin/orders/tours",
  ordersTransfers: "/admin/orders/transfers",
  ordersPaymentLinks: "/admin/orders/payment-links",
  ordersInsurance: "/admin/orders/insurance",
  orderInsurance: (id: string) =>
    `/admin/orders/insurance/${encodeURIComponent(id)}`,
} as const;

/**
 * Maps the old query-string admin URLs (`/admin?tours=all`) to the new paths so
 * bookmarks keep working. Returns null when nothing matches.
 */
export function legacyAdminRedirect(
  params: URLSearchParams
): string | null {
  const get = (key: string) => params.get(key);

  const tours = get("tours");
  if (tours !== null) {
    if (tours === "all" || tours === "") return adminPaths.websiteTours;
    if (tours === "createTour") return adminPaths.websiteTourNew;
    return adminPaths.websiteTour(tours);
  }
  const transfers = get("transfers");
  if (transfers !== null) {
    if (transfers === "all" || transfers === "") return adminPaths.websiteTransfers;
    if (transfers === "createTransfer") return adminPaths.websiteTransferNew;
    return adminPaths.websiteTransfer(transfers);
  }
  const drivers = get("drivers");
  if (drivers !== null) {
    return drivers === "createDriver" ? adminPaths.driverNew : adminPaths.drivers;
  }
  const faqs = get("faqs");
  if (faqs !== null) {
    if (faqs === "all" || faqs === "") return adminPaths.websiteFaqs;
    if (faqs === "createFaq") return adminPaths.websiteFaqNew;
    return adminPaths.websiteFaq(faqs);
  }
  const videos = get("videos");
  if (videos !== null) {
    if (videos === "createVideo") return adminPaths.websiteVideoNew;
    if (videos === "all" || videos === "") return adminPaths.websiteVideos;
    return adminPaths.websiteVideo(videos);
  }
  if (get("orders") !== null) return adminPaths.ordersTours;
  if (get("transferOrders") !== null) return adminPaths.ordersTransfers;

  const quick = get("quickPayment");
  if (quick !== null) {
    if (quick === "all" || quick === "") return adminPaths.websitePaymentLinks;
    if (quick === "create") return adminPaths.websitePaymentLinkNew;
    if (quick === "orders") return adminPaths.ordersPaymentLinks;
    return adminPaths.websitePaymentLink(quick);
  }
  const insurance = get("insurance");
  if (insurance !== null) {
    if (insurance === "all" || insurance === "") return adminPaths.ordersInsurance;
    if (insurance === "settings") return adminPaths.websiteInsuranceSettings;
    return adminPaths.orderInsurance(insurance);
  }
  const accommodations = get("accommodations");
  if (accommodations !== null) {
    if (accommodations === "all" || accommodations === "")
      return adminPaths.websiteAccommodations;
    if (accommodations === "create") return adminPaths.websiteAccommodationNew;
    return adminPaths.websiteAccommodation(accommodations);
  }
  const stats = get("stats");
  if (stats !== null) {
    return stats === "orders" ? adminPaths.ordersStatuses : adminPaths.ordersOverview;
  }
  return null;
}
