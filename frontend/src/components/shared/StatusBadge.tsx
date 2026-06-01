import React from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Clock,
  RefreshCw,
} from "lucide-react";

type BadgeVariant =
  | "paid"
  | "confirmed"
  | "pending"
  | "failed"
  | "cancelled"
  | "refunded"
  | "unknown";

interface StatusConfig {
  label: string;
  className: string;
  icon: React.ElementType;
}

const STATUS_MAP: Record<string, StatusConfig> = {
  paid: {
    label: "გადახდილი",
    className: "text-green-700 bg-green-50 border-green-200",
    icon: CheckCircle,
  },
  confirmed: {
    label: "დადასტურებული",
    className: "text-green-700 bg-green-50 border-green-200",
    icon: CheckCircle,
  },
  pending: {
    label: "მუშავდება",
    className: "text-yellow-700 bg-yellow-50 border-yellow-200",
    icon: AlertTriangle,
  },
  failed: {
    label: "წარუმატებელი",
    className: "text-red-700 bg-red-50 border-red-200",
    icon: XCircle,
  },
  cancelled: {
    label: "გაუქმებული",
    className: "text-red-700 bg-red-50 border-red-200",
    icon: XCircle,
  },
  refunded: {
    label: "დაბრუნებული",
    className: "text-purple-700 bg-purple-50 border-purple-200",
    icon: RefreshCw,
  },
};

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function StatusBadge({ status, size = "sm", showLabel = true }: StatusBadgeProps) {
  const key = status?.toLowerCase();
  const config = STATUS_MAP[key] ?? {
    label: status,
    className: "text-gray-600 bg-gray-50 border-gray-200",
    icon: AlertCircle,
  };

  const Icon = config.icon;
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-medium ${textSize} ${config.className}`}
    >
      <Icon className={`${iconSize} shrink-0`} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

export default StatusBadge;
