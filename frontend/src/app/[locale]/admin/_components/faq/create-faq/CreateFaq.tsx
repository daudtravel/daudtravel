"use client";

import { useState } from "react";
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
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Textarea } from "@/src/components/ui/textarea";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SUPPORTED_LOCALES } from "../FaqValidator";
import { faqApi } from "@/src/services/faq.service";

const createFaqSchema = z.object({
  localizations: z.array(
    z.object({
      locale: z.string(),
      question: z.string(),
      answer: z.string(),
    })
  ),
  category: z.string().optional(),
});

type CreateFaqForm = z.infer<typeof createFaqSchema>;

const CreateFaq = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const t = useTranslations("admin");

  const form = useForm<CreateFaqForm>({
    resolver: zodResolver(createFaqSchema),
    defaultValues: {
      localizations: SUPPORTED_LOCALES.map((loc) => ({
        locale: loc,
        question: "",
        answer: "",
      })),
      category: "",
    },
  });

  const onSubmit = async (data: CreateFaqForm) => {
    try {
      setIsSubmitting(true);

      const filteredLocalizations = data.localizations.filter(
        (loc) => loc.question.trim() !== "" && loc.answer.trim() !== ""
      );

      if (filteredLocalizations.length === 0) {
        toast.error(t("faq.minOneTranslation"));
        setIsSubmitting(false);
        return;
      }

      const submitData = {
        localizations: filteredLocalizations,
        ...(data.category &&
          data.category.trim() && { category: data.category }),
      };

      await faqApi.post(submitData);

      toast.success(t("faq.created"));
      await queryClient.invalidateQueries({ queryKey: ["faqs"] });
      router.push(`?faqs=all`);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        const errorMsg =
          error.response.data.message || t("faq.createFailed");
        toast.error(errorMsg);
      } else {
        toast.error(t("common.unexpectedErrorRetry"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>{t("faq.createTitle")}</CardTitle>
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

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                {t("common.translations")}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  {t("common.atLeastOneRequired")}
                </span>
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {SUPPORTED_LOCALES.map((localeCode, index) => (
                  <div
                    key={localeCode}
                    className="space-y-4 p-4 border rounded-lg bg-gray-50"
                  >
                    <h4 className="text-md font-semibold flex items-center gap-2">
                      <span className="uppercase">{localeCode}</span>
                      <span className="text-sm font-normal text-gray-600">
                        {t(`common.languages.${localeCode}`)}
                      </span>
                    </h4>

                    <FormField
                      control={form.control}
                      name={`localizations.${index}.question`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("faq.question")}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("faq.questionPlaceholder")}
                              {...field}
                              disabled={isSubmitting}
                            />
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
                              placeholder={t("faq.answerPlaceholder")}
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
            </div>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push("?faqs=all")}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("common.loading")}
                  </>
                ) : (
                  t("faq.add")
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateFaq;
