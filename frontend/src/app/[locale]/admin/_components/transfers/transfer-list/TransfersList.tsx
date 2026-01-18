"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Pencil,
  Car,
  Trash,
  ArrowRight,
  MapPin,
  DollarSign,
} from "lucide-react";
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
import { TRANSFER_MESSAGES } from "@/src/constants/transfers.constants";
import { useAdminTransfers } from "@/src/hooks/transfers/useAdminTransfers";
import { useDeleteTransfer } from "@/src/hooks/transfers/useDeleteTransfer";
import { Transfer } from "@/src/types/transfers.types";

export function TransfersList() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, isError } = useAdminTransfers({ locale });
  const { mutate: deleteTransfer, isPending: isDeleting } = useDeleteTransfer();

  const transfers = data?.data || [];

  const handleDeleteTransfer = async (id: string) => {
    setDeleteError(null);
    deleteTransfer(id, {
      onSuccess: () => {},
      onError: (error: any) => {
        const message =
          error?.response?.data?.message || TRANSFER_MESSAGES.DELETE_ERROR;
        setDeleteError(message);
        alert(message);
      },
    });
  };

  const handleEditTransfer = (transferId: string) => {
    router.push(`?transfers=${transferId}`);
  };

  const handleCreateTransfer = () => {
    router.push("?transfers=createTransfer");
  };

  const getLowestPrice = (transfer: Transfer) => {
    if (!transfer.vehicleTypes || transfer.vehicleTypes.length === 0)
      return null;

    const prices = transfer.vehicleTypes.map((vt) => vt.price);
    return Math.min(...prices);
  };

  const getHighestPrice = (transfer: Transfer) => {
    if (!transfer.vehicleTypes || transfer.vehicleTypes.length === 0)
      return null;

    const prices = transfer.vehicleTypes.map((vt) => vt.price);
    return Math.max(...prices);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 font-medium">
              ტრანსფერების ჩატვირთვა ვერ მოხერხდა
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
            ტრანსფერები
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            სულ: {transfers.length} ტრანსფერი
          </p>
        </div>
        <Button
          onClick={handleCreateTransfer}
          className="w-full sm:w-auto flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="text-sm sm:text-base">ახალი ტრანსფერი</span>
        </Button>
      </div>

      {deleteError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-700 text-sm">{deleteError}</p>
          </CardContent>
        </Card>
      )}

      {transfers.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center min-h-[300px] sm:min-h-[400px] p-6">
            <div className="rounded-full bg-gray-100 p-4 mb-4">
              <Car className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-base sm:text-lg mb-4 text-center">
              ტრანსფერები არ მოიძებნა
            </p>
            <Button onClick={handleCreateTransfer} variant="outline" size="lg">
              პირველი ტრანსფერის დამატება
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {transfers.map((transfer: Transfer) => {
            const localization =
              transfer.localizations.find((loc) => loc.locale === locale) ||
              transfer.localizations[0];
            const lowestPrice = getLowestPrice(transfer);
            const highestPrice = getHighestPrice(transfer);

            return (
              <Card
                key={transfer.id}
                className="hover:shadow-lg transition-all duration-200 border border-gray-200"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="p-1.5 bg-gray-50 rounded-lg">
                            <MapPin className="h-4 w-4 text-gray-500" />
                          </div>
                          <span className="text-xs text-gray-500 font-medium">
                            მარშრუტი
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm sm:text-base font-semibold text-gray-900">
                          <span className="truncate">
                            {localization?.startLocation || "N/A"}
                          </span>
                          <ArrowRight className="h-4 w-4 text-gray-400 hidden sm:block" />
                          <span className="text-gray-400 sm:hidden">↓</span>
                          <span className="truncate">
                            {localization?.endLocation || "N/A"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                            transfer.isPublic
                              ? "bg-green-100 text-green-700 ring-1 ring-green-200"
                              : "bg-gray-100 text-gray-700 ring-1 ring-gray-200"
                          }`}
                        >
                          {transfer.isPublic ? "საჯარო" : "პირადი"}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gray-50 rounded-lg">
                          <Car className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs text-gray-500">
                            ავტომობილის ტიპები
                          </div>
                          <div className="text-sm font-medium text-gray-700">
                            {transfer.vehicleTypes.length} ტიპი
                          </div>
                        </div>
                      </div>

                      {lowestPrice && highestPrice && (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-50 rounded-lg">
                            <DollarSign className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-gray-500">
                              ფასების დიაპაზონი
                            </div>
                            <div className="text-sm font-bold text-gray-900">
                              ${lowestPrice} - ${highestPrice}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {transfer.vehicleTypes.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="text-xs text-gray-500 mb-2">
                          ხელმისაწვდომი ავტომობილები:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {transfer.vehicleTypes.map((vt) => (
                            <span
                              key={vt.id}
                              className="px-2.5 py-1 bg-gray-50 rounded-md text-xs font-medium text-gray-700 border border-gray-200"
                            >
                              {vt.type} - ${vt.price}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTransfer(transfer.id)}
                        className="flex-1"
                        disabled={isDeleting}
                        aria-label="რედაქტირება"
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        <span className="text-xs sm:text-sm">რედაქტირება</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            disabled={isDeleting}
                            aria-label="წაშლა"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            <span className="text-xs sm:text-sm">წაშლა</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[90vw] sm:max-w-md">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base sm:text-lg">
                              ტრანსფერის წაშლა
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-sm">
                              დარწმუნებული ხართ რომ გსურთ ამ ტრანსფერის წაშლა?
                              ეს მოქმედება შეუქცევადია.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                            <AlertDialogCancel className="w-full sm:w-auto">
                              გაუქმება
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteTransfer(transfer.id)}
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
      )}
    </div>
  );
}

export default TransfersList;
