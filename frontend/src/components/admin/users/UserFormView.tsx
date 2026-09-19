"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check, KeyRound, Loader2, Save, ShieldCheck, Trash2, Wand2 } from "lucide-react";
import { useRouter } from "@/src/i18n/routing";
import { Form } from "@/src/components/ui/form";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Skeleton } from "@/src/components/ui/skeleton";
import PageHeader from "@/src/components/admin/common/PageHeader";
import Panel from "@/src/components/admin/common/Panel";
import ConfirmDialog from "@/src/components/admin/common/ConfirmDialog";
import { AdminNotFound } from "@/src/components/admin/access/Guard";
import { SwitchField, TextField } from "@/src/components/admin/form/FormFields";
import {
  useDeleteUser,
  useRolesList,
  useSaveUser,
  useUser,
} from "@/src/hooks/admin/useAccess";
import { useAuth } from "@/src/auth/authProvider";
import { adminPaths } from "@/src/utlis/admin/paths";
import { formatDateTime, fullName } from "@/src/utlis/admin/format";
import { getApiStatus, useApiErrorMessage } from "@/src/utlis/admin/errors";
import { cn } from "@/src/utlis/cn";
import SetPasswordDialog from "./SetPasswordDialog";
import { generatePassword, PASSWORD_REGEX } from "./passwordUtils";

type FormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  password: string;
  passwordConfirm: string;
  isActive: boolean;
  isAdmin: boolean;
  roleIds: string[];
};

const EMPTY: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  position: "",
  password: "",
  passwordConfirm: "",
  isActive: true,
  isAdmin: false,
  roleIds: [],
};

export default function UserFormView({ id }: { id?: string }) {
  const t = useTranslations("admin");
  const locale = useLocale();
  const router = useRouter();
  const errorMessage = useApiErrorMessage();
  const { user: me } = useAuth();
  const isEdit = !!id;
  const isSelf = isEdit && id === me?.id;

  const userQuery = useUser(id);
  const rolesQuery = useRolesList({
    page: 1,
    limit: 500,
    sortBy: "name",
    sortOrder: "asc",
  });
  const saveUser = useSaveUser();
  const deleteUser = useDeleteUser();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const schema = useMemo(() => {
    const required = t("form.required");
    const name = z
      .string()
      .trim()
      .min(1, required)
      .max(50, t("form.tooLong", { max: 50 }));
    return z
      .object({
        firstName: name,
        lastName: name,
        email: z
          .string()
          .trim()
          .min(1, required)
          .email(t("form.invalidEmail"))
          .max(254, t("form.tooLong", { max: 254 })),
        phone: z.string().trim().max(40, t("form.tooLong", { max: 40 })),
        position: z.string().trim().max(80, t("form.tooLong", { max: 80 })),
        password: isEdit
          ? z.string()
          : z.string().regex(PASSWORD_REGEX, t("form.passwordRule")),
        passwordConfirm: z.string(),
        isActive: z.boolean(),
        isAdmin: z.boolean(),
        roleIds: z.array(z.string()),
      })
      .refine((v) => isEdit || v.password === v.passwordConfirm, {
        message: t("form.passwordsDontMatch"),
        path: ["passwordConfirm"],
      });
  }, [t, isEdit]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  const loaded = userQuery.data;
  useEffect(() => {
    if (!loaded) return;
    form.reset({
      ...EMPTY,
      firstName: loaded.firstName,
      lastName: loaded.lastName,
      email: loaded.email,
      phone: loaded.phone ?? "",
      position: loaded.position ?? "",
      isActive: loaded.isActive,
      isAdmin: loaded.isAdmin,
      roleIds: loaded.roles.map((r) => r.id),
    });
  }, [loaded, form]);

  const isAdmin = useWatch({ control: form.control, name: "isAdmin" });
  const roleIds = useWatch({ control: form.control, name: "roleIds" });

  const onSubmit = async (values: FormValues) => {
    const payload = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      phone: values.phone.trim() || null,
      position: values.position.trim() || null,
      roleIds: values.roleIds,
      // Own admin/active flags can't be changed (the API refuses it too).
      ...(!isSelf && { isAdmin: values.isAdmin, isActive: values.isActive }),
      ...(!isEdit && { password: values.password }),
    };
    try {
      await saveUser.mutateAsync({ id, payload });
      toast.success(isEdit ? t("users.updatedToast") : t("users.createdToast"));
      router.push(adminPaths.users);
    } catch (error) {
      const message = errorMessage(error);
      toast.error(message);
      if (getApiStatus(error) === 409) {
        form.setError("email", { message });
      }
    }
  };

  const onDelete = async () => {
    if (!id) return;
    try {
      await deleteUser.mutateAsync(id);
      toast.success(t("users.deletedToast"));
      router.push(adminPaths.users);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (isEdit && userQuery.isError && getApiStatus(userQuery.error) === 404) {
    return <AdminNotFound />;
  }

  if (isEdit && userQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  const toggleRole = (roleId: string) => {
    const current = form.getValues("roleIds");
    form.setValue(
      "roleIds",
      current.includes(roleId)
        ? current.filter((r) => r !== roleId)
        : [...current, roleId],
      { shouldDirty: true }
    );
  };

  const fillGenerated = () => {
    const pwd = generatePassword();
    form.setValue("password", pwd, { shouldDirty: true, shouldValidate: true });
    form.setValue("passwordConfirm", pwd, { shouldDirty: true, shouldValidate: true });
    toast.info(t("users.generatedHint", { password: pwd }), { duration: 15000 });
  };

  const roles = rolesQuery.data?.data ?? [];
  const saving = saveUser.isPending;

  return (
    <div>
      <PageHeader
        title={isEdit ? fullName(loaded) : t("users.new")}
        description={isEdit ? loaded?.email : t("users.subtitle")}
        backHref={adminPaths.users}
        backLabel={t("users.backToList")}
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className={cn(
            "grid gap-6",
            isEdit && "xl:grid-cols-[minmax(0,1fr),340px]"
          )}
          noValidate
        >
          <div className="space-y-6">
            <Panel title={t("users.personalSection")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField control={form.control} name="firstName" label={t("users.firstName")} required autoComplete="off" />
                <TextField control={form.control} name="lastName" label={t("users.lastName")} required autoComplete="off" />
                <TextField control={form.control} name="phone" label={t("users.phone")} type="tel" dir="ltr" autoComplete="off" />
                <TextField control={form.control} name="position" label={t("users.position")} placeholder={t("users.positionPlaceholder")} />
              </div>
            </Panel>

            <Panel title={t("users.accountSection")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField
                  control={form.control}
                  name="email"
                  label={t("users.email")}
                  type="email"
                  dir="ltr"
                  required
                  autoComplete="off"
                  className="sm:col-span-2"
                />
                {!isEdit && (
                  <>
                    <TextField
                      control={form.control}
                      name="password"
                      label={t("users.password")}
                      type="text"
                      dir="ltr"
                      required
                      autoComplete="new-password"
                      hint={t("form.passwordRule")}
                    />
                    <TextField
                      control={form.control}
                      name="passwordConfirm"
                      label={t("users.passwordConfirm")}
                      type="text"
                      dir="ltr"
                      required
                      autoComplete="new-password"
                    />
                    <div className="sm:col-span-2">
                      <Button type="button" variant="outline" size="sm" onClick={fillGenerated}>
                        <Wand2 />
                        {t("users.generatePassword")}
                      </Button>
                    </div>
                  </>
                )}
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SwitchField
                  control={form.control}
                  name="isActive"
                  label={t("users.isActive")}
                  hint={isSelf ? t("users.selfLocked") : t("users.isActiveHint")}
                  disabled={isSelf}
                />
                <SwitchField
                  control={form.control}
                  name="isAdmin"
                  label={t("users.isAdmin")}
                  hint={isSelf ? t("users.selfLocked") : t("users.isAdminHint")}
                  disabled={isSelf}
                />
              </div>
            </Panel>

            <Panel
              title={t("users.roles")}
              description={isAdmin ? t("users.adminHasAll") : t("users.rolesHint")}
            >
              {rolesQuery.isLoading ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {[0, 1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 rounded-xl" />
                  ))}
                </div>
              ) : roles.length === 0 ? (
                <p className="text-sm text-gray-500">{t("users.noRolesDefined")}</p>
              ) : (
                <div
                  className={cn(
                    "grid gap-3 sm:grid-cols-2",
                    isAdmin && "pointer-events-none opacity-50"
                  )}
                >
                  {roles.map((role) => {
                    const selected = roleIds.includes(role.id);
                    const moduleCount = role.permissions.filter((p) => p.canView).length;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        aria-pressed={selected}
                        className={cn(
                          "flex items-start gap-3 rounded-xl border p-4 text-start transition-colors",
                          selected
                            ? "border-brand-green bg-brand-green-50/60"
                            : "border-gray-200 hover:border-brand-green-100 hover:bg-gray-50"
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                            selected
                              ? "border-brand-green bg-brand-green text-brand-cream"
                              : "border-gray-300 bg-white"
                          )}
                        >
                          {selected && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-semibold text-gray-900">{role.name}</span>
                          {role.description && (
                            <span className="mt-0.5 block text-xs text-gray-500">{role.description}</span>
                          )}
                          <span className="mt-1.5 block text-xs font-medium text-brand-green">
                            {t("roles.modulesCount", { count: moduleCount })}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </Panel>

            <div className="flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <Button type="button" variant="outline" onClick={() => router.push(adminPaths.users)} disabled={saving}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="animate-spin" /> : <Save />}
                {isEdit ? t("common.save") : t("users.create")}
              </Button>
            </div>
          </div>

          {isEdit && loaded && (
            <aside className="space-y-6">
              <Panel title={t("users.accountInfo")}>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">{t("users.status")}</dt>
                    <dd>
                      <Badge tone={loaded.isActive ? "green" : "neutral"}>
                        {loaded.isActive ? t("users.active") : t("users.inactive")}
                      </Badge>
                    </dd>
                  </div>
                  {loaded.isAdmin && (
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500">{t("users.filterType")}</dt>
                      <dd>
                        <Badge tone="dark">
                          <ShieldCheck />
                          {t("users.superAdmin")}
                        </Badge>
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">{t("users.lastLogin")}</dt>
                    <dd className="text-end text-gray-800">
                      {loaded.lastLoginAt ? formatDateTime(loaded.lastLoginAt, locale) : t("users.never")}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">{t("users.created")}</dt>
                    <dd className="text-end text-gray-800">{formatDateTime(loaded.createdAt, locale)}</dd>
                  </div>
                </dl>
              </Panel>

              {!isSelf && (
                <Panel title={t("users.securitySection")}>
                  <div className="space-y-3">
                    <Button type="button" variant="outline" className="w-full justify-start" onClick={() => setPasswordOpen(true)}>
                      <KeyRound />
                      {t("users.resetPassword")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 />
                      {t("users.deleteUser")}
                    </Button>
                  </div>
                </Panel>
              )}
            </aside>
          )}
        </form>
      </Form>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("users.deleteTitle")}
        description={t("users.deleteText", { name: fullName(loaded) })}
        loading={deleteUser.isPending}
        onConfirm={() => void onDelete()}
      />
      <SetPasswordDialog
        user={passwordOpen && loaded ? loaded : null}
        onOpenChange={setPasswordOpen}
      />
    </div>
  );
}
