"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, Trash2 } from "lucide-react";
import { useRouter } from "@/src/i18n/routing";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Skeleton } from "@/src/components/ui/skeleton";
import PageHeader from "@/src/components/admin/common/PageHeader";
import Panel from "@/src/components/admin/common/Panel";
import ConfirmDialog from "@/src/components/admin/common/ConfirmDialog";
import { AdminNotFound } from "@/src/components/admin/access/Guard";
import { RequiredMark, adminInputClass } from "@/src/components/admin/form/FormFields";
import {
  adminKeys,
  useAdminVideo,
  useDeleteVideo,
} from "@/src/hooks/admin/useAdminLists";
import { videoApi } from "@/src/services/videos.service";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { adminPaths } from "@/src/utlis/admin/paths";
import { getApiStatus, useApiErrorMessage } from "@/src/utlis/admin/errors";
import type { VideoLocalizationInput } from "@/src/types/video.types";

const LOCALES = [
  { code: "ka", label: "ქართული" },
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
  { code: "ar", label: "العربية" },
] as const;

type LocaleFields = { title: string; description: string };

const emptyLocales = () =>
  Object.fromEntries(
    LOCALES.map((l) => [l.code, { title: "", description: "" }])
  ) as Record<string, LocaleFields>;

/** Create and edit in one screen — editing was missing before. */
export default function VideoFormView({ id }: { id?: string }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const queryClient = useQueryClient();
  const errorMessage = useApiErrorMessage();
  const { can } = usePermissions();
  const isEdit = !!id;

  const videoQuery = useAdminVideo(id);
  const deleteVideo = useDeleteVideo();

  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [locales, setLocales] = useState<Record<string, LocaleFields>>(
    emptyLocales
  );
  const [errors, setErrors] = useState<{ url?: string }>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loaded = videoQuery.data;
  useEffect(() => {
    if (!loaded) return;
    setUrl(loaded.url);
    setCategory(loaded.category ?? "");
    const next = emptyLocales();
    for (const loc of loaded.localizations ?? []) {
      next[loc.locale] = {
        title: loc.title ?? "",
        description: loc.description ?? "",
      };
    }
    // Older videos only have the legacy title/description fields
    if (!loaded.localizations?.length && loaded.title) {
      next.ka = { title: loaded.title, description: loaded.description ?? "" };
    }
    setLocales(next);
  }, [loaded]);

  const setLocaleField = (
    code: string,
    field: keyof LocaleFields,
    value: string
  ) =>
    setLocales((prev) => ({ ...prev, [code]: { ...prev[code], [field]: value } }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setErrors({ url: t("videos.urlRequired") });
      return;
    }
    try {
      new URL(trimmedUrl);
    } catch {
      setErrors({ url: t("videos.invalidUrl") });
      return;
    }
    setErrors({});

    const localizations: VideoLocalizationInput[] = LOCALES.filter((l) =>
      locales[l.code].title.trim()
    ).map((l) => ({
      locale: l.code,
      title: locales[l.code].title.trim(),
      ...(locales[l.code].description.trim() && {
        description: locales[l.code].description.trim(),
      }),
    }));

    // Legacy fallback fields: prefer Georgian, otherwise the first filled locale
    const fallback =
      localizations.find((l) => l.locale === "ka") || localizations[0];

    const payload = {
      url: trimmedUrl,
      ...(fallback && { title: fallback.title }),
      ...(fallback?.description && { description: fallback.description }),
      ...(category.trim() && { category: category.trim() }),
      ...(localizations.length > 0 && { localizations }),
    };

    setSaving(true);
    try {
      if (isEdit) {
        await videoApi.put(id!, payload);
        toast.success(t("videos.updated"));
      } else {
        await videoApi.post(payload);
        toast.success(t("videos.added"));
      }
      await queryClient.invalidateQueries({ queryKey: adminKeys.videos });
      await queryClient.invalidateQueries({ queryKey: ["videos"] });
      router.push(adminPaths.websiteVideos);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!id) return;
    try {
      await deleteVideo.mutateAsync(id);
      toast.success(t("videos.deleted"));
      router.push(adminPaths.websiteVideos);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (isEdit && videoQuery.isError && getApiStatus(videoQuery.error) === 404) {
    return <AdminNotFound />;
  }
  if (isEdit && videoQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title={isEdit ? t("videos.editTitle") : t("videos.add")}
        backHref={adminPaths.websiteVideos}
        backLabel={t("nav.videos")}
      />

      <form onSubmit={submit} className="space-y-6" noValidate>
        <Panel title={t("videos.details")}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="video-url" className="text-sm font-semibold text-gray-700">
                URL
                <RequiredMark />
              </label>
              <Input
                id="video-url"
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setErrors({});
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className={adminInputClass}
                dir="ltr"
                aria-invalid={!!errors.url}
              />
              <p className="text-xs text-gray-500">{t("videos.urlHint")}</p>
              {errors.url && (
                <p className="text-xs font-medium text-red-600">{errors.url}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="video-category" className="text-sm font-semibold text-gray-700">
                {t("common.category")}
              </label>
              <Input
                id="video-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t("videos.categoryPlaceholder")}
                className={adminInputClass}
              />
            </div>
          </div>
        </Panel>

        <Panel
          title={t("videos.titleDescByLanguage")}
          description={t("common.optional")}
        >
          <div className="space-y-4">
            {LOCALES.map((l) => (
              <div
                key={l.code}
                className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4"
              >
                <p className="text-sm font-semibold text-brand-green">
                  {l.label}{" "}
                  <span className="text-xs font-normal uppercase text-gray-400">
                    ({l.code})
                  </span>
                </p>
                <Input
                  value={locales[l.code].title}
                  onChange={(e) => setLocaleField(l.code, "title", e.target.value)}
                  placeholder={t("videos.colTitle")}
                  className={adminInputClass}
                  dir={l.code === "ar" ? "rtl" : "ltr"}
                />
                <Textarea
                  value={locales[l.code].description}
                  onChange={(e) =>
                    setLocaleField(l.code, "description", e.target.value)
                  }
                  placeholder={t("common.description")}
                  rows={2}
                  className="rounded-xl border-gray-200"
                  dir={l.code === "ar" ? "rtl" : "ltr"}
                />
              </div>
            ))}
          </div>
        </Panel>

        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <div>
            {isEdit && can("WEBSITE", "delete") && (
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
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(adminPaths.websiteVideos)}
              disabled={saving}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {t("common.save")}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t("videos.deleteTitle")}
        loading={deleteVideo.isPending}
        onConfirm={() => void onDelete()}
      />
    </div>
  );
}
