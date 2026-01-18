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
  CreateDriverFormData,
  useCreateDriverValidator,
} from "./CreateDriverValidator";
import { useQueryClient } from "@tanstack/react-query";
import { driversAPI } from "@/src/services/drivers.service";
import Image from "next/image";
import { handleFileToBase64 } from "@/src/utlis/base64/mainImageUpload";

const CreateDriver = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const router = useRouter();
  const form = useCreateDriverValidator();
  const queryClient = useQueryClient();

  const handleMainImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    form.setValue("photoFile", file);

    handleFileToBase64(event, (base64Image) => {
      form.setValue("photo", base64Image);
      setImagePreview(base64Image);
    });
  };

  const onSubmit = async (data: CreateDriverFormData) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);

      if (data.photoFile) {
        formData.append("photo", data.photoFile);
      }

      await driversAPI.post(formData);
      await queryClient.invalidateQueries({ queryKey: ["drivers"] });
      router.push("?drivers=all");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>ახალი მძღოლის დამატება</CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>სახელი *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="შეიყვანეთ სახელი"
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
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>გვარი *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="შეიყვანეთ გვარი"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="photo"
              render={() => (
                <FormItem>
                  <FormLabel>ფოტო (პროფილის სურათი)</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <Input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleMainImageUpload}
                        disabled={isSubmitting}
                      />

                      {imagePreview && (
                        <div className="relative w-40 h-40 border rounded-md overflow-hidden bg-gray-50">
                          <Image
                            src={imagePreview}
                            alt="მძღოლის ფოტო"
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !form.formState.isValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  იტვირთება...
                </>
              ) : (
                "მძღოლის დამატება"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default CreateDriver;
