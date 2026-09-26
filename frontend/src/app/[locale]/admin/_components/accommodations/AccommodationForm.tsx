"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/src/i18n/routing";
import { adminPaths } from "@/src/utlis/admin/paths";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Loader2, X, Building2, Home } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

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
import { Checkbox } from "@/src/components/ui/checkbox";
import RichTextEditor from "@/src/components/textEditor/TextEditor";
import {
  AccommodationFormData,
  accommodationFormSchema,
  AccommodationType,
  SUPPORTED_LOCALES,
} from "./AccommodationValidator";
import { AMENITY_KEYS } from "@/src/constants/accommodations.constants";
import { Accommodation } from "@/src/types/accommodations.type";
import { useCreateAccommodation } from "@/src/hooks/accommodations/useCreateAccommodation";
import { useUpdateAccommodation } from "@/src/hooks/accommodations/useUpdateAccommodation";

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

interface Props {
  accommodation?: Accommodation;
}

export default function AccommodationForm({ accommodation }: Props) {
  const isEdit = !!accommodation;
  const router = useRouter();
  const createMutation = useCreateAccommodation();
  const updateMutation = useUpdateAccommodation();
  const t = useTranslations("admin");
  // Amenity and type labels are shared with the public accommodations pages
  const tAcc = useTranslations("accommodations");
  const schema = useMemo(() => accommodationFormSchema(t), [t]);

  const [type, setType] = useState<AccommodationType>(
    (accommodation?.type as AccommodationType) || AccommodationType.HOTEL
  );
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(
    accommodation
      ? `${process.env.NEXT_PUBLIC_BASE_URL}${accommodation.mainImage}`
      : null
  );
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  // Existing gallery urls kept on edit
  const [existingGallery, setExistingGallery] = useState<string[]>(
    accommodation?.images.map((img) => img.url) || []
  );
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);

  const form = useForm<AccommodationFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: (accommodation?.type as AccommodationType) || AccommodationType.HOTEL,
      localizations: SUPPORTED_LOCALES.map((locale) => {
        const loc = accommodation?.localizations.find(
          (l) => l.locale === locale
        );
        return {
          locale,
          name: loc?.name || "",
          description: loc?.description || "",
          address: loc?.address || "",
        };
      }),
      city: accommodation?.city || "",
      price: accommodation?.price || 0,
      maxGuests: accommodation?.maxGuests || 1,
      bedrooms: accommodation?.bedrooms ?? 1,
      bathrooms: accommodation?.bathrooms ?? 1,
      amenities: accommodation?.amenities || [],
      isPublic: accommodation?.isPublic || false,
      mainImage: "",
      gallery: [],
    },
    mode: "onChange",
  });

  const handleMainImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMainImageFile(file);
      setMainImagePreview(URL.createObjectURL(file));
    }
  };

  const handleGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setGalleryFiles((prev) => [...prev, ...files]);
    setGalleryPreviews((prev) => [
      ...prev,
      ...files.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const removeNewGalleryImage = (index: number) => {
    URL.revokeObjectURL(galleryPreviews[index]);
    setGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
    setGalleryFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingGalleryImage = (index: number) => {
    setExistingGallery((prev) => prev.filter((_, i) => i !== index));
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data: AccommodationFormData) => {
    try {
      if (!isEdit && !mainImageFile) {
        form.setError("mainImage", {
          type: "manual",
          message: t("common.mainImageRequired"),
        });
        return;
      }

      const mainImageBase64 = mainImageFile
        ? await fileToBase64(mainImageFile)
        : undefined;

      const newGalleryBase64 =
        galleryFiles.length > 0
          ? await Promise.all(galleryFiles.map((f) => fileToBase64(f)))
          : [];

      // Only send languages the admin actually filled in
      const localizations = data.localizations
        .filter((loc) => loc.name?.trim() && loc.description?.trim())
        .map((loc) => ({
          locale: loc.locale,
          name: loc.name.trim(),
          description: loc.description,
          address: loc.address || "",
        }));

      if (isEdit && accommodation) {
        updateMutation.mutate(
          {
            id: accommodation.id,
            data: {
              localizations,
              type: data.type,
              price: data.price,
              city: data.city,
              maxGuests: data.maxGuests,
              bedrooms: data.bedrooms,
              bathrooms: data.bathrooms,
              amenities: data.amenities,
              isPublic: data.isPublic,
              ...(mainImageBase64 && { mainImage: mainImageBase64 }),
              gallery: [...existingGallery, ...newGalleryBase64],
            },
          },
          {
            onSuccess: () => {
              toast.success(t("accommodations.updated"));
              router.push(adminPaths.websiteAccommodations);
            },
            onError: (error) =>
              toast.error(
                error instanceof Error ? error.message : t("common.updateFailed")
              ),
          }
        );
      } else {
        createMutation.mutate(
          {
            localizations,
            type: data.type,
            price: data.price,
            city: data.city,
            maxGuests: data.maxGuests,
            bedrooms: data.bedrooms,
            bathrooms: data.bathrooms,
            amenities: data.amenities,
            isPublic: data.isPublic,
            mainImage: mainImageBase64!,
            gallery: newGalleryBase64,
          },
          {
            onSuccess: () => {
              toast.success(t("accommodations.created"));
              form.reset();
              router.push(adminPaths.websiteAccommodations);
            },
            onError: (error) =>
              toast.error(
                error instanceof Error ? error.message : t("common.createFailed")
              ),
          }
        );
      }
    } catch {
      form.setError("mainImage", {
        type: "manual",
        message: t("accommodations.imageProcessingFailed"),
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          {isEdit ? t("accommodations.editTitle") : t("accommodations.newTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Type */}
            <FormField
              control={form.control}
              name="type"
              render={() => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      {type === AccommodationType.APARTMENT ? (
                        <Home className="h-4 w-4" />
                      ) : (
                        <Building2 className="h-4 w-4" />
                      )}
                      {t("accommodations.typeLabel", {
                        type:
                          type === AccommodationType.APARTMENT
                            ? tAcc("apartment")
                            : tAcc("hotel"),
                      })}
                    </FormLabel>
                    <FormDescription>
                      {t("accommodations.typeHint")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={type === AccommodationType.APARTMENT}
                      onCheckedChange={(checked) => {
                        const newType = checked
                          ? AccommodationType.APARTMENT
                          : AccommodationType.HOTEL;
                        setType(newType);
                        form.setValue("type", newType);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* City */}
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("accommodations.city")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("accommodations.cityPlaceholder")}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Localizations: fill one or more languages */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">
                {t("common.translations")}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  {t("common.atLeastOneRequired")}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SUPPORTED_LOCALES.map((locale, idx) => {
                  const hasContent = form.watch(`localizations.${idx}.name`);
                  return (
                    <div
                      key={locale}
                      className={`space-y-4 p-4 border rounded-lg transition-colors ${
                        hasContent
                          ? "border-brand-green bg-brand-green-50"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold uppercase">{locale}</h4>
                        {hasContent && (
                          <span className="text-xs bg-brand-green text-white px-2 py-1 rounded">
                            {t("common.filled")}
                          </span>
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name={`localizations.${idx}.name`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("common.name")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("accommodations.namePlaceholder")}
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
                        name={`localizations.${idx}.address`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("accommodations.addressOptional")}</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={t("accommodations.addressPlaceholder")}
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
                        name={`localizations.${idx}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("common.description")}</FormLabel>
                            <FormControl>
                              <RichTextEditor
                                value={field.value || ""}
                                onChange={field.onChange}
                                disabled={isSubmitting}
                                placeholder={t("accommodations.descriptionPlaceholder")}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  );
                })}
              </div>
              {(form.formState.errors.localizations?.message ||
                form.formState.errors.localizations?.root?.message) && (
                <p className="text-sm font-medium text-destructive">
                  {form.formState.errors.localizations.message ||
                    form.formState.errors.localizations.root?.message}
                </p>
              )}
            </div>

            {/* Price + capacity */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("accommodations.pricePerNight")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
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
                name="maxGuests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("accommodations.guests")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
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
                name="bedrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("accommodations.bedrooms")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
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
                name="bathrooms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("accommodations.bathrooms")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Amenities */}
            <FormField
              control={form.control}
              name="amenities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("accommodations.amenities")}</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {AMENITY_KEYS.map((key) => {
                      const checked = field.value?.includes(key);
                      return (
                        <label
                          key={key}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(value) => {
                              const current = field.value || [];
                              field.onChange(
                                value
                                  ? [...current, key]
                                  : current.filter((k) => k !== key)
                              );
                            }}
                            disabled={isSubmitting}
                          />
                          {tAcc(`amenityLabels.${key}`)}
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Main image */}
            <FormField
              control={form.control}
              name="mainImage"
              render={() => (
                <FormItem>
                  <FormLabel>{t("common.mainImage")}</FormLabel>
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
                        alt={t("common.preview")}
                        className="max-w-full h-auto max-h-48 object-cover rounded"
                        unoptimized
                      />
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Gallery */}
            <FormField
              control={form.control}
              name="gallery"
              render={() => (
                <FormItem>
                  <FormLabel>{t("common.galleryOptional")}</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryUpload}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  {(existingGallery.length > 0 ||
                    galleryPreviews.length > 0) && (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {existingGallery.map((url, index) => (
                        <div key={`existing-${index}`} className="relative">
                          <Image
                            width={200}
                            height={200}
                            src={`${process.env.NEXT_PUBLIC_BASE_URL}${url}`}
                            alt={t("accommodations.imageN", { n: index + 1 })}
                            className="w-full h-32 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingGalleryImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      {galleryPreviews.map((preview, index) => (
                        <div key={`new-${index}`} className="relative">
                          <Image
                            width={200}
                            height={200}
                            src={preview}
                            alt={t("accommodations.newImageN", { n: index + 1 })}
                            className="w-full h-32 object-cover rounded"
                            unoptimized
                          />
                          <button
                            type="button"
                            onClick={() => removeNewGalleryImage(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            disabled={isSubmitting}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Public */}
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t("accommodations.publish")}</FormLabel>
                    <FormDescription>
                      {t("accommodations.publishHint")}
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("common.loading")}
                </>
              ) : isEdit ? (
                t("common.update")
              ) : (
                t("common.create")
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
