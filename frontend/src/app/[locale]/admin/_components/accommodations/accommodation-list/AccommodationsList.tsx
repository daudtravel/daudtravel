"use client";

import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Pencil,
  Trash,
  Building2,
  Home,
  MapPin,
  Users,
  BedDouble,
  EyeOff,
} from "lucide-react";
import Image from "next/image";
import { useQueryClient } from "@tanstack/react-query";
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
import { Accommodation } from "@/src/types/accommodations.type";
import { accommodationsService } from "@/src/services/accommodations.service";
import { useAdminAccommodations } from "@/src/hooks/accommodations/useAdminAccommodations";
import { QUERY_KEYS } from "@/src/constants/accommodations.constants";
import { toast } from "sonner";

export function AccommodationsList() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useAdminAccommodations({ limit: 1000 });

  const handleEdit = (id: string) => router.push(`?accommodations=${id}`);
  const handleCreate = () => router.push("?accommodations=create");

  const handleDelete = async (id: string) => {
    try {
      await accommodationsService.delete(id);
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ADMIN_ACCOMMODATIONS],
      });
      toast.success("განცხადება წაიშალა");
    } catch {
      toast.error("წაშლა ვერ მოხერხდა");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const items = data?.data || [];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">
          საცხოვრებელი
        </h1>
        <Button
          onClick={handleCreate}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">დამატება</span>
        </Button>
      </div>

      {items.length === 0 && !error ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center min-h-[300px] p-6">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-base sm:text-lg mb-4 text-center">
              განცხადებები არ მოიძებნა
            </p>
            <Button onClick={handleCreate} variant="outline" size="lg">
              დაამატე პირველი
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {items.map((item: Accommodation) => {
            const loc = item.localizations[0] || { name: "" };
            const isApartment = item.type === "APARTMENT";
            const imageUrl = `${process.env.NEXT_PUBLIC_BASE_URL}${item.mainImage}`;

            return (
              <Card
                key={item.id}
                className="hover:shadow-lg transition-all duration-200 border border-gray-200"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex gap-4 items-center">
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 ring-1 ring-gray-200">
                      <Image
                        src={imageUrl}
                        alt={loc.name || "Accommodation"}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                          {loc.name || "უსახელო"}
                        </h3>
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-50 rounded-full text-xs text-gray-600">
                          {isApartment ? (
                            <Home className="h-3 w-3" />
                          ) : (
                            <Building2 className="h-3 w-3" />
                          )}
                          {isApartment ? "აპარტამენტი" : "სასტუმრო"}
                        </span>
                        {!item.isPublic && (
                          <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs">
                            <EyeOff className="h-3 w-3" />
                            დამალული
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1.5 text-xs sm:text-sm text-gray-600 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {item.city}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {item.maxGuests}
                        </span>
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-3.5 w-3.5" />
                          {item.bedrooms}
                        </span>
                        <span className="font-semibold text-brand-green">
                          {item.price} ₾
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(item.id)}
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
                            <AlertDialogTitle>განცხადების წაშლა</AlertDialogTitle>
                            <AlertDialogDescription>
                              დარწმუნებული ხართ? ეს მოქმედება შეუქცევადია.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>გაუქმება</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(item.id)}
                              className="bg-red-500 hover:bg-red-600"
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
      )}
    </div>
  );
}

export default AccommodationsList;
