"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/src/i18n/routing";
import { adminPaths } from "@/src/utlis/admin/paths";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import {
  Form,
  FormControl,
  FormDescription,
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
import { Switch } from "@/src/components/ui/switch";
import RichTextEditor from "@/src/components/textEditor/TextEditor";
import { toursAPI } from "@/src/services/tours.service";
import {
  EditTourFormData,
  SUPPORTED_LOCALES,
  useEditTourForm,
} from "./EditTourValidator";
import { TourType, UpdateTourInput } from "@/src/types/tours.type";

export function EditTour({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTranslations("admin");

  const tourId = id;
  const form = useEditTourForm(tourId || "");

  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null);
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [hasNewMainImage, setHasNewMainImage] = useState(false);

  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);

  const {
    data: tourData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tour", tourId],
    queryFn: () => toursAPI.getByIdAllLocales(tourId),
    enabled: !!tourId,
  });

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const updateMutation = useMutation({
    mutationFn: async (data: EditTourFormData) => {
      let mainImageBase64: string | undefined = undefined;
      if (mainImageFile) {
        mainImageBase64 = await fileToBase64(mainImageFile);
      }

      const newGalleryBase64: string[] = [];
      if (galleryFiles.length > 0) {
        const promises = galleryFiles.map((file) => fileToBase64(file));
        const results = await Promise.all(promises);
        newGalleryBase64.push(...results);
      }

      const combinedGallery = [...existingGalleryUrls, ...newGalleryBase64];

      const payload = {
        ...data,
        mainImage: mainImageBase64,
        gallery: combinedGallery,
      } as UpdateTourInput;

      return toursAPI.put(tourId, payload);
    },
    onSuccess: () => {
      toast.success(t("tours.updated"));
      queryClient.invalidateQueries({ queryKey: ["tours"] });
      queryClient.invalidateQueries({ queryKey: ["tour", tourId] });
      router.push(adminPaths.websiteTours);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("tours.updateFailed"));
    },
  });

  const tourType = form.watch("type");
  const isSubmitting = form.formState.isSubmitting || updateMutation.isPending;

  useEffect(() => {
    if (!tourData?.data) return;

    const tour = tourData.data;

    const formattedLocalizations = SUPPORTED_LOCALES.map((locale) => {
      const loc = tour.localizations?.find((l: any) => l.locale === locale);
      return {
        locale,
        name: loc?.name || "",
        startLocation: loc?.startLocation || "",
        locations: loc?.locations || [],
        description: loc?.description || "",
      };
    });

    const galleryUrls = tour.images?.map((img: any) => img.url) || [];
    setExistingGalleryUrls(galleryUrls);
    setGalleryPreviews(galleryUrls);

    form.reset({
      type: tour.type as TourType,
      localizations: formattedLocalizations,
      days: tour.days || 1,
      nights: tour.nights || 0,
      isPublic: tour.isPublic || false,
      isDaily: tour.isDaily || false,
      startDate: tour.startDate
        ? new Date(tour.startDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      mainImage: tour.mainImage || null,
      gallery: galleryUrls,
      groupPricing: tour.groupPricing || {
        totalPrice: 0,
        reservationPrice: 0,
        discountedPrice: 0,
      },
      individualPricing: tour.individualPricing || {
        seasonTotalPrice: 0,
        seasonReservationPrice: 0,
        seasonDiscountedPrice: 0,
        offSeasonTotalPrice: 0,
        offSeasonReservationPrice: 0,
        offSeasonDiscountedPrice: 0,
      },
      maxPersons: tour.maxPersons || 1,
    });

    setMainImagePreview(tour.mainImage);
  }, [tourData, form]);

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      setHasNewMainImage(true);
      const previewUrl = URL.createObjectURL(file);
      setMainImagePreview(previewUrl);
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setGalleryFiles((prev) => [...prev, ...files]);

    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setGalleryPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeGalleryImage = (index: number) => {
    const preview = galleryPreviews[index];

    const existingIndex = existingGalleryUrls.indexOf(preview);

    if (existingIndex !== -1) {
      setExistingGalleryUrls((prev) =>
        prev.filter((_, i) => i !== existingIndex)
      );
    } else {
      const newFileIndex = index - existingGalleryUrls.length;
      if (newFileIndex >= 0) {
        URL.revokeObjectURL(preview);
        setGalleryFiles((prev) => prev.filter((_, i) => i !== newFileIndex));
      }
    }

    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const normalizeImageUrl = (url: string): string => {
    if (url.startsWith("data:")) {
      return url;
    }
    if (url.startsWith("http")) {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.pathname;
      } catch {
        return url;
      }
    }
    return url;
  };

  const onSubmit = (data: EditTourFormData) => {
    const payload: any = { ...data };

    // Backend requires name + description + startLocation for each
    // submitted translation, so only send complete ones
    payload.localizations = data.localizations.filter(
      (loc) =>
        loc.name?.trim() && loc.description?.trim() && loc.startLocation?.trim()
    );

    if (!hasNewMainImage) {
      delete payload.mainImage;
    }

    if (tourType === TourType.GROUP) {
      delete payload.individualPricing;
      delete payload.maxPersons;

      if (
        !payload.groupPricing ||
        Object.keys(payload.groupPricing).length === 0
      ) {
        payload.groupPricing = {
          totalPrice: 0,
          reservationPrice: 0,
          discountedPrice: 0,
        };
      }
    } else {
      delete payload.groupPricing;
      delete payload.startDate;

      if (
        !payload.individualPricing ||
        Object.keys(payload.individualPricing).length === 0
      ) {
        payload.individualPricing = {
          seasonTotalPrice: 0,
          seasonReservationPrice: 0,
          seasonDiscountedPrice: 0,
          offSeasonTotalPrice: 0,
          offSeasonReservationPrice: 0,
          offSeasonDiscountedPrice: 0,
        };
      }

      if (!payload.maxPersons) {
        payload.maxPersons = 1;
      }
    }

    updateMutation.mutate(payload);
  };

  if (!tourId) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p className="text-center text-gray-500">{t("tours.idNotFound")}</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {t("tours.loadError")}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tourData?.data) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <p className="text-center text-gray-500">{t("tours.tourNotFound")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t("tours.editTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={() => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>{t("tours.tourType")}</FormLabel>
                    <FormDescription>
                      {tourType === TourType.INDIVIDUAL
                        ? t("tours.individual")
                        : t("tours.group")}
                    </FormDescription>
                  </div>
                  <Switch checked={tourType === TourType.INDIVIDUAL} disabled />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <FormLabel>{t("tours.visibility")}</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDaily"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <FormLabel>{t("tours.dailyTour")}</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid md:grid-cols-2 gap-4">
              {SUPPORTED_LOCALES.map((locale, idx) => {
                const hasContent = form.watch(`localizations.${idx}.name`);
                return (
                  <div
                    key={locale}
                    className={`space-y-4 p-4 border rounded-lg transition-colors ${
                      hasContent
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold capitalize">
                        {t("tours.localeTranslation", { locale })}
                      </h3>
                      {hasContent && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded">
                          {t("common.filled")}
                        </span>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name={`localizations.${idx}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("common.name")}
                            <span className="text-xs text-gray-500 ml-2">
                              {t("common.optional")}
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isSubmitting}
                              placeholder={t("tours.namePlaceholder")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`localizations.${idx}.startLocation`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {t("tours.colStartLocation")}
                            <span className="text-xs text-gray-500 ml-2">
                              {t("common.optional")}
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              disabled={isSubmitting}
                              placeholder={t("tours.colStartLocation")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`localizations.${idx}.locations`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("tours.nextLocations")}</FormLabel>
                          <div className="space-y-2">
                            {field.value?.map((loc, locIdx) => (
                              <div key={locIdx} className="flex gap-2">
                                <Input
                                  value={loc}
                                  onChange={(e) => {
                                    const updated = [...field.value];
                                    updated[locIdx] = e.target.value;
                                    field.onChange(updated);
                                  }}
                                  disabled={isSubmitting}
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => {
                                    const updated = field.value.filter(
                                      (_, i) => i !== locIdx
                                    );
                                    field.onChange(updated);
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
                                field.onChange([...field.value, ""])
                              }
                              disabled={isSubmitting}
                              className="w-full"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              {t("tours.addLocation")}
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`localizations.${idx}.description`}
                      render={({ field }) => {
                        return (
                          <FormItem>
                            <FormLabel>
                              {t("common.description")}
                              <span className="text-xs text-gray-500 ml-2">
                                {t("common.optional")}
                              </span>
                            </FormLabel>
                            <FormControl>
                              <RichTextEditor
                                key={`description-${idx}-${field.value?.substring(0, 20)}`}
                                value={field.value || ""}
                                onChange={field.onChange}
                                disabled={isSubmitting}
                                placeholder={t("tours.descriptionPlaceholder")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("tours.daysLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
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
                    <FormLabel>{t("tours.nightsLabel")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
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
                      <FormLabel>{t("common.date")}</FormLabel>
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
                <h3 className="font-medium">{t("tours.groupPricing")}</h3>
                <div className="grid sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="groupPricing.totalPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("tours.totalPrice")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
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
                        <FormLabel>{t("tours.reservationPrice")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
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
                        <FormLabel>{t("tours.discountedPrice")}</FormLabel>
                        <FormControl>
                          <Input
                            step="0.01"
                            min={0}
                            type="number"
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
                <h3 className="font-medium">{t("tours.individualDetails")}</h3>

                <FormField
                  control={form.control}
                  name="maxPersons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("common.peopleCount")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
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
                  <h4 className="font-medium">{t("tours.seasonPrices")}</h4>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="individualPricing.seasonTotalPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("tours.totalPrice")}</FormLabel>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            disabled={isSubmitting}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="individualPricing.seasonDiscountedPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("tours.discounted")}</FormLabel>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            disabled={isSubmitting}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="individualPricing.seasonReservationPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("tours.reservationPrice")}</FormLabel>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            disabled={isSubmitting}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">{t("tours.offSeasonPrices")}</h4>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="individualPricing.offSeasonTotalPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("tours.totalPrice")}</FormLabel>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            disabled={isSubmitting}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="individualPricing.offSeasonDiscountedPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("tours.discounted")}</FormLabel>
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            disabled={isSubmitting}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="individualPricing.offSeasonReservationPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("tours.reservationPrice")}</FormLabel>
                          <Input
                            step="0.01"
                            min={0}
                            type="number"
                            {...field}
                            onChange={(e) =>
                              field.onChange(Number(e.target.value))
                            }
                            disabled={isSubmitting}
                          />
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
                  <FormLabel>{t("tours.mainPhoto")}</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleMainImageUpload}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  {mainImagePreview && (
                    <div className="mt-2 relative w-full max-w-md">
                      <Image
                        src={
                          mainImagePreview.startsWith("blob:") ||
                          mainImagePreview.startsWith("data:")
                            ? mainImagePreview
                            : mainImagePreview.startsWith("http")
                              ? mainImagePreview
                              : `${process.env.NEXT_PUBLIC_BASE_URL}${mainImagePreview}`
                        }
                        alt={t("common.preview")}
                        width={400}
                        height={225}
                        className="object-cover rounded"
                        unoptimized={
                          mainImagePreview.startsWith("blob:") ||
                          mainImagePreview.startsWith("data:")
                        }
                      />
                      {hasNewMainImage && (
                        <span className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          {t("common.new")}
                        </span>
                      )}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gallery"
              render={() => (
                <FormItem>
                  <FormLabel>{t("tours.gallery")}</FormLabel>
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
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
                      {galleryPreviews.map((preview, idx) => {
                        const isNewImage = preview.startsWith("blob:");
                        const imageSrc =
                          preview.startsWith("blob:") ||
                          preview.startsWith("data:")
                            ? preview
                            : preview.startsWith("http")
                              ? preview
                              : `${process.env.NEXT_PUBLIC_BASE_URL}${preview}`;

                        return (
                          <div
                            key={`gallery-${idx}`}
                            className="relative group"
                          >
                            <Image
                              src={imageSrc || "/placeholder.svg"}
                              alt={t("tours.galleryImageAlt", { n: idx + 1 })}
                              width={200}
                              height={150}
                              className="w-full h-32 object-cover rounded"
                              unoptimized={
                                preview.startsWith("blob:") ||
                                preview.startsWith("data:")
                              }
                            />
                            <button
                              type="button"
                              onClick={() => removeGalleryImage(idx)}
                              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              aria-label={t("common.delete")}
                              disabled={isSubmitting}
                            >
                              <X className="h-4 w-4" />
                            </button>
                            {isNewImage && (
                              <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                {t("common.new")}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <FormDescription>
                    {t("tours.existingNewImages", {
                      existing: existingGalleryUrls.length,
                      newCount: galleryFiles.length,
                    })}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : (
                t("common.update")
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
