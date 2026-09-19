"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Info, Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/src/auth/authProvider";
import { axiosInstance } from "@/src/utlis/axiosInstance";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import LocaleSwitcher from "@/src/i18n/LocaleSwitcher";
import { Button } from "@/src/components/ui/button";
import FullScreenLoader from "@/src/components/admin/shell/FullScreenLoader";
import { useAdminMode } from "@/src/components/admin/shell/useAdminMode";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Only allow redirects back into this site's admin (no open redirects). */
function safeNext(next: string | null, locale: string): string {
  const fallback = `/${locale}/admin`;
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  const path = next.split("?")[0];
  const segments = path.split("/").filter(Boolean);
  if (segments[1] !== "admin" || segments[2] === "login") return fallback;
  return next;
}

export default function AdminLogin() {
  const t = useTranslations("admin.login");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading, login } = useAuth();
  const errorMessage = useApiErrorMessage();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});

  useAdminMode();

  const next = safeNext(searchParams.get("next"), locale);
  const expired = searchParams.get("expired") === "1";

  // Already signed in → straight to the panel.
  useEffect(() => {
    if (!isLoading && user) router.replace(next);
  }, [isLoading, user, next, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    if (!EMAIL_RE.test(email.trim())) nextErrors.email = t("emailInvalid");
    if (!password) nextErrors.password = t("passwordRequired");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      const { data } = await axiosInstance.post<{ token: string }>("/signin", {
        email: email.trim(),
        password,
      });
      const profile = await login(data.token);
      if (!profile) {
        setErrors({ form: errorMessage(null) });
        return;
      }
      router.replace(next);
    } catch (error) {
      setErrors({ form: errorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading || user) return <FullScreenLoader />;

  const inputClass =
    "h-12 w-full rounded-xl border bg-white px-4 text-[15px] text-gray-900 placeholder:text-gray-400 transition-colors focus:outline-none focus:ring-4";

  return (
    <div className="admin-theme grid min-h-screen lg:grid-cols-[1.1fr,1fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-brand-green-dark lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -end-32 -top-32 h-96 w-96 rounded-full bg-brand-green/60 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -start-24 h-[28rem] w-[28rem] rounded-full bg-brand-yellow/10 blur-3xl"
        />
        <div className="relative inline-flex w-fit rounded-2xl bg-brand-cream px-4 py-3 shadow-lg">
          <Image
            src="/images/Logo.png"
            alt="Daud Travel"
            width={220}
            height={78}
            className="h-14 w-auto"
            priority
          />
        </div>
        <div className="relative max-w-md">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-yellow">
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight text-brand-cream">
            {t("brandTitle")}
          </h1>
          <p className="mt-4 text-brand-cream/70">{t("brandText")}</p>
        </div>
        <p className="relative text-sm text-brand-cream/50">
          © {new Date().getFullYear()} Daud Travel
        </p>
      </aside>

      {/* Form */}
      <main className="flex flex-col bg-brand-cream/50">
        <div className="flex items-center justify-between p-5">
          <a
            href={`/${locale}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-brand-green"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t("backToWebsite")}
          </a>
          <LocaleSwitcher />
        </div>

        <div className="flex flex-1 items-center justify-center px-5 pb-12">
          <div className="w-full max-w-md">
            <div className="mb-8 flex justify-center lg:hidden">
              <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                <Image
                  src="/images/Logo.png"
                  alt="Daud Travel"
                  width={220}
                  height={78}
                  className="h-12 w-auto"
                  priority
                />
              </div>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-7 shadow-xl shadow-brand-green/5 sm:p-9">
              <h2 className="text-2xl font-bold text-gray-900">{t("title")}</h2>
              <p className="mt-1.5 text-sm text-gray-500">{t("subtitle")}</p>

              {expired && !errors.form && (
                <div className="mt-5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-sm text-amber-800">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  {t("expired")}
                </div>
              )}
              {errors.form && (
                <div
                  role="alert"
                  className="mt-5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm font-medium text-red-700"
                >
                  {errors.form}
                </div>
              )}

              <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-1.5 block text-sm font-semibold text-gray-700"
                  >
                    {t("email")}
                  </label>
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    className={`${inputClass} ${
                      errors.email
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-gray-200 focus:border-brand-green focus:ring-brand-green/10"
                    }`}
                    aria-invalid={!!errors.email}
                    dir="ltr"
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="admin-password"
                    className="mb-1.5 block text-sm font-semibold text-gray-700"
                  >
                    {t("password")}
                  </label>
                  <div className="relative">
                    <input
                      id="admin-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={submitting}
                      className={`${inputClass} pe-12 ${
                        errors.password
                          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                          : "border-gray-200 focus:border-brand-green focus:ring-brand-green/10"
                      }`}
                      aria-invalid={!!errors.password}
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="absolute end-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      {errors.password}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-xl text-[15px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" />
                      {t("submitting")}
                    </>
                  ) : (
                    <>
                      <LogIn className="rtl:rotate-180" />
                      {t("submit")}
                    </>
                  )}
                </Button>
              </form>
            </div>
            <p className="mt-6 text-center text-xs text-gray-400">{t("help")}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
