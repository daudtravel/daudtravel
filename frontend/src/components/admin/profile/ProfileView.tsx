"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { KeyRound, Loader2, Save, ShieldCheck } from "lucide-react";
import { useAuth } from "@/src/auth/authProvider";
import { Form } from "@/src/components/ui/form";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Input } from "@/src/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  BASE_CURRENCY,
  CURRENCIES,
} from "@/src/types/admin/currency.types";
import PageHeader from "@/src/components/admin/common/PageHeader";
import Panel from "@/src/components/admin/common/Panel";
import { TextField, adminInputClass } from "@/src/components/admin/form/FormFields";
import PermissionMatrix, { toPermissionMap } from "@/src/components/admin/roles/PermissionMatrix";
import { PASSWORD_REGEX } from "@/src/components/admin/users/passwordUtils";
import { profileApi } from "@/src/services/admin/access.service";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import type {
  EffectivePermissions,
  PermissionModule,
  RolePermission,
} from "@/src/types/admin/access.types";

type DetailsValues = {
  firstName: string;
  lastName: string;
  phone: string;
  preferredCurrency: string;
};

function effectiveToRows(perms: EffectivePermissions): RolePermission[] {
  return (Object.keys(perms) as PermissionModule[]).map((module) => {
    const access = perms[module];
    const widest = [access.view, access.create, access.edit, access.delete].includes("ALL")
      ? "ALL"
      : "OWN";
    return {
      module,
      canView: access.view != null,
      canCreate: access.create != null,
      canEdit: access.edit != null,
      canDelete: access.delete != null,
      scope: widest,
    };
  });
}

export default function ProfileView() {
  const t = useTranslations("admin");
  const errorMessage = useApiErrorMessage();
  const { user, setProfile, replaceToken } = useAuth();

  const detailsSchema = useMemo(
    () =>
      z.object({
        firstName: z.string().trim().min(1, t("form.required")).max(50, t("form.tooLong", { max: 50 })),
        lastName: z.string().trim().min(1, t("form.required")).max(50, t("form.tooLong", { max: 50 })),
        phone: z.string().trim().max(40, t("form.tooLong", { max: 40 })),
        preferredCurrency: z.string(),
      }),
    [t]
  );
  const form = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      preferredCurrency: BASE_CURRENCY,
    },
  });
  const [savingDetails, setSavingDetails] = useState(false);

  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone ?? "",
        preferredCurrency: user.preferredCurrency ?? BASE_CURRENCY,
      });
    }
  }, [user, form]);

  const saveDetails = async (values: DetailsValues) => {
    setSavingDetails(true);
    try {
      const profile = await profileApi.update({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        phone: values.phone.trim() || null,
        preferredCurrency: values.preferredCurrency,
      });
      setProfile(profile);
      toast.success(t("profile.saved"));
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingDetails(false);
    }
  };

  // Password form
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [savingPw, setSavingPw] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (!current) return setPwError(t("profile.currentRequired"));
    if (!PASSWORD_REGEX.test(next)) return setPwError(t("form.passwordRule"));
    if (next !== confirm) return setPwError(t("form.passwordsDontMatch"));
    setSavingPw(true);
    try {
      const token = await profileApi.changePassword(current, next);
      replaceToken(token);
      setCurrent("");
      setNext("");
      setConfirm("");
      toast.success(t("profile.passwordChanged"));
    } catch (error) {
      setPwError(errorMessage(error));
    } finally {
      setSavingPw(false);
    }
  };

  const matrix = useMemo(
    () => (user ? toPermissionMap(effectiveToRows(user.permissions)) : null),
    [user]
  );

  if (!user) return null;

  return (
    <div>
      <PageHeader title={t("profile.title")} description={t("profile.subtitle")} />

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title={t("profile.details")}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(saveDetails)} className="space-y-4" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <TextField control={form.control} name="firstName" label={t("users.firstName")} required />
                <TextField control={form.control} name="lastName" label={t("users.lastName")} required />
                <TextField control={form.control} name="phone" label={t("users.phone")} type="tel" dir="ltr" />
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">{t("users.email")}</label>
                  <Input value={user.email} disabled dir="ltr" className={adminInputClass} />
                  <p className="text-xs text-gray-500">{t("profile.emailHint")}</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">
                    {t("profile.reportCurrency")}
                  </label>
                  <Select
                    value={form.watch("preferredCurrency")}
                    onValueChange={(value) =>
                      form.setValue("preferredCurrency", value, {
                        shouldDirty: true,
                      })
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-gray-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    {t("profile.reportCurrencyHint")}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={savingDetails}>
                  {savingDetails ? <Loader2 className="animate-spin" /> : <Save />}
                  {t("common.save")}
                </Button>
              </div>
            </form>
          </Form>
        </Panel>

        <Panel title={t("profile.security")} description={t("profile.securityHint")}>
          <form onSubmit={changePassword} className="space-y-4" noValidate>
            {(
              [
                ["current-password", t("profile.currentPassword"), current, setCurrent, "current-password"],
                ["new-password", t("profile.newPassword"), next, setNext, "new-password"],
                ["confirm-password", t("profile.confirmPassword"), confirm, setConfirm, "new-password"],
              ] as const
            ).map(([fieldId, label, value, setter, autoComplete]) => (
              <div key={fieldId} className="space-y-1.5">
                <label htmlFor={fieldId} className="text-sm font-semibold text-gray-700">
                  {label}
                </label>
                <Input
                  id={fieldId}
                  type="password"
                  value={value}
                  autoComplete={autoComplete}
                  onChange={(e) => {
                    setter(e.target.value);
                    setPwError(null);
                  }}
                  dir="ltr"
                  className={adminInputClass}
                />
              </div>
            ))}
            <p className="text-xs text-gray-500">{t("form.passwordRule")}</p>
            {pwError && <p className="text-sm font-medium text-red-600">{pwError}</p>}
            <div className="flex justify-end">
              <Button type="submit" disabled={savingPw}>
                {savingPw ? <Loader2 className="animate-spin" /> : <KeyRound />}
                {t("profile.changePassword")}
              </Button>
            </div>
          </form>
        </Panel>
      </div>

      <Panel title={t("profile.access")} className="mt-6">
        {user.isAdmin ? (
          <div className="flex items-center gap-3 rounded-xl bg-brand-green-50 p-4 text-brand-green">
            <ShieldCheck className="h-6 w-6 shrink-0" />
            <p className="text-sm font-medium">{t("profile.superAdminText")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-gray-700">{t("users.roles")}:</span>
              {user.roles.length ? (
                user.roles.map((role) => (
                  <Badge key={role.id} tone="green">
                    {role.name}
                  </Badge>
                ))
              ) : (
                <span className="text-sm text-gray-500">{t("users.noRoles")}</span>
              )}
            </div>
            {matrix && <PermissionMatrix value={matrix} readOnly />}
          </div>
        )}
      </Panel>
    </div>
  );
}
