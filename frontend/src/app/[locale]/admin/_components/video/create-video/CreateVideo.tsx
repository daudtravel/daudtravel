// src/components/videos/CreateVideo.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Label } from "@/src/components/ui/label";
import axios from "axios";
import { toast } from "sonner";
import { videoApi } from "@/src/services/videos.service";
import { VideoLocalizationInput } from "@/src/types/video.types";

const LOCALES = [
  { code: "ka", label: "ქართული" },
  { code: "en", label: "English" },
  { code: "ru", label: "Русский" },
  { code: "tr", label: "Türkçe" },
  { code: "ar", label: "العربية" },
] as const;

type LocaleFields = { title: string; description: string };

export default function CreateVideo() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [locales, setLocales] = useState<Record<string, LocaleFields>>(
    Object.fromEntries(
      LOCALES.map((l) => [l.code, { title: "", description: "" }])
    )
  );

  const setLocaleField = (
    code: string,
    field: keyof LocaleFields,
    value: string
  ) => {
    setLocales((prev) => ({
      ...prev,
      [code]: { ...prev[code], [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!url.trim()) {
        toast.error("URL სავალდებულოა");
        setIsSubmitting(false);
        return;
      }

      try {
        new URL(url);
      } catch {
        toast.error("გთხოვთ შეიყვანოთ სწორი URL");
        setIsSubmitting(false);
        return;
      }

      const localizations: VideoLocalizationInput[] = LOCALES.filter(
        (l) => locales[l.code].title.trim()
      ).map((l) => ({
        locale: l.code,
        title: locales[l.code].title.trim(),
        ...(locales[l.code].description.trim() && {
          description: locales[l.code].description.trim(),
        }),
      }));

      // Legacy fallback fields: prefer Georgian, otherwise first filled locale
      const fallback =
        localizations.find((l) => l.locale === "ka") || localizations[0];

      const submitData = {
        url: url.trim(),
        ...(fallback && { title: fallback.title }),
        ...(fallback?.description && { description: fallback.description }),
        ...(category.trim() && { category: category.trim() }),
        ...(localizations.length > 0 && { localizations }),
      };

      await videoApi.post(submitData);

      toast.success("ვიდეო წარმატებით დაემატა");
      await queryClient.invalidateQueries({ queryKey: ["videos"] });
      router.push("?videos=all");
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        toast.error(error.response.data.message || "ვიდეოს დამატება ვერ მოხერხდა");
      } else {
        toast.error("მოხდა მოულოდნელი შეცდომა");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("?videos=all");
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">ვიდეოს დამატება</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="url">
                URL <span className="text-red-500">*</span>
              </Label>
              <Input
                id="url"
                name="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                required
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                შეიყვანეთ YouTube ან სხვა ვიდეო პლატფორმის ბმული
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">კატეგორია</Label>
              <Input
                id="category"
                name="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="მაგ: ტრანსფერები, ტურები, ზოგადი (არასავალდებულო)"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-base font-semibold">
                სათაური და აღწერა ენების მიხედვით{" "}
                <span className="text-gray-400 text-xs font-normal">
                  (არასავალდებულო)
                </span>
              </Label>

              {LOCALES.map((l) => (
                <div
                  key={l.code}
                  className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50/50"
                >
                  <p className="text-sm font-semibold text-brand-green">
                    {l.label}{" "}
                    <span className="text-gray-400 font-normal uppercase text-xs">
                      ({l.code})
                    </span>
                  </p>
                  <Input
                    value={locales[l.code].title}
                    onChange={(e) =>
                      setLocaleField(l.code, "title", e.target.value)
                    }
                    placeholder="სათაური"
                    disabled={isSubmitting}
                    dir={l.code === "ar" ? "rtl" : "ltr"}
                  />
                  <Textarea
                    value={locales[l.code].description}
                    onChange={(e) =>
                      setLocaleField(l.code, "description", e.target.value)
                    }
                    placeholder="აღწერა"
                    rows={2}
                    disabled={isSubmitting}
                    dir={l.code === "ar" ? "rtl" : "ltr"}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                გაუქმება
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    მიმდინარეობს...
                  </>
                ) : (
                  "შენახვა"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
