"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Link, useRouter } from "@/src/i18n/routing";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Skeleton } from "@/src/components/ui/skeleton";
import PageHeader from "@/src/components/admin/common/PageHeader";
import Panel from "@/src/components/admin/common/Panel";
import ConfirmDialog from "@/src/components/admin/common/ConfirmDialog";
import { AdminNotFound } from "@/src/components/admin/access/Guard";
import { RequiredMark, adminInputClass } from "@/src/components/admin/form/FormFields";
import { useDeleteRole, useRole, useSaveRole } from "@/src/hooks/admin/useAccess";
import { adminPaths } from "@/src/utlis/admin/paths";
import { fullName } from "@/src/utlis/admin/format";
import { getApiStatus, useApiErrorMessage } from "@/src/utlis/admin/errors";
import PermissionMatrix, {
  fromPermissionMap,
  toPermissionMap,
  type PermissionMap,
} from "./PermissionMatrix";

export default function RoleFormView({ id }: { id?: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const isEdit = !!id;
  const roleQuery = useRole(id);
  const saveRole = useSaveRole();
  const deleteRole = useDeleteRole();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<PermissionMap>(() => toPermissionMap());
  const [nameError, setNameError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loaded = roleQuery.data;
  useEffect(() => {
    if (!loaded) return;
    setName(loaded.name);
    setDescription(loaded.description ?? "");
    setPermissions(toPermissionMap(loaded.permissions));
  }, [loaded]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError(t("form.required"));
      return;
    }
    if (trimmed.length > 60) {
      setNameError(t("form.tooLong", { max: 60 }));
      return;
    }
    try {
      await saveRole.mutateAsync({
        id,
        payload: {
          name: trimmed,
          description: description.trim() || null,
          permissions: fromPermissionMap(permissions),
        },
      });
      toast.success(isEdit ? t("roles.updatedToast") : t("roles.createdToast"));
      router.push(adminPaths.roles);
    } catch (error) {
      const message = errorMessage(error);
      if (getApiStatus(error) === 409) setNameError(message);
      toast.error(message);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    try {
      await deleteRole.mutateAsync(id);
      toast.success(t("roles.deletedToast"));
      router.push(adminPaths.roles);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (isEdit && roleQuery.isError && getApiStatus(roleQuery.error) === 404) {
    return <AdminNotFound />;
  }
  if (isEdit && roleQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const saving = saveRole.isPending;

  return (
    <div>
      <PageHeader
        title={isEdit ? loaded?.name ?? t("roles.edit") : t("roles.new")}
        description={t("roles.subtitle")}
        backHref={adminPaths.roles}
        backLabel={t("roles.backToList")}
      />

      <form onSubmit={submit} className="space-y-6" noValidate>
        <Panel title={t("roles.details")}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="role-name" className="text-sm font-semibold text-gray-700">
                {t("roles.name")}
                <RequiredMark />
              </label>
              <Input
                id="role-name"
                value={name}
                maxLength={60}
                onChange={(e) => {
                  setName(e.target.value);
                  setNameError(null);
                }}
                className={adminInputClass}
                aria-invalid={!!nameError}
              />
              {nameError && <p className="text-xs font-medium text-red-600">{nameError}</p>}
            </div>
            <div className="space-y-1.5">
              <label htmlFor="role-description" className="text-sm font-semibold text-gray-700">
                {t("roles.description")}
              </label>
              <Textarea
                id="role-description"
                value={description}
                maxLength={300}
                rows={2}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border-gray-200"
              />
            </div>
          </div>
        </Panel>

        <Panel title={t("roles.permissions")} description={t("roles.permissionsHint")} noPadding>
          <div className="p-4">
            <PermissionMatrix value={permissions} onChange={setPermissions} />
          </div>
        </Panel>

        {isEdit && loaded && (
          <Panel title={t("roles.assignedUsers")}>
            {loaded.users.length === 0 ? (
              <p className="text-sm text-gray-500">{t("roles.noUsers")}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {loaded.users.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={adminPaths.user(u.id)}
                      className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:border-brand-green-100 hover:bg-brand-green-50 hover:text-brand-green"
                    >
                      {fullName(u)}
                      {!u.isActive && <Badge tone="neutral">{t("users.inactive")}</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div>
            {isEdit && (
              <Button
                type="button"
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 />
                {t("common.delete")}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => router.push(adminPaths.roles)} disabled={saving}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {isEdit ? t("common.save") : t("roles.create")}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("roles.deleteTitle")}
        description={t("roles.deleteText", { count: loaded?.userCount ?? 0 })}
        loading={deleteRole.isPending}
        onConfirm={() => void onDelete()}
      />
    </div>
  );
}
