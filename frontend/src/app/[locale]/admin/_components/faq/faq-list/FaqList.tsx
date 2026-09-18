import { useParams, useRouter } from "next/navigation";
import { Plus, Loader2, Pencil, Trash } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import { getFAQ } from "@/src/types/faq.types";
import { faqApi } from "@/src/services/faq.service";

export function FaqList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("admin");

  const { data, isLoading, error } = useQuery({
    queryKey: ["faqs", locale],
    queryFn: () => faqApi.get(locale),
  });

  const faqs = data?.data || [];

  const handleDeleteFaq = async (id: string) => {
    try {
      await faqApi.delete(id);
      queryClient.invalidateQueries({ queryKey: ["faqs"] });
      toast.success(t("faq.deleted"));
    } catch {
      toast.error(t("faq.deleteFailed"));
    }
  };

  const handleEditFaq = (faqId: string) => {
    router.push(`?faqs=${faqId}`);
  };

  const handleCreateFaq = () => {
    router.push("?faqs=createFaq");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">{t("faq.title")}</h1>
        <Button onClick={handleCreateFaq} className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          <span>{t("faq.add")}</span>
        </Button>
      </div>

      {faqs.length === 0 && !error ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg">
          <p className="text-gray-500 text-lg mb-4">{t("faq.notFound")}</p>
          <Button onClick={handleCreateFaq} variant="outline">
            {t("faq.addFirst")}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-100 rounded-lg font-medium text-sm text-gray-600">
            <div className="col-span-5">{t("faq.question")}</div>
            <div className="col-span-5">{t("faq.answer")}</div>
            <div className="col-span-2">{t("common.actions")}</div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq: getFAQ) => {
              const localization =
                faq.localizations.find((l) => l.locale === locale) ||
                faq.localizations[0];

              return (
                <Card
                  key={faq.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-5">
                        <div className="font-semibold line-clamp-2">
                          {localization.question}
                        </div>
                      </div>

                      <div className="col-span-5">
                        <div className="text-sm text-gray-600 line-clamp-3">
                          {localization.answer}
                        </div>
                      </div>

                      <div className="col-span-2 flex justify-end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-black"
                            >
                              <Trash className="h-4 w-4 text-red-700" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t("faq.deleteTitle")}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("faq.deleteConfirm")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteFaq(faq.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                {t("common.delete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditFaq(faq.id)}
                          className="text-gray-600 hover:text-black"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default FaqList;
