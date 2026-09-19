"use client";

import { useTranslations } from "next-intl";
import { Check, Minus } from "lucide-react";
import { cn } from "@/src/utlis/cn";
import {
  PERMISSION_MODULE_GROUPS,
  UNSCOPED_MODULES,
  type AccessScope,
  type PermissionModule,
  type RolePermission,
} from "@/src/types/admin/access.types";

type ActionFlag = "canView" | "canCreate" | "canEdit" | "canDelete";
const FLAGS: ActionFlag[] = ["canView", "canCreate", "canEdit", "canDelete"];
const FLAG_LABEL: Record<ActionFlag, string> = {
  canView: "view",
  canCreate: "create",
  canEdit: "edit",
  canDelete: "delete",
};

export type PermissionMap = Record<PermissionModule, RolePermission>;

export function emptyPermission(module: PermissionModule): RolePermission {
  return {
    module,
    canView: false,
    canCreate: false,
    canEdit: false,
    canDelete: false,
    scope: UNSCOPED_MODULES.includes(module) ? "ALL" : "OWN",
  };
}

export function toPermissionMap(rows: RolePermission[] = []): PermissionMap {
  const map = {} as PermissionMap;
  for (const group of PERMISSION_MODULE_GROUPS) {
    for (const moduleKey of group.modules) {
      map[moduleKey] = emptyPermission(moduleKey);
    }
  }
  for (const row of rows) map[row.module] = { ...row };
  return map;
}

export function fromPermissionMap(map: PermissionMap): RolePermission[] {
  return Object.values(map).filter(
    (p) => p.canView || p.canCreate || p.canEdit || p.canDelete
  );
}

/** Applies a checkbox change with the same rules as the API. */
function applyFlag(
  row: RolePermission,
  flag: ActionFlag,
  value: boolean
): RolePermission {
  const next = { ...row, [flag]: value };
  if (flag !== "canView" && value) next.canView = true; // write implies view
  if (flag === "canView" && !value) {
    next.canCreate = false;
    next.canEdit = false;
    next.canDelete = false;
  }
  return next;
}

export default function PermissionMatrix({
  value,
  onChange,
  readOnly = false,
}: {
  value: PermissionMap;
  onChange?: (value: PermissionMap) => void;
  readOnly?: boolean;
}) {
  const t = useTranslations("admin");

  const update = (module: PermissionModule, row: RolePermission) =>
    onChange?.({ ...value, [module]: row });

  const setAll = (full: boolean) => {
    const next = { ...value };
    for (const key of Object.keys(next) as PermissionModule[]) {
      next[key] = full
        ? { ...next[key], canView: true, canCreate: true, canEdit: true, canDelete: true, scope: "ALL" }
        : emptyPermission(key);
    }
    onChange?.(next);
  };

  const cellButton = (checked: boolean, onToggle: () => void, label: string) =>
    readOnly ? (
      <span
        className={cn(
          "mx-auto flex h-6 w-6 items-center justify-center rounded-md",
          checked ? "bg-brand-green text-brand-cream" : "text-gray-300"
        )}
        aria-label={label}
      >
        {checked ? <Check className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
      </span>
    ) : (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={onToggle}
        className={cn(
          "mx-auto flex h-6 w-6 items-center justify-center rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-green",
          checked
            ? "border-brand-green bg-brand-green text-brand-cream"
            : "border-gray-300 bg-white hover:border-brand-green"
        )}
      >
        {checked && <Check className="h-4 w-4" />}
      </button>
    );

  const scopeControl = (module: PermissionModule, row: RolePermission) => {
    const any = row.canView || row.canCreate || row.canEdit || row.canDelete;
    if (UNSCOPED_MODULES.includes(module)) {
      return <span className="text-xs text-gray-400">{t("roles.matrix.notApplicable")}</span>;
    }
    if (readOnly) {
      return any ? (
        <span className="text-xs font-semibold text-brand-green">
          {row.scope === "ALL" ? t("roles.matrix.all") : t("roles.matrix.own")}
        </span>
      ) : (
        <span className="text-xs text-gray-300">—</span>
      );
    }
    return (
      <div
        className={cn(
          "inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5",
          !any && "opacity-40"
        )}
        role="radiogroup"
        aria-label={t("roles.matrix.scope")}
      >
        {(["OWN", "ALL"] as AccessScope[]).map((scope) => (
          <button
            key={scope}
            type="button"
            role="radio"
            aria-checked={row.scope === scope}
            disabled={!any}
            onClick={() => update(module, { ...row, scope })}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
              row.scope === scope
                ? "bg-white text-brand-green shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            {scope === "ALL" ? t("roles.matrix.all") : t("roles.matrix.own")}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
      {!readOnly && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 bg-gray-50/60 px-4 py-3">
          <p className="text-xs text-gray-500">{t("roles.scopeHint")}</p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setAll(true)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-brand-green hover:bg-brand-green-50">
              {t("roles.matrix.selectAll")}
            </button>
            <button type="button" onClick={() => setAll(false)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 hover:bg-gray-100">
              {t("roles.matrix.clearAll")}
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 text-start">{t("roles.matrix.module")}</th>
              {FLAGS.map((flag) => (
                <th key={flag} className="w-20 px-2 py-3 text-center">
                  {t(`roles.matrix.${FLAG_LABEL[flag]}`)}
                </th>
              ))}
              <th className="w-40 px-4 py-3 text-center">{t("roles.matrix.scope")}</th>
            </tr>
          </thead>
          {PERMISSION_MODULE_GROUPS.map((group) => (
            <tbody key={group.key}>
              <tr>
                <td colSpan={6} className="bg-brand-green-50/50 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-brand-green">
                  {t(`roles.groups.${group.key}`)}
                </td>
              </tr>
              {group.modules.map((module) => {
                const row = value[module] ?? emptyPermission(module);
                return (
                  <tr key={module} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{t(`modules.${module}`)}</p>
                      <p className="text-xs text-gray-500">{t(`moduleHints.${module}`)}</p>
                    </td>
                    {FLAGS.map((flag) => (
                      <td key={flag} className="px-2 py-3 text-center">
                        {cellButton(
                          row[flag],
                          () => update(module, applyFlag(row, flag, !row[flag])),
                          `${t(`modules.${module}`)} — ${t(`roles.matrix.${FLAG_LABEL[flag]}`)}`
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center">{scopeControl(module, row)}</td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}
