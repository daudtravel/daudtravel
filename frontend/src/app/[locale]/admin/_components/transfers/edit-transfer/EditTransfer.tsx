"use client";

import { useEffect } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  UpdateTransferFormData,
  useEditTransferValidator,
} from "./EditTransferValidator";
import { useLocale } from "next-intl";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { TRANSFER_MESSAGES } from "@/src/constants/transfers.constants";
import { useTransferById } from "@/src/hooks/transfers/useTransfersById";
import { useUpdateTransfer } from "@/src/hooks/transfers/useUpdateTransfer";
import { VehicleType } from "@/src/types/transfers.types";
import { SUPPORTED_LOCALES } from "../../tours/edit-tour/EditTourValidator";

const VEHICLE_LABEL: Record<string, string> = {
  SEDAN: "სედანი",
  MINIVAN: "მინივენი",
  VITO: "ვიტო",
  SPRINTER: "სპრინტერი",
  BUS: "ავტობუსი",
};

export function EditTransfer({ params }: { params: { id: string } }) {
  const router = useRouter();
  const locale = useLocale();
  const form = useEditTransferValidator();

  const { data: response, isLoading } = useTransferById(params.id);
  const { mutate: updateTransfer, isPending } = useUpdateTransfer();

  useEffect(() => {
    if (response?.data) {
      const transfer = response.data;
      const localizations = SUPPORTED_LOCALES.map((loc) => {
        const existing = transfer.localizations.find((l) => l.locale === loc);
        return { locale: loc, startLocation: existing?.startLocation || "", endLocation: existing?.endLocation || "" };
      });
      const allTypes = Object.values(VehicleType);
      const vehicleMap = Object.fromEntries(
        transfer.vehicleTypes.map((vt) => [vt.type, vt])
      );
      form.reset({
        localizations,
        vehicleTypes: allTypes.map((type) => ({
          type,
          price: vehicleMap[type]?.price ?? 0,
          maxPersons: vehicleMap[type]?.maxPersons ?? 4,
        })),
        isPublic: transfer.isPublic,
      });
    }
  }, [response, form]);

  const onSubmit = async (data: UpdateTransferFormData) => {
    const filteredLocalizations = data.localizations
      ?.filter((loc) => loc.startLocation && loc.endLocation)
      .map((loc) => ({
        locale: loc.locale,
        startLocation: loc.startLocation!,
        endLocation: loc.endLocation!,
      }));

    updateTransfer(
      {
        id: params.id,
        data: {
          ...data,
          localizations: filteredLocalizations?.length ? filteredLocalizations : undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(TRANSFER_MESSAGES.UPDATE_SUCCESS);
          router.push("?transfers=all");
        },
        onError: (error: unknown) => {
          const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
          toast.error(msg || TRANSFER_MESSAGES.GENERIC_ERROR);
        },
      }
    );
  };

  const vehicleTypes = Object.values(VehicleType);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-7 w-7 animate-spin text-brand-green-mid" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">ტრანსფერის რედაქტირება</h2>
        <p className="text-sm text-gray-400 mt-0.5">შეცვალეთ მარშრუტი, ენები ან ფასები</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Public toggle */}
          <div className="bg-brand-green-50 border border-brand-green-100 rounded-xl p-4">
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                      className="data-[state=checked]:bg-brand-green data-[state=checked]:border-brand-green"
                    />
                  </FormControl>
                  <div>
                    <FormLabel className="!mt-0 text-sm font-semibold text-gray-800 cursor-pointer">
                      საჯარო ტრანსფერი
                    </FormLabel>
                    <p className="text-xs text-gray-500">ჩართვისას ტრანსფერი ხელმისაწვდომი იქნება საიტზე</p>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Localizations + Vehicle types — side by side on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Localizations */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">თარგმანები</h3>
              <Tabs defaultValue={SUPPORTED_LOCALES[0]} className="w-full">
                <TabsList
                  className="grid w-full bg-brand-green-50 rounded-xl p-1"
                  style={{ gridTemplateColumns: `repeat(${SUPPORTED_LOCALES.length}, 1fr)` }}
                >
                  {SUPPORTED_LOCALES.map((loc) => (
                    <TabsTrigger
                      key={loc}
                      value={loc}
                      className="text-xs rounded-lg uppercase data-[state=active]:bg-brand-green data-[state=active]:text-white"
                    >
                      {loc}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {SUPPORTED_LOCALES.map((loc, index) => (
                  <TabsContent key={loc} value={loc} className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`localizations.${index}.startLocation`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-600">საწყისი ლოკაცია</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="მაგ. თბილისი"
                                {...field}
                                disabled={isPending}
                                className="border-gray-200 focus-visible:ring-brand-green text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`localizations.${index}.endLocation`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-600">საბოლოო ლოკაცია</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="მაგ. ბათუმი"
                                {...field}
                                disabled={isPending}
                                className="border-gray-200 focus-visible:ring-brand-green text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>

            {/* Vehicle types */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">ავტომობილის ტიპები</h3>
              <Tabs defaultValue={vehicleTypes[0]} className="w-full">
                <TabsList
                  className="grid w-full bg-brand-green-50 rounded-xl p-1"
                  style={{ gridTemplateColumns: `repeat(${vehicleTypes.length}, 1fr)` }}
                >
                  {vehicleTypes.map((type) => (
                    <TabsTrigger
                      key={type}
                      value={type}
                      className="text-xs rounded-lg data-[state=active]:bg-brand-green data-[state=active]:text-white"
                    >
                      {VEHICLE_LABEL[type] || type}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {vehicleTypes.map((type, index) => (
                  <TabsContent key={type} value={type} className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`vehicleTypes.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-600">ფასი (₾)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                value={field.value === null || field.value === undefined ? "" : field.value}
                                onChange={(e) => field.onChange(e.target.value === "" ? 0 : parseFloat(e.target.value))}
                                disabled={isPending}
                                className="border-gray-200 focus-visible:ring-brand-green text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`vehicleTypes.${index}.maxPersons`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-semibold text-gray-600">მაქს. პასაჟირები</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="4"
                                {...field}
                                value={field.value === null || field.value === undefined ? "" : field.value}
                                onChange={(e) => field.onChange(e.target.value === "" ? 1 : parseInt(e.target.value))}
                                disabled={isPending}
                                className="border-gray-200 focus-visible:ring-brand-green text-sm"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-green hover:bg-brand-green-dark text-white font-semibold text-sm transition-colors disabled:opacity-60"
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" />განახლება...</>
            ) : (
              "განახლება"
            )}
          </button>
        </form>
      </Form>
    </div>
  );
}

export default EditTransfer;
