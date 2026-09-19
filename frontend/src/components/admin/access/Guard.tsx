"use client";

import { useTranslations } from "next-intl";
import { Lock, SearchX } from "lucide-react";
import { Link } from "@/src/i18n/routing";
import { Button } from "@/src/components/ui/button";
import { adminPaths } from "@/src/utlis/admin/paths";
import { type AccessRequirement, usePermissions } from "./usePermissions";

/** Renders children only when the signed-in user meets the requirement. */
export default function Guard({
  requires,
  children,
}: {
  requires: AccessRequirement;
  children: React.ReactNode;
}) {
  const { allows } = usePermissions();
  if (!allows(requires)) return <NoAccess />;
  return <>{children}</>;
}

function StateCard({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Lock;
  title: string;
  text: string;
}) {
  const t = useTranslations("admin.access");
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
      <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-green-50 text-brand-green">
        <Icon className="h-7 w-7" />
      </span>
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 text-sm text-gray-500">{text}</p>
      <Button asChild className="mt-6">
        <Link href={adminPaths.dashboard}>{t("goToDashboard")}</Link>
      </Button>
    </div>
  );
}

export function NoAccess() {
  const t = useTranslations("admin.access");
  return (
    <StateCard icon={Lock} title={t("noAccessTitle")} text={t("noAccessText")} />
  );
}

export function AdminNotFound() {
  const t = useTranslations("admin.access");
  return (
    <StateCard
      icon={SearchX}
      title={t("notFoundTitle")}
      text={t("notFoundText")}
    />
  );
}
