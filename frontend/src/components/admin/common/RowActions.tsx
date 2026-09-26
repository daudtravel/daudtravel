"use client";

import { useTranslations } from "next-intl";
import { MoreHorizontal, type LucideIcon } from "lucide-react";
import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

export interface RowAction {
  key: string;
  label: string;
  icon?: LucideIcon;
  /** Internal link (locale is added automatically). */
  href?: string;
  /** External link, opened in a new tab. */
  externalHref?: string;
  onSelect?: () => void;
  danger?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  /** Draws a separator above this item. */
  separated?: boolean;
}

/** The "…" menu used in every admin table row. */
export default function RowActions({ actions }: { actions: RowAction[] }) {
  const t = useTranslations("admin.list");
  const visible = actions.filter((action) => !action.hidden);
  if (!visible.length) return null;

  return (
    <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={t("actions")}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {visible.map((action) => {
            const Icon = action.icon;
            const content = (
              <>
                {Icon && <Icon />}
                {action.label}
              </>
            );
            return (
              <div key={action.key}>
                {action.separated && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  onSelect={action.onSelect}
                  disabled={action.disabled}
                  asChild={!!action.href || !!action.externalHref}
                  className={
                    action.danger
                      ? "text-red-600 focus:bg-red-50 focus:text-red-700"
                      : undefined
                  }
                >
                  {action.href ? (
                    <Link href={action.href}>{content}</Link>
                  ) : action.externalHref ? (
                    <a
                      href={action.externalHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {content}
                    </a>
                  ) : (
                    <span className="flex items-center gap-2">{content}</span>
                  )}
                </DropdownMenuItem>
              </div>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
