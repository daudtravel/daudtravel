"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Car,
  UserCheck,
  ArrowRight,
  ChevronDown,
  Phone,
  Mail,
  CalendarDays,
  Clock,
  Users,
  Wallet,
  Hash,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { transferOrdersAPI } from "@/src/services/transfer-orders.service";
import { TransferOrder, useTransferOrders } from "@/src/hooks/transfers/useTransferOrders";

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  PAID:     { label: "გადახდილი",     className: "text-brand-green bg-brand-green-50 border-brand-green-100", icon: CheckCircle2 },
  PENDING:  { label: "მუშავდება",     className: "text-yellow-700 bg-yellow-50 border-yellow-200",           icon: AlertTriangle },
  FAILED:   { label: "წარუმატებელი", className: "text-red-600 bg-red-50 border-red-200",                    icon: XCircle },
  REFUNDED: { label: "დაბრუნებული",  className: "text-purple-700 bg-purple-50 border-purple-200",           icon: RefreshCw },
};

function getStatus(status: string) {
  return STATUS_CONFIG[status?.toUpperCase()] ?? {
    label: status,
    className: "text-gray-600 bg-gray-50 border-gray-200",
    icon: AlertCircle,
  };
}

function OrderRow({ order }: { order: TransferOrder }) {
  const [expanded, setExpanded] = useState(false);
  const { label, className, icon: StatusIcon } = getStatus(order.status);
  const { date, time, vehicleType, passengerCount } = order.transfer;

  const transferDate = new Date(date).toLocaleDateString("ka-GE", { day: "numeric", month: "short", year: "numeric" });
  const transferTime = new Date(time).toLocaleTimeString("ka-GE", { hour: "2-digit", minute: "2-digit" });
  const createdAt = new Date(order.createdAt).toLocaleDateString("ka-GE", { day: "numeric", month: "short" });

  const isPending = order.status?.toUpperCase() === "PENDING";

  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* Main row — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left"
      >
        <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
          {/* Status */}
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shrink-0 ${className}`}>
            <StatusIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{label}</span>
          </div>

          {/* Route */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 truncate">
              <span className="truncate">{order.startLocation || "?"}</span>
              <ArrowRight className="h-3.5 w-3.5 text-gray-300 shrink-0" />
              <span className="truncate text-gray-600">{order.endLocation || "?"}</span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3 h-3" />
                {transferDate}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {transferTime}
              </span>
            </div>
          </div>

          {/* Customer */}
          <div className="hidden md:block min-w-0 w-40 shrink-0">
            <p className="text-sm font-medium text-gray-900 truncate">{order.customer.fullName}</p>
            <p className="text-xs text-gray-400 truncate">{order.customer.phone}</p>
          </div>

          {/* Vehicle + passengers */}
          <div className="hidden lg:flex items-center gap-2 shrink-0 text-xs text-gray-500 w-28">
            <Car className="w-3.5 h-3.5 text-brand-green-mid" />
            <span>{vehicleType}</span>
            <span className="text-gray-300">·</span>
            <Users className="w-3 h-3" />
            <span>{passengerCount}</span>
          </div>

          {/* Driver */}
          {order.driver ? (
            <div className="hidden xl:flex items-center gap-1.5 text-xs text-brand-green font-medium shrink-0 w-32">
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{order.driver.firstName} {order.driver.lastName}</span>
            </div>
          ) : (
            <div className="hidden xl:block w-32 shrink-0 text-xs text-gray-300">—</div>
          )}

          {/* Amount */}
          <div className="shrink-0 text-right">
            <span className="text-base font-bold text-brand-green">
              {order.currency === "GEL" ? "₾" : order.currency}{order.paymentAmount}
            </span>
            <p className="text-xs text-gray-400">{createdAt}</p>
          </div>

          {/* Expand chevron */}
          <ChevronDown
            className={`w-4 h-4 text-gray-300 shrink-0 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Customer contact */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">კლიენტი</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="truncate">{order.customer.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{order.customer.phone}</span>
              </div>
            </div>
          </div>

          {/* Transfer details */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">ტრანსფერი</p>
            <div className="space-y-1.5 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Car className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span>{vehicleType} · {passengerCount} მგზ.</span>
              </div>
              {order.driver && (
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-brand-green shrink-0" />
                  <span className="text-brand-green font-medium">
                    {order.driver.firstName} {order.driver.lastName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Payment & meta */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">გადახდა</p>
            <div className="space-y-1.5 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Wallet className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-semibold text-brand-green">
                  {order.currency === "GEL" ? "₾" : order.currency}{order.paymentAmount}
                </span>
              </div>
              {order.bogOrderId && (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Hash className="w-3 h-3 shrink-0" />
                  <span className="font-mono">{order.bogOrderId.slice(-12)}</span>
                </div>
              )}
              {isPending && order.paymentUrl && (
                <a
                  href={order.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-brand-green hover:underline font-medium"
                >
                  <ExternalLink className="w-3 h-3" />
                  გადახდის ბმული
                </a>
              )}
              {order.expiresAt && isPending && (
                <p className="text-xs text-yellow-600">
                  ვადა: {new Date(order.expiresAt).toLocaleString("ka-GE")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const TransferOrdersDashboard = () => {
  const queryClient = useQueryClient();
  const { data: orders = [], isLoading, isError, error, refetch } = useTransferOrders();

  const deleteFailedMutation = useMutation({
    mutationFn: () => transferOrdersAPI.deleteFailedOrders(),
    onSuccess: () => {
      toast.success("წარუმატებელი შეკვეთები წაიშალა");
      queryClient.invalidateQueries({ queryKey: ["admin", "transfer-orders"] });
    },
    onError: (err: Error) => toast.error(`წაშლა ვერ მოხერხდა: ${err?.message || "უცნობი შეცდომა"}`),
  });

  const paid    = orders.filter((o) => o.status?.toUpperCase() === "PAID").length;
  const pending = orders.filter((o) => o.status?.toUpperCase() === "PENDING").length;
  const failed  = orders.filter((o) => o.status?.toUpperCase() === "FAILED").length;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">ტრანსფერების შეკვეთები</h1>
          <p className="text-sm text-gray-400 mt-0.5">სულ: {orders.length} შეკვეთა</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            disabled={isLoading || deleteFailedMutation.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-brand-green-50 hover:border-brand-green-100 hover:text-brand-green transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            განახლება
          </button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={isLoading || deleteFailedMutation.isPending || failed === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-40"
              >
                <XCircle className="w-4 h-4" />
                წარუმ. წაშლა ({failed})
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>წარუმატებელი შეკვეთების წაშლა</AlertDialogTitle>
                <AlertDialogDescription>
                  დარწმუნებული ხართ? ყველა წარუმატებელი შეკვეთა ({failed} ცალი) სამუდამოდ წაიშლება.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteFailedMutation.mutate()}
                  className="bg-red-500 hover:bg-red-600"
                >
                  წაშლა
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats strip */}
      {orders.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-2 bg-brand-green-50 border border-brand-green-100 rounded-xl text-xs font-semibold text-brand-green">
            <CheckCircle2 className="w-3.5 h-3.5" /> გადახდილი: {paid}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-xl text-xs font-semibold text-yellow-700">
            <AlertTriangle className="w-3.5 h-3.5" /> მუშავდება: {pending}
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-600">
            <XCircle className="w-3.5 h-3.5" /> წარუმ.: {failed}
          </div>
        </div>
      )}

      {/* Column headers (desktop only) */}
      {orders.length > 0 && !isLoading && (
        <div className="hidden lg:grid grid-cols-[140px_1fr_160px_160px_160px_120px_32px] gap-3 px-4 text-xs font-bold uppercase tracking-wider text-gray-400">
          <span>სტატუსი</span>
          <span>მარშრუტი / თარიღი</span>
          <span>კლიენტი</span>
          <span>ავტომ.</span>
          <span>მძღოლი</span>
          <span className="text-right">თანხა</span>
          <span />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <RefreshCw className="w-7 h-7 animate-spin text-brand-green-mid" />
        </div>
      ) : isError ? (
        <div className="flex justify-center items-center min-h-[300px]">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-600 font-medium text-sm">
              {(error as Error)?.message || "შეკვეთების ჩატვირთვა ვერ მოხერხდა"}
            </p>
            <button onClick={() => refetch()} className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-3.5 h-3.5" /> თავიდან ცდა
            </button>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center min-h-[300px] gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-green-50 flex items-center justify-center">
            <Car className="h-7 w-7 text-brand-green-mid" />
          </div>
          <p className="text-gray-500">შეკვეთები არ მოიძებნა</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => <OrderRow key={order.id} order={order} />)}
        </div>
      )}
    </div>
  );
};

export default TransferOrdersDashboard;
