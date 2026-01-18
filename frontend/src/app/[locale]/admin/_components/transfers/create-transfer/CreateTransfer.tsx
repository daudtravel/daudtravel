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
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Loader2 } from "lucide-react";
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

const CreateTransfer = () => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const form = useCreateTransferValidator();

  const { mutate: createTransfer, isPending } = useCreateTransfer();

  const onSubmit = async (data: CreateTransferFormData) => {
    try {
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
            setTimeout(() => router.push(`?transfers=all`), 1500);
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

  const vehicleTypes = Object.values(VehicleType);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>ახალი ტრანსფერის შექმნა</CardTitle>
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="localizations.0.startLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>საწყისი ლოკაცია</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="შეიყვანეთ საწყისი ლოკაცია"
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
                name="localizations.0.endLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>საბოლოო ლოკაცია</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="შეიყვანეთ საბოლოო ლოკაცია"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Tabs defaultValue={vehicleTypes[0]} className="w-full">
              <TabsList
                className="grid w-full"
                style={{
                  gridTemplateColumns: `repeat(${vehicleTypes.length}, 1fr)`,
                }}
              >
                {vehicleTypes.map((type) => (
                  <TabsTrigger key={type} value={type}>
                    {type}
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
                          <FormLabel>ფასი</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              value={
                                field.value === null ||
                                field.value === undefined
                                  ? ""
                                  : field.value
                              }
                              onChange={(e) => {
                                const value =
                                  e.target.value === ""
                                    ? 0
                                    : parseFloat(e.target.value);
                                field.onChange(value);
                              }}
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
                              value={
                                field.value === null ||
                                field.value === undefined
                                  ? ""
                                  : field.value
                              }
                              onChange={(e) => {
                                const value =
                                  e.target.value === ""
                                    ? 1
                                    : parseInt(e.target.value);
                                field.onChange(value);
                              }}
                              disabled={isPending}
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

            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  იტვირთება...
                </>
              ) : (
                "ტრანსფერის შექმნა"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateTransfer;
