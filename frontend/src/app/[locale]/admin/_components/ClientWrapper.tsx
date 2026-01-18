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
import { InsuranceSubmissionsList } from "./insurance/InsuranceSubmissionList";
import { InsuranceSettings } from "./insurance/InsuranceSettings";
import { InsuranceSubmissionDetails } from "./insurance/InsuranceSumbissionDetails";
import { InsuranceStats } from "./insurance/InsuranceStats";
import { InsuranceCleanup } from "./insurance/InsuranceCleanUp";

const SIDEBAR_ITEMS = [
  { key: "tours", label: "ტურები", icon: UserCheck, query: "?tours=all" },
  {
    key: "transfers",
    label: "ტრანსფერები",
    icon: Truck,
    query: "?transfers=all",
  },
  { key: "drivers", label: "მძღოლები", icon: Users, query: "?drivers=all" },
  {
    key: "quickPayment",
    label: "გადახდის ლინკები",
    icon: Link,
    query: "?quickPayment=all",
  },
  {
    key: "insurance", // ✅ NEW
    label: "დაზღვევა",
    icon: Shield,
    query: "?insurance=all",
  },
  {
    key: "orders",
    label: "შეკვეთები/ტურები",
    icon: ShoppingCart,
    query: "?orders=all",
  },
  {
    key: "transferOrders",
    label: "შეკვეთები/ტრანსფერები",
    icon: ShoppingCart,
    query: "?transferOrders=all",
  },
  { key: "faqs", label: "F.A.Q", icon: ShieldQuestion, query: "?faqs=all" },
  { key: "videos", label: "ვიდეო", icon: Video, query: "?videos=all" },
] as const;

export const ClientWrapper = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navigate = (query: string) => {
    router.push(`${pathname}${query}`);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const isActive = (key: string) => {
    return searchParams.has(key);
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
    if (insurance === "stats") return <InsuranceStats />;
    if (insurance === "cleanup") return <InsuranceCleanup />;
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
    <main className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen z-50 lg:z-0
          bg-white shadow-2xl lg:shadow-lg
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isSidebarOpen ? "w-72 lg:w-64" : "lg:w-20"}
          flex flex-col
        `}
      >
        <div className="flex items-center justify-between p-4 lg:p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md">
          <h1
            className={`font-bold text-lg lg:text-base transition-opacity duration-200 ${
              isSidebarOpen ? "opacity-100" : "lg:opacity-0"
            }`}
          >
            Admin Panel
          </h1>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="rounded-lg p-2 hover:bg-blue-500/30 transition-colors backdrop-blur-sm"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-2">
          <div className="space-y-1">
            {SIDEBAR_ITEMS.map(({ key, label, icon: Icon, query }) => (
              <button
                key={key}
                onClick={() => navigate(query)}
                className={`
                  flex w-full items-center gap-3 px-4 py-3 rounded-lg
                  transition-all duration-200 font-medium text-sm
                  ${
                    isActive(key)
                      ? "bg-blue-50 text-blue-700 shadow-sm border-l-4 border-blue-600"
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                  }
                `}
              >
                <Icon size={20} className="flex-shrink-0" />
                <span
                  className={`transition-opacity duration-200 whitespace-nowrap ${
                    isSidebarOpen ? "opacity-100" : "lg:opacity-0 lg:w-0"
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </nav>

        <div className="border-t border-gray-200 p-2">
          <button
            onClick={logout}
            className={`
              flex w-full items-center gap-3 px-4 py-3 rounded-lg
              text-red-600 hover:bg-red-50 transition-all duration-200
              font-medium text-sm
            `}
          >
            <LogOut size={20} className="flex-shrink-0" />
            <span
              className={`transition-opacity duration-200 ${
                isSidebarOpen ? "opacity-100" : "lg:opacity-0 lg:w-0"
              }`}
            >
              გამოსვლა
            </span>
          </button>
        </div>
      </aside>

      <button
        onClick={() => setIsSidebarOpen(true)}
        className={`
          fixed top-4 left-4 z-30 lg:hidden
          bg-blue-600 text-white p-3 rounded-lg shadow-lg
          hover:bg-blue-700 transition-colors
          ${isSidebarOpen ? "hidden" : "block"}
        `}
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      <div className="flex-1 overflow-auto">
        <div className="p-4 lg:p-8 max-w-full">{renderContent()}</div>
      </div>
    </main>
  );
};

export default ClientWrapper;
