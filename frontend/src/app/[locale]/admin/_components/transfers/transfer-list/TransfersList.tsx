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
} from "lucide-react";
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

const VEHICLE_EMOJI: Record<string, string> = {
  SEDAN: "🚗",
  MINIVAN: "🚐",
  VITO: "🚌",
  SPRINTER: "🚌",
  BUS: "🚍",
};

export function TransfersList() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data, isLoading, isError } = useAdminTransfers({ locale });
  const { mutate: deleteTransfer, isPending: isDeleting } = useDeleteTransfer();

  const transfers = data?.data || [];

  const handleDelete = (id: string) => {
    setDeleteError(null);
    deleteTransfer(id, {
      onSuccess: () => {},
      onError: (error: unknown) => {
        const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || TRANSFER_MESSAGES.DELETE_ERROR;
        setDeleteError(msg);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-7 w-7 animate-spin text-brand-green-mid" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600 font-medium text-sm">ტრანსფერების ჩატვირთვა ვერ მოხერხდა</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">ტრანსფერები</h1>
          <p className="text-sm text-gray-400 mt-0.5">სულ: {transfers.length} ტრანსფერი</p>
        </div>
        <button
          onClick={() => router.push("?transfers=createTransfer")}
          className="flex items-center gap-2 bg-brand-green hover:bg-brand-green-dark text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          ახალი ტრანსფერი
        </button>
      </div>

      {deleteError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
          {deleteError}
        </div>
      )}

      {transfers.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center min-h-[320px] p-8 gap-4">
          <div className="w-14 h-14 rounded-full bg-brand-green-50 flex items-center justify-center">
            <Car className="h-7 w-7 text-brand-green-mid" />
          </div>
          <p className="text-gray-500 text-base">ტრანსფერები არ მოიძებნა</p>
          <button
            onClick={() => router.push("?transfers=createTransfer")}
            className="flex items-center gap-2 border border-brand-green text-brand-green hover:bg-brand-green-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            პირველი ტრანსფერის დამატება
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {transfers.map((transfer: Transfer) => {
            const loc =
              transfer.localizations.find((l) => l.locale === locale) ||
              transfer.localizations[0];
            const prices = transfer.vehicleTypes.map((vt) => vt.price);
            const minP = prices.length ? Math.min(...prices) : null;
            const maxP = prices.length ? Math.max(...prices) : null;

            return (
              <div
                key={transfer.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="h-0.5 bg-brand-green" />
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Route */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <MapPin className="h-3.5 w-3.5 text-brand-green shrink-0" />
                        <span className="text-xs font-semibold uppercase tracking-wide text-brand-green-mid">
                          მარშრუტი
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm font-bold text-gray-900 flex-wrap">
                        <span>{loc?.startLocation || "N/A"}</span>
                        <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
                        <span className="text-gray-700">{loc?.endLocation || "N/A"}</span>
                      </div>
                    </div>

                    {/* Right meta */}
                    <div className="flex items-center gap-3 shrink-0">
                      {minP !== null && (
                        <span className="text-base font-bold text-brand-green">
                          ₾{minP}{minP !== maxP ? ` – ₾${maxP}` : ""}
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          transfer.isPublic
                            ? "bg-brand-green-100 text-brand-green"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {transfer.isPublic ? "საჯარო" : "პირადი"}
                      </span>
                    </div>
                  </div>

                  {/* Vehicle chips */}
                  {transfer.vehicleTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
                      {transfer.vehicleTypes.map((vt) => (
                        <span
                          key={vt.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-brand-green-50 border border-brand-green-100 rounded-lg text-xs font-medium text-brand-green"
                        >
                          <span>{VEHICLE_EMOJI[vt.type] || "🚗"}</span>
                          <span>{vt.type}</span>
                          <span className="text-brand-green-mid font-normal">₾{vt.price}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-3 pt-3 border-t border-gray-50">
                    <button
                      onClick={() => router.push(`?transfers=${transfer.id}`)}
                      disabled={isDeleting}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-brand-green-50 hover:border-brand-green-100 hover:text-brand-green transition-colors disabled:opacity-50"
                    >
                      <Pencil className="h-4 w-4" />
                      რედაქტირება
                    </button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          disabled={isDeleting}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors disabled:opacity-50"
                        >
                          <Trash className="h-4 w-4" />
                          წაშლა
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-sm rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>ტრანსფერის წაშლა</AlertDialogTitle>
                          <AlertDialogDescription className="text-sm">
                            დარწმუნებული ხართ რომ გსურთ ამ ტრანსფერის წაშლა? ეს მოქმედება შეუქცევადია.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">გაუქმება</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(transfer.id)}
                            className="rounded-xl bg-red-500 hover:bg-red-600"
                          >
                            წაშლა
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TransfersList;
