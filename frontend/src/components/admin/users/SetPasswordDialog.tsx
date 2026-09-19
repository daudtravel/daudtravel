"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Copy, Eye, EyeOff, Loader2, Wand2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { useSetUserPassword } from "@/src/hooks/admin/useAccess";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import { fullName } from "@/src/utlis/admin/format";
import type { StaffUser } from "@/src/types/admin/access.types";
import { generatePassword, PASSWORD_REGEX } from "./passwordUtils";

export default function SetPasswordDialog({
  user,
  onOpenChange,
}: {
  user: Pick<StaffUser, "id" | "firstName" | "lastName"> | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const errorMessage = useApiErrorMessage();
  const setPassword = useSetUserPassword();
  const [password, setPasswordValue] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setPasswordValue("");
      setVisible(false);
      setError(null);
    }
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!PASSWORD_REGEX.test(password)) {
      setError(t("form.passwordRule"));
      return;
    }
    try {
      await setPassword.mutateAsync({ id: user.id, password });
      toast.success(t("users.passwordChangedToast"));
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  const generate = () => {
    setPasswordValue(generatePassword());
    setVisible(true);
    setError(null);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success(t("users.passwordCopied"));
    } catch {
      // clipboard blocked — the password stays visible for manual copy
    }
  };

  return (
    <Dialog
      open={!!user}
      onOpenChange={(open) => !setPassword.isPending && onOpenChange(open)}
    >
      <DialogContent className="rounded-2xl sm:max-w-md">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{t("users.resetPassword")}</DialogTitle>
            <DialogDescription>
              {user && fullName(user)} — {t("users.resetPasswordText")}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-5 space-y-2">
            <label htmlFor="new-user-password" className="text-sm font-semibold text-gray-700">
              {t("users.newPassword")}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="new-user-password"
                  type={visible ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPasswordValue(e.target.value);
                    setError(null);
                  }}
                  autoComplete="new-password"
                  className="h-11 rounded-xl pe-10"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setVisible((v) => !v)}
                  className="absolute end-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 hover:text-gray-600"
                  aria-label={visible ? t("login.hidePassword") : t("login.showPassword")}
                >
                  {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button type="button" variant="outline" onClick={generate} className="h-11">
                <Wand2 />
                <span className="hidden sm:inline">{t("users.generatePassword")}</span>
              </Button>
              {password && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => void copy()}
                  className="h-11 w-11"
                  aria-label={t("users.copyPassword")}
                >
                  <Copy />
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500">{t("form.passwordRule")}</p>
            {error && <p className="text-sm font-medium text-red-600">{error}</p>}
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={setPassword.isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={setPassword.isPending || !password}>
              {setPassword.isPending && <Loader2 className="animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
