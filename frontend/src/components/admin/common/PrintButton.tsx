"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, Loader2, Printer } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

interface PrintButtonProps {
  /**
   * When given, a menu offers "print this page" and "print all results";
   * the callback loads everything and resolves once it is rendered.
   */
  onPrintAll?: () => Promise<void> | void;
  /** Hide the "print all" option when everything is already on screen. */
  allOnScreen?: boolean;
  label?: string;
}

export default function PrintButton({
  onPrintAll,
  allOnScreen,
  label,
}: PrintButtonProps) {
  const t = useTranslations("admin.print");
  const [busy, setBusy] = useState(false);

  const printNow = () => window.print();

  if (!onPrintAll || allOnScreen) {
    return (
      <Button variant="outline" onClick={printNow} className="print:hidden">
        <Printer />
        {label ?? t("print")}
      </Button>
    );
  }

  const printAll = async () => {
    setBusy(true);
    try {
      await onPrintAll();
    } finally {
      setBusy(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={busy} className="print:hidden">
          {busy ? <Loader2 className="animate-spin" /> : <Printer />}
          {busy ? t("preparing") : (label ?? t("print"))}
          <ChevronDown className="opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={printNow}>{t("printPage")}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => void printAll()}>
          {t("printAll")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
