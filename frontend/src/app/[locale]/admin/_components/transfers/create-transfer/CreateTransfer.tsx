"use client";

import { useState } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  CreateTransferFormData,
  useCreateTransferValidator,
} from "./CreateTransferValidator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Checkbox } from "@/src/components/ui/checkbox";
import { TRANSFER_MESSAGES } from "@/src/constants/transfers.constants";
import { VehicleType } from "@/src/types/transfers.types";
import { useCreateTransfer } from "@/src/hooks/transfers/useCreateTransfer";

const VEHICLE_EMOJI: Record<string, string> = {
  SEDAN: "🚗",
  MINIVAN: "🚐",
  VITO: "🚌",
  SPRINTER: "🚌",
  BUS: "🚍",
};

const CreateTransfer = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const form = useCreateTransferValidator();
  const { mutate: createTransfer, isPending } = useCreateTransfer();

  const onSubmit = async (data: CreateTransferFormData) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    const filteredLocalizations = data.localizations?.filter(
      (loc) => loc.startLocation && loc.endLocation
    );

    createTransfer(
      {
        ...data,
        localizations:
          filteredLocalizations && filteredLocalizations.length > 0
            ? filteredLocalizations
            : undefined,
      },
      {
        onSuccess: () => {
          setSuccessMessage(TRANSFER_MESSAGES.CREATE_SUCCESS);
          form.reset();
          setTimeout(() => router.push("?transfers=all"), 1500);
        },
        onError: (error: unknown) => {
          const msg = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setErrorMessage(msg || TRANSFER_MESSAGES.GENERIC_ERROR);
        },
      }
    );
  };

  const vehicleTypes = Object.values(VehicleType);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-gray-900">ახალი ტრანსფერის შექმნა</h2>
        <p className="text-sm text-gray-400 mt-0.5">შეავსეთ მარშრუტი და ავტომობილის ტიპები</p>
      </div>

      {errorMessage && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="flex items-start gap-2 bg-brand-green-50 border border-brand-green-100 rounded-xl px-4 py-3 text-sm text-brand-green">
          <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          {successMessage}
        </div>
      )}

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

          {/* Route + Vehicle types — side by side on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            {/* Route */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">მარშრუტი</h3>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="localizations.0.startLocation"
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
                  name="localizations.0.endLocation"
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
            </div>

            {/* Vehicle types */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">ავტომობილის ტიპები</h3>
            <Tabs defaultValue={vehicleTypes[0]} className="w-full">
              <TabsList className="grid w-full bg-brand-green-50 rounded-xl p-1" style={{ gridTemplateColumns: `repeat(${vehicleTypes.length}, 1fr)` }}>
                {vehicleTypes.map((type) => (
                  <TabsTrigger
                    key={type}
                    value={type}
                    className="text-xs rounded-lg data-[state=active]:bg-brand-green data-[state=active]:text-white"
                  >
                    {VEHICLE_EMOJI[type]} {type}
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
              <><Loader2 className="h-4 w-4 animate-spin" />იტვირთება...</>
            ) : (
              "ტრანსფერის შექმნა"
            )}
          </button>
        </form>
      </Form>
    </div>
  );
};

export default CreateTransfer;
