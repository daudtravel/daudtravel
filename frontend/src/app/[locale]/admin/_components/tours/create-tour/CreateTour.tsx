"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Loader2, Plus, X } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/src/components/ui/form";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Switch } from "@/src/components/ui/switch";
import RichTextEditor from "@/src/components/textEditor/TextEditor";
import {
  CreateTourFormData,
  createTourSchema,
  TourType,
} from "./CreateTourValidator";
import { useCreateTour } from "@/src/hooks/tours/useCreateTour";

export default function CreateTour() {
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [tourType, setTourType] = useState<TourType>(TourType.GROUP);

  const router = useRouter();
  const createMutation = useCreateTour();

  const form = useForm<CreateTourFormData>({
    resolver: zodResolver(createTourSchema),
    defaultValues: {
      type: TourType.GROUP,
      localizations: [
        {
          locale: "ka",
          name: "",
          description: "",
          startLocation: "",
          locations: [],
        },
      ],
      days: 1,
      nights: 0,
      mainImage: "",
      gallery: [],
      isPublic: false,
      isDaily: false,
      groupPricing: {
        totalPrice: 0,
        reservationPrice: 0,
        discountedPrice: 0,
      },
      individualPricing: {
        seasonTotalPrice: 0,
        seasonReservationPrice: 0,
        seasonDiscountedPrice: 0,
        offSeasonTotalPrice: 0,
        offSeasonReservationPrice: 0,
        offSeasonDiscountedPrice: 0,
      },
      maxPersons: 1,
      startDate: new Date().toISOString().split("T")[0],
    },
    mode: "onChange",
  });

  // Optimized: Convert to base64 only when submitting
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const onSubmit = async (data: CreateTourFormData) => {
    try {
      // Validate that main image file exists
      if (!mainImageFile) {
        form.setError("mainImage", {
          type: "manual",
          message: "Main image is required",
        });
        return;
      }

      // Convert files to base64 only at submit time (not during upload)
      const mainImageBase64 = await fileToBase64(mainImageFile);

      const galleryBase64: string[] = [];
      if (galleryFiles.length > 0) {
        // Convert all gallery images in parallel for speed
        const promises = galleryFiles.map((file) => fileToBase64(file));
        const results = await Promise.all(promises);
        galleryBase64.push(...results);
      }

      // Create the payload
      const payload = {
        ...data,
        mainImage: mainImageBase64,
        gallery: galleryBase64,
      };

      createMutation.mutate(payload, {
        onSuccess: () => {
          form.reset();
          setMainImagePreview(null);
          setMainImageFile(null);
          setGalleryPreviews([]);
          setGalleryFiles([]);
          router.push("?tours=all");
        },
      });
    } catch (error) {
      console.error("Error converting images:", error);
      form.setError("mainImage", {
        type: "manual",
        message: "Failed to process images. Please try again.",
      });
    }
  };

  const handleMainImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Store the file
      setMainImageFile(file);

      // Create preview using URL.createObjectURL (much faster than base64)
      const previewUrl = URL.createObjectURL(file);
      setMainImagePreview(previewUrl);
    }
  };

  const handleGalleryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Store files
    setGalleryFiles((prev) => [...prev, ...files]);

    // Create previews using URL.createObjectURL (instant, no encoding)
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setGalleryPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeGalleryImage = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(galleryPreviews[index]);

    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTypeChange = (checked: boolean) => {
    const newType = checked ? TourType.INDIVIDUAL : TourType.GROUP;
    setTourType(newType);
    form.setValue("type", newType);
  };

  const isSubmitting = createMutation.isPending;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>ახალი ტურის შექმნა</CardTitle>
      </CardHeader>
      <CardContent>
        {createMutation.isError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {createMutation.error instanceof Error
              ? createMutation.error.message
              : "შეცდომა მოხდა"}
          </div>
        )}
        {createMutation.isSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            ტური წარმატებით შეიქმნა
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={() => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">ტურის ტიპი</FormLabel>
                    <FormDescription>
                      აირჩიეთ ტურის ტიპი (ჯგუფური/ინდივიდუალური)
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={tourType === TourType.INDIVIDUAL}
                      onCheckedChange={handleTypeChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="localizations.0.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ტურის დასახელება</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="შეიყვანეთ ტურის დასახელება"
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
                  name="localizations.0.startLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>საწყისი ლოკაცია</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="შეიყვანეთ საწყისი ლოკაცია"
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
                name="localizations.0.locations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>შემდეგი ლოკაციები</FormLabel>
                    <div className="space-y-2">
                      {(field.value || []).map((location, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={location}
                            onChange={(e) => {
                              const newLocations = [...(field.value || [])];
                              newLocations[index] = e.target.value;
                              field.onChange(newLocations);
                            }}
                            disabled={isSubmitting}
                            placeholder={`ლოკაცია ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              const newLocations = (field.value || []).filter(
                                (_, i) => i !== index
                              );
                              field.onChange(newLocations);
                            }}
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          field.onChange([...(field.value || []), ""])
                        }
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        ლოკაციის დამატება
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="localizations.0.description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>აღწერა</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                        placeholder="შეიყვანეთ ტურის აღწერა"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>დღე</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="მაგ: 3"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nights"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ღამე</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="მაგ: 2"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {tourType === TourType.GROUP && (
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>თარიღი</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {tourType === TourType.GROUP && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">ჯგუფური ფასები</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="groupPricing.totalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>საერთო ფასი</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="groupPricing.reservationPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>დაჯავშნის ფასი</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="groupPricing.discountedPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ფასდაკლებული ფასი</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {tourType === TourType.INDIVIDUAL && (
              <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-medium">
                  ინდივიდუალური ტურის დეტალები
                </h3>

                <FormField
                  control={form.control}
                  name="maxPersons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ადამიანების რაოდენობა</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          placeholder="მაქსიმალური ადამიანების რაოდენობა"
                          {...field}
                          onChange={(e) =>
                            field.onChange(Number(e.target.value))
                          }
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <h4 className="font-medium">სეზონური ფასები</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="individualPricing.seasonTotalPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>საერთო ფასი</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="individualPricing.seasonDiscountedPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ფასდაკლებული ფასი</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="individualPricing.seasonReservationPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>დაჯავშნის ფასი</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">არასეზონური ფასები</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="individualPricing.offSeasonTotalPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>საერთო ფასი</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="individualPricing.offSeasonDiscountedPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ფასდაკლებული ფასი</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="individualPricing.offSeasonReservationPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>დაჯავშნის ფასი</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              {...field}
                              onChange={(e) =>
                                field.onChange(Number(e.target.value))
                              }
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="mainImage"
              render={() => (
                <FormItem>
                  <FormLabel>მთავარი სურათი</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageUpload}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  {mainImagePreview && (
                    <div className="mt-2">
                      <Image
                        width={400}
                        height={400}
                        src={mainImagePreview}
                        alt="მთავარი სურათის გადახედვა"
                        className="max-w-full h-auto max-h-48 object-cover rounded"
                      />
                    </div>
                  )}
                  <FormDescription>
                    ატვირთეთ ტურის მთავარი სურათი (PNG, JPEG, WebP)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gallery"
              render={() => (
                <FormItem>
                  <FormLabel>გალერეა (არასავალდებულო)</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryUpload}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  {galleryPreviews.length > 0 && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {galleryPreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <Image
                            width={200}
                            height={200}
                            src={preview}
                            alt={`გალერეის სურათი ${index + 1}`}
                            className="w-full h-32 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeGalleryImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <FormDescription>
                    ატვირთეთ დამატებითი სურათები გალერეისთვის
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  იტვირთება...
                </>
              ) : (
                "ტურის შექმნა"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
