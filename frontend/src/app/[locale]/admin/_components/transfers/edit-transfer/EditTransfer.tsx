"use client";

import { useState, useEffect } from "react";
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
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  UpdateTransferFormData,
  useEditTransferValidator,
} from "./EditTransferValidator";
import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Checkbox } from "@/src/components/ui/checkbox";
import { TRANSFER_MESSAGES } from "@/src/constants/transfers.constants";
import { useTransferById } from "@/src/hooks/transfers/useTransfersById";
import { useUpdateTransfer } from "@/src/hooks/transfers/useUpdateTransfer";
import { VehicleType } from "@/src/types/transfers.types";
import { SUPPORTED_LOCALES } from "../../tours/edit-tour/EditTourValidator";

export function EditTransfer({ params }: { params: { id: string } }) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const form = useEditTransferValidator();

  const { data: response, isLoading } = useTransferById(params.id);
  const { mutate: updateTransfer, isPending } = useUpdateTransfer();

  useEffect(() => {
    if (response?.data) {
      const transfer = response.data;

      const localizations = SUPPORTED_LOCALES.map((loc) => {
        const existing = transfer.localizations.find((l) => l.locale === loc);
        return {
          locale: loc,
          startLocation: existing?.startLocation || "",
          endLocation: existing?.endLocation || "",
        };
      });

      form.reset({
        localizations,
        vehicleTypes: transfer.vehicleTypes.map((vt) => ({
          type: vt.type,
          price: vt.price,
          maxPersons: vt.maxPersons,
        })),
        isPublic: transfer.isPublic,
      });
    }
  }, [response, form]);

  const onSubmit = async (data: UpdateTransferFormData) => {
    try {
      setErrorMessage(null);

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
            localizations:
              filteredLocalizations && filteredLocalizations.length > 0
                ? filteredLocalizations
                : undefined,
          },
        },
        {
          onSuccess: () => {
            setSuccessMessage(TRANSFER_MESSAGES.UPDATE_SUCCESS);
            setTimeout(() => router.push("?transfers=all"), 1500);
          },
          onError: (error: any) => {
            const message =
              error?.response?.data?.message || TRANSFER_MESSAGES.GENERIC_ERROR;
            setErrorMessage(message);
          },
        }
      );
    } catch (error) {
      setErrorMessage(TRANSFER_MESSAGES.GENERIC_ERROR);
      console.error(error);
    }
  };

  const addVehicleType = () => {
    const current = form.getValues("vehicleTypes") || [];
    form.setValue("vehicleTypes", [
      ...current,
      { type: VehicleType.SEDAN, price: 0, maxPersons: 4 },
    ]);
  };

  const removeVehicleType = (index: number) => {
    const current = form.getValues("vehicleTypes") || [];
    form.setValue(
      "vehicleTypes",
      current.filter((_, i) => i !== index)
    );
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
        <CardTitle>ტრანსფერის რედაქტირება</CardTitle>
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
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">საჯარო ტრანსფერი</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">თარგმანები</h3>

              {SUPPORTED_LOCALES.map((loc, index) => (
                <Card key={loc} className="p-4">
                  <div className="space-y-4">
                    <h4 className="font-medium uppercase">{loc} თარგმანი</h4>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`localizations.${index}.startLocation`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>საწყისი ლოკაცია</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="საწყისი ლოკაცია"
                                {...field}
                                disabled={isPending}
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
                            <FormLabel>საბოლოო ლოკაცია</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="საბოლოო ლოკაცია"
                                {...field}
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">ავტომობილის ტიპები</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVehicleType}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  დამატება
                </Button>
              </div>

              {form.watch("vehicleTypes")?.map((_, index) => (
                <Card key={index} className="p-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">ავტომობილი {index + 1}</h4>
                      {(form.watch("vehicleTypes")?.length || 0) > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVehicleType(index)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`vehicleTypes.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ტიპი</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isPending}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="აირჩიეთ ტიპი" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.values(VehicleType).map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name={`vehicleTypes.${index}.price`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ფასი</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseFloat(e.target.value))
                                }
                                disabled={isPending}
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
                            <FormLabel>მაქსიმალური პერსონები</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="4"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                                disabled={isPending}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  განახლება...
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

export default EditTransfer;
