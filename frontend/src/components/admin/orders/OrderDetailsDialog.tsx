"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";

export interface DetailRow {
  label: string;
  value: React.ReactNode;
  hidden?: boolean;
  full?: boolean;
}

export interface DetailSection {
  title: string;
  rows: DetailRow[];
}

/** Read-only detail view used by the order lists. */
export default function OrderDetailsDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  sections,
  footer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  sections: DetailSection[];
  footer?: React.ReactNode;
}) {
  const t = useTranslations("admin.common");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle ?? t("details")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {sections.map((section) => {
            const rows = section.rows.filter((row) => !row.hidden);
            if (!rows.length) return null;
            return (
              <section key={section.title}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                  {section.title}
                </h3>
                <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  {rows.map((row) => (
                    <div
                      key={row.label}
                      className={row.full ? "sm:col-span-2" : undefined}
                    >
                      <dt className="text-xs text-gray-500">{row.label}</dt>
                      <dd className="break-words text-sm font-medium text-gray-900">
                        {row.value || "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            );
          })}
        </div>

        {footer && <div className="mt-2 flex justify-end gap-2">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
}
