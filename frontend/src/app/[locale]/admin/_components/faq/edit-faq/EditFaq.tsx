"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Loader2 } from "lucide-react";
import { useRouter } from "@/src/i18n/routing";
import { adminPaths } from "@/src/utlis/admin/paths";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useQueryClient } from "@tanstack/react-query";
import { faqApi, FAQLocalization } from "@/src/services/faq.service";
import {
  EditFaqFormData,
  SUPPORTED_LOCALES,
  useEditFaqValidator,
} from "../FaqValidator";

export function EditFaq({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const form = useEditFaqValidator();
  const t = useTranslations("admin");

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchFaqDetails = async () => {
      try {
        setIsLoading(true);
        const response = await faqApi.getById(params.id);

        const faq = response.data;

        const formData: EditFaqFormData = {
          localizations: SUPPORTED_LOCALES.map((locale) => {
            const localization = faq.localizations.find(
              (loc: { locale: string }) => loc.locale === locale
            );

            return {
              locale,
              question: localization?.question || "",
              answer: localization?.answer || "",
            };
          }),
          category: faq.category || "",
        };

        form.reset(formData);
      } catch {
        toast.error(t("faq.loadFailed"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqDetails();
  }, [form, params.id, t]);

  const onSubmit = async (data: EditFaqFormData) => {
    try {
      setIsSubmitting(true);

      const filteredLocalizations = data.localizations.filter(
        (loc) =>
          loc.question && loc.question.trim() && loc.answer && loc.answer.trim()
      );

      if (filteredLocalizations.length === 0) {
        toast.error(t("faq.minOneTranslation"));
        return;
      }

      await faqApi.put(params.id, {
        localizations: filteredLocalizations as Omit<FAQLocalization, "id">[],
        category: data.category,
      });

      toast.success(t("faq.updated"));
      await queryClient.invalidateQueries({ queryKey: ["faqs"] });
      router.push(adminPaths.websiteFaqs);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || t("faq.updateFailed"));
      } else {
        toast.error(t("common.unexpectedError"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("faq.editTitle")}</CardTitle>
      </CardHeader>
      <CardContent>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("common.categoryOptional")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("faq.categoryPlaceholder")}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SUPPORTED_LOCALES.map((localeCode, index) => (
                <div
                  key={localeCode}
                  className="space-y-4 p-4 border rounded-lg"
                >
                  <h3 className="text-lg font-semibold">
                    {t("faq.languageTranslation", {
                      language: t(`common.languages.${localeCode}`),
                    })}
                  </h3>

                  <FormField
                    control={form.control}
                    name={`localizations.${index}.question`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("faq.question")}</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSubmitting} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`localizations.${index}.answer`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("faq.answer")}</FormLabel>
                        <FormControl>
                          <Textarea
                            className="min-h-[120px]"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("common.update")
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default EditFaq;
