import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Pencil,
  MapPin,
  Clock,
  Trash,
  Users,
  User,
} from "lucide-react";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Tour } from "@/src/types/tours.type";
import { toursAPI } from "@/src/services/tours.service";

const getImageUrl = (imagePath: string | null): string | null => {
  if (!imagePath) return null;

  if (imagePath.startsWith("http") || imagePath.startsWith("data:")) {
    return imagePath;
  }

  return `${process.env.NEXT_PUBLIC_BASE_URL}${imagePath}`;
};

export function ToursList() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["tours"],
    queryFn: () => toursAPI.getAdmin(),
  });

  const handleEditTour = (tourId: string) => {
    router.push(`?tours=${tourId}`);
  };

  const handleCreateTour = () => {
    router.push("?tours=createTour");
  };

  const handleDeleteTour = async (id: string) => {
    try {
      await toursAPI.delete(id);
      queryClient.invalidateQueries({ queryKey: ["tours"] });
    } catch (error) {
      console.error("Failed to delete tour:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const tours = data?.data || [];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
          ტურები
        </h1>
        <Button
          onClick={handleCreateTour}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">ტურის დამატება</span>
        </Button>
      </div>

      {tours.length === 0 && !error ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] p-6">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-base sm:text-lg mb-4 text-center">
              ტურები არ მოიძებნა
            </p>
            <Button onClick={handleCreateTour} variant="outline" size="lg">
              დაამატე პირველი ტური
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 rounded-lg font-semibold text-xs uppercase tracking-wide text-gray-600 border border-gray-200">
            <div className="col-span-2">სურათი</div>
            <div className="col-span-4">ტურის დასახელება</div>
            <div className="col-span-3">საწყისი ლოკაცია</div>
            <div className="col-span-2">ხანგრძლივობა</div>
            <div className="col-span-1 text-right">მოქმედებები</div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {tours.map((tour: Tour) => {
              const mainLocalization = tour.localizations[0] || {};
              const imageUrl = getImageUrl(tour.mainImage);

              return (
                <Card
                  key={tour.id}
                  className="hover:shadow-lg transition-all duration-200 border border-gray-200"
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="hidden lg:grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-2 flex flex-col items-center gap-2">
                        <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-gray-100 shadow-sm ring-1 ring-gray-200">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={mainLocalization.name || "Tour image"}
                              fill
                              className="object-cover"
                              unoptimized={
                                tour.mainImage?.startsWith("data:") || false
                              }
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <MapPin className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-full">
                          {tour.type === "INDIVIDUAL" ? (
                            <User className="h-3.5 w-3.5 text-gray-500" />
                          ) : (
                            <Users className="h-3.5 w-3.5 text-gray-500" />
                          )}
                          <span className="text-xs font-medium text-gray-600">
                            {tour.type === "INDIVIDUAL"
                              ? "ინდივიდუალური"
                              : "ჯგუფური"}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-4">
                        <span className="font-semibold text-sm text-gray-900">
                          {mainLocalization.name || "არ არის მითითებული"}
                        </span>
                      </div>

                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-50 rounded-lg">
                            <MapPin className="h-4 w-4 text-gray-500" />
                          </div>
                          <span className="text-sm text-gray-700">
                            {mainLocalization.startLocation ||
                              "არ არის მითითებული"}
                          </span>
                        </div>
                      </div>

                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-50 rounded-lg">
                            <Clock className="h-4 w-4 text-gray-500" />
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            {tour.days || "0"} დღე / {tour.nights || "0"} ღამე
                          </span>
                        </div>
                      </div>

                      <div className="col-span-1 flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTour(tour.id)}
                          className="hover:bg-gray-100"
                          aria-label="რედაქტირება"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-red-50 hover:text-red-600"
                              aria-label="წაშლა"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>ტურის წაშლა</AlertDialogTitle>
                              <AlertDialogDescription>
                                დარწმუნებული ხართ რომ გსურთ ტურის წაშლა? ეს
                                მოქმედება შეუქცევადია.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTour(tour.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                წაშლა
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    <div className="lg:hidden space-y-3">
                      <div className="flex gap-3 sm:gap-4">
                        <div className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm ring-1 ring-gray-200">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={mainLocalization.name || "Tour image"}
                              fill
                              className="object-cover"
                              unoptimized={
                                tour.mainImage?.startsWith("data:") || false
                              }
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <MapPin className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 line-clamp-2">
                            {mainLocalization.name || "არ არის მითითებული"}
                          </h3>

                          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-50 rounded-full w-fit mb-2">
                            {tour.type === "INDIVIDUAL" ? (
                              <User className="h-3.5 w-3.5 text-gray-500" />
                            ) : (
                              <Users className="h-3.5 w-3.5 text-gray-500" />
                            )}
                            <span className="text-xs font-medium text-gray-600">
                              {tour.type === "INDIVIDUAL"
                                ? "ინდივიდუალური"
                                : "ჯგუფური"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pl-1">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-50 rounded-lg">
                            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                          </div>
                          <span className="text-xs sm:text-sm text-gray-700 truncate">
                            {mainLocalization.startLocation ||
                              "არ არის მითითებული"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-50 rounded-lg">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500" />
                          </div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">
                            {tour.days || "0"} დღე / {tour.nights || "0"} ღამე
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTour(tour.id)}
                          className="flex-1"
                          aria-label="რედაქტირება"
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          <span className="text-xs sm:text-sm">
                            რედაქტირება
                          </span>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                              aria-label="წაშლა"
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              <span className="text-xs sm:text-sm">წაშლა</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-base sm:text-lg">
                                ტურის წაშლა
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-sm">
                                დარწმუნებული ხართ რომ გსურთ ტურის წაშლა? ეს
                                მოქმედება შეუქცევადია.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="w-full sm:w-auto">
                                გაუქმება
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteTour(tour.id)}
                                className="w-full sm:w-auto bg-red-500 hover:bg-red-600"
                              >
                                წაშლა
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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

export default ToursList;
