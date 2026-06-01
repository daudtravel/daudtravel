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
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
        toast.error("კითხვის დეტალების ჩატვირთვა ვერ მოხერხდა");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqDetails();
  }, [form, params.id]);

  const onSubmit = async (data: EditFaqFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const filteredLocalizations = data.localizations.filter(
        (loc) =>
          loc.question && loc.question.trim() && loc.answer && loc.answer.trim()
      );

      if (filteredLocalizations.length === 0) {
        toast.error("მინიმუმ ერთი სრული თარგმანი აუცილებელია");
        return;
      }

      await faqApi.put(params.id, {
        localizations: filteredLocalizations as Omit<FAQLocalization, "id">[],
        category: data.category,
      });

      toast.success("კითხვა წარმატებით განახლდა");
      await queryClient.invalidateQueries({ queryKey: ["faqs"] });
      router.push("?faqs=all");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data?.message || "კითხვის განახლება ვერ მოხერხდა");
      } else {
        toast.error("მოხდა მოულოდნელი შეცდომა");
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
        <CardTitle>კითხვის რედაქტირება</CardTitle>
      </CardHeader>
      <CardContent>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>კატეგორია (არასავალდებულო)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="მაგ: ზოგადი, ტრანსფერები, გადახდა"
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
                  <h3 className="text-lg font-semibold capitalize">
                    {localeCode === "ka"
                      ? "ქართული"
                      : localeCode === "en"
                        ? "ინგლისური"
                        : localeCode === "ru"
                          ? "რუსული"
                          : localeCode === "tr"
                            ? "თურქული"
                            : "არაბული"}{" "}
                    თარგმანი
                  </h3>

                  <FormField
                    control={form.control}
                    name={`localizations.${index}.question`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>კითხვა</FormLabel>
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
                        <FormLabel>პასუხი</FormLabel>
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
                  იტვირთება...
                </>
              ) : (
                "განახლება"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default EditFaq;
