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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const locale = params.locale as string;

  // Initialize form with all locales
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
      setErrorMessage(null);
      setSuccessMessage(null);

      const filteredLocalizations = data.localizations.filter(
        (loc) => loc.question.trim() !== "" && loc.answer.trim() !== ""
      );

      if (filteredLocalizations.length === 0) {
        setErrorMessage("მინიმუმ ერთი სრული თარგმანი აუცილებელია");
        setIsSubmitting(false);
        return;
      }

      const submitData = {
        localizations: filteredLocalizations,
        ...(data.category &&
          data.category.trim() && { category: data.category }),
      };

      await faqApi.post(submitData);

      setSuccessMessage("კითხვა წარმატებით შეიქმნა");
      await queryClient.invalidateQueries({ queryKey: ["faqs"] });

      setTimeout(() => {
        router.push(`?faqs=all`);
      }, 1500);
    } catch (error) {
      console.error("Error creating FAQ:", error);
      if (axios.isAxiosError(error) && error.response) {
        const errorMsg =
          error.response.data.message || "კითხვის შექმნა ვერ მოხერხდა";
        setErrorMessage(errorMsg);
      } else {
        setErrorMessage("მოულოდნელი შეცდომა. გთხოვთ სცადოთ თავიდან");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>ახალი კითხვის დამატება</CardTitle>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
            {successMessage}
          </div>
        )}

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

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                თარგმანები
                <span className="text-sm font-normal text-gray-500 ml-2">
                  (მინიმუმ ერთი აუცილებელია)
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
                        {localeCode === "ka"
                          ? "ქართული"
                          : localeCode === "en"
                            ? "ინგლისური"
                            : localeCode === "ru"
                              ? "რუსული"
                              : localeCode === "tr"
                                ? "თურქული"
                                : "არაბული"}
                      </span>
                    </h4>

                    <FormField
                      control={form.control}
                      name={`localizations.${index}.question`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>კითხვა</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="შეიყვანეთ კითხვა"
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
                          <FormLabel>პასუხი</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="შეიყვანეთ პასუხი"
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
                გაუქმება
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    იტვირთება...
                  </>
                ) : (
                  "კითხვის დამატება"
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
