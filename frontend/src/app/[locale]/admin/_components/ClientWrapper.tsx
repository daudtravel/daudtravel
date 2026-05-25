"use client";

import { useEffect, useState } from "react";
import {
  Menu,
  UserCheck,
  Truck,
  Users,
  X,
  LogOut,
  ShieldQuestion,
  Video,
  ShoppingCart,
  Link,
  Shield,
  ChevronDown,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ToursList } from "./tours/tour-list/ToursList";
import { TransfersList } from "./transfers/transfer-list/TransfersList";
import CreateTour from "./tours/create-tour/CreateTour";
import { EditTour } from "./tours/edit-tour/EditTour";
import CreateTransfer from "./transfers/create-transfer/CreateTransfer";
import { DriversList } from "./drivers/driver-list/DriversList";
import EditTransfer from "./transfers/edit-transfer/EditTransfer";
import CreateDriver from "./drivers/create-driver/CreateDriver";
import { useAuth } from "@/src/auth/authProvider";
import FaqList from "./faq/faq-list/FaqList";
import CreateFaq from "./faq/create-faq/CreateFaq";
import EditFaq from "./faq/edit-faq/EditFaq";
import VideoList from "./video/video-list/VideoList";
import CreateVideo from "./video/create-video/CreateVideo";
import OrdersDashboard from "./orders/ToursOrderList";
import TransferOrdersDashboard from "./orders/TransfersOrderList";
import { QuickLinksList } from "./quick-payment/QuickPaymentList";
import { CreateQuickLink } from "./quick-payment/CreateQuickPaymentLink";
import { QuickPaymentOrders } from "./quick-payment/QuicPaymentOrders";
import { EditQuickLink } from "./quick-payment/EditQuickPaymentLink";
import { InsuranceSubmissionDetails } from "./insurance/InsuranceSumbissionDetails";
import InsuranceSubmissionsList from "./insurance/InsuranceSubmissionList";
import InsuranceSettings from "./insurance/InsuranceSettings";

interface SidebarItem {
  key: string;
  label: string;
  query: string;
}

interface SidebarGroup {
  key: string;
  label: string;
  icon: React.ElementType;
  items: SidebarItem[];
}

const SIDEBAR_GROUPS: SidebarGroup[] = [
  {
    key: "toursGroup",
    label: "ტურები",
    icon: UserCheck,
    items: [
      { key: "tours", label: "ტურები", query: "?tours=all" },
      { key: "orders", label: "შეკვეთები", query: "?orders=all" },
    ],
  },
  {
    key: "transfersGroup",
    label: "ტრანსფერები",
    icon: Truck,
    items: [
      { key: "transfers", label: "ტრანსფერები", query: "?transfers=all" },
      { key: "drivers", label: "მძღოლები", query: "?drivers=all" },
      { key: "transferOrders", label: "შეკვეთები", query: "?transferOrders=all" },
    ],
  },
  {
    key: "servicesGroup",
    label: "სერვისები",
    icon: Link,
    items: [
      { key: "quickPayment", label: "გადახდ. ლინკები", query: "?quickPayment=all" },
      { key: "insurance", label: "დაზღვევა", query: "?insurance=all" },
    ],
  },
  {
    key: "contentGroup",
    label: "კონტენტი",
    icon: ShieldQuestion,
    items: [
      { key: "faqs", label: "F.A.Q", query: "?faqs=all" },
      { key: "videos", label: "ვიდეო", query: "?videos=all" },
    ],
  },
];

export const ClientWrapper = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    new Set(SIDEBAR_GROUPS.map((g) => g.key))
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { logout } = useAuth();

  const tours = searchParams.get("tours");
  const transfers = searchParams.get("transfers");
  const drivers = searchParams.get("drivers");
  const faqs = searchParams.get("faqs");
  const videos = searchParams.get("videos");
  const orders = searchParams.get("orders");
  const transferOrders = searchParams.get("transferOrders");
  const quickPayment = searchParams.get("quickPayment");
  const insurance = searchParams.get("insurance");

  useEffect(() => {
    const hasParams = Array.from(searchParams.keys()).length > 0;
    if (!hasParams) {
      router.push(`${pathname}?tours=all`);
    }
  }, [pathname, searchParams, router]);

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navigate = (query: string) => {
    router.push(`${pathname}${query}`);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const isActive = (key: string) => searchParams.has(key);

  const isGroupActive = (group: SidebarGroup) =>
    group.items.some((item) => isActive(item.key));

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderContent = () => {
    if (tours === "all") return <ToursList />;
    if (tours === "createTour") return <CreateTour />;
    if (tours) return <EditTour />;

    if (transfers === "all") return <TransfersList />;
    if (transfers === "createTransfer") return <CreateTransfer />;
    if (transfers) return <EditTransfer params={{ id: transfers }} />;

    if (drivers === "all") return <DriversList />;
    if (drivers === "createDriver") return <CreateDriver />;

    if (quickPayment === "all") return <QuickLinksList />;
    if (quickPayment === "create") return <CreateQuickLink />;
    if (quickPayment === "orders") return <QuickPaymentOrders />;
    if (quickPayment) return <EditQuickLink />;

    if (insurance === "all") return <InsuranceSubmissionsList />;
    if (insurance === "settings") return <InsuranceSettings />;
    if (insurance) return <InsuranceSubmissionDetails />;

    if (faqs === "all") return <FaqList />;
    if (faqs === "createFaq") return <CreateFaq />;
    if (faqs) return <EditFaq params={{ id: faqs }} />;

    if (videos === "all") return <VideoList />;
    if (videos === "createVideo") return <CreateVideo />;

    if (orders === "all") return <OrdersDashboard />;
    if (transferOrders === "all") return <TransferOrdersDashboard />;

    return null;
  };

  return (
    <main className="flex min-h-screen bg-gray-50 relative">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-0
          bg-white border-r border-gray-100 shadow-lg lg:shadow-sm
          transition-all duration-300 ease-in-out flex flex-col
          ${isSidebarOpen
            ? "translate-x-0 w-64"
            : "-translate-x-full lg:translate-x-0 lg:w-16"
          }
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-brand-green text-white shrink-0">
          <span
            className={`font-bold text-sm tracking-wide transition-all duration-200 overflow-hidden ${
              isSidebarOpen ? "opacity-100 max-w-full" : "lg:opacity-0 lg:max-w-0"
            }`}
          >
            Admin Panel
          </span>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-lg p-1.5 hover:bg-white/20 transition-colors shrink-0"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {isSidebarOpen ? (
            <div className="space-y-0.5">
              {SIDEBAR_GROUPS.map((group) => {
                const Icon = group.icon;
                const isOpen = openGroups.has(group.key);
                const groupActive = isGroupActive(group);

                return (
                  <div key={group.key}>
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroup(group.key)}
                      className={`flex w-full items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${
                        groupActive
                          ? "text-brand-green"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span>{group.label}</span>
                      <ChevronDown
                        className={`h-3 w-3 ml-auto shrink-0 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Sub-items as column */}
                    {isOpen && (
                      <div className="ml-3 pl-3 border-l border-gray-100 flex flex-col mb-1">
                        {group.items.map((item) => (
                          <button
                            key={item.key}
                            onClick={() => navigate(item.query)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                              isActive(item.key)
                                ? "bg-brand-green text-white font-semibold"
                                : "text-gray-600 hover:bg-brand-green-50 hover:text-brand-green"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive(item.key) ? "bg-white" : "bg-gray-300"}`} />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Collapsed — one icon per group */
            <div className="flex flex-col items-center gap-1 pt-1">
              {SIDEBAR_GROUPS.map((group) => {
                const Icon = group.icon;
                const groupActive = isGroupActive(group);

                return (
                  <button
                    key={group.key}
                    onClick={() => setIsSidebarOpen(true)}
                    title={group.label}
                    className={`p-3 rounded-xl transition-colors ${
                      groupActive
                        ? "bg-brand-green-50 text-brand-green"
                        : "text-gray-400 hover:text-brand-green hover:bg-brand-green-50"
                    }`}
                  >
                    <Icon size={19} />
                  </button>
                );
              })}
            </div>
          )}
        </nav>

        {/* Logout */}
        <div className="border-t border-gray-100 p-2 shrink-0">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium"
          >
            <LogOut size={17} className="shrink-0" />
            {isSidebarOpen && <span>გამოსვლა</span>}
          </button>
        </div>
      </aside>

      {/* Mobile hamburger */}
      <button
        onClick={() => setIsSidebarOpen(true)}
        className={`fixed top-4 left-4 z-30 lg:hidden bg-brand-green text-white p-3 rounded-xl shadow-lg hover:bg-brand-green-dark transition-colors ${
          isSidebarOpen ? "hidden" : "block"
        }`}
      >
        <Menu size={20} />
      </button>

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8 max-w-full">{renderContent()}</div>
      </div>
    </main>
  );
};

export default ClientWrapper;
