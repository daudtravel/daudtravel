"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "@/src/i18n/routing";
import { adminPaths } from "@/src/utlis/admin/paths";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import {
  useForm,
  useFormContext,
  useFormState,
  useWatch,
} from "react-hook-form";
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
import RoomTypePicker from "@/src/components/admin/form/RoomTypePicker";
import CustomRoomTypesInput from "@/src/components/admin/form/CustomRoomTypesInput";
import {
  AccommodationFormData,
  accommodationFormSchema,
  AccommodationType,
  isLocalizationFilled,
  SUPPORTED_LOCALES,
} from "./AccommodationValidator";
import { AMENITY_KEYS } from "@/src/constants/accommodations.constants";
import {
  dedupeCustomRoomTypes,
  sortRoomTypes,
} from "@/src/constants/roomTypes";
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

/**
 * Custom room types of one language. They are saved with that language's
 * translation, so it has to be filled in (checked on submit).
 */
function CustomRoomTypesRow({
  locale,
  index,
  disabled,
}: {
  locale: (typeof SUPPORTED_LOCALES)[number];
  index: number;
  disabled: boolean;
}) {
  const t = useTranslations("admin");
  const { control, getValues, setValue, trigger } =
    useFormContext<AccommodationFormData>();
  const fieldName = `localizations.${index}.customRoomTypes` as const;
  const [name, description] = useWatch({
    control,
    name: [`localizations.${index}.name`, `localizations.${index}.description`],
  });
  const filled = isLocalizationFilled({ name, description });
  const { errors } = useFormState({ control, name: fieldName });
  const hasError = !!errors.localizations?.[index]?.customRoomTypes;

  // Filling the language in clears its "needs a translation" error right away
  useEffect(() => {
    if (filled && hasError) void trigger(fieldName);
  }, [filled, hasError, trigger, fieldName]);

  return (
    <FormField
      control={control}
      name={fieldName}
      render={({ field, fieldState }) => (
        <FormItem className="flex items-start gap-3 space-y-0">
          <FormLabel
            className={`w-8 shrink-0 text-xs font-semibold uppercase ${
              field.value?.length ? "pt-1.5" : "pt-3.5"
            }`}
          >
            {locale}
          </FormLabel>
          <div className="min-w-0 flex-1 space-y-1">
            <FormControl>
              <CustomRoomTypesInput
                // A failed submit focuses the text box, which names the error
                ref={field.ref}
                value={field.value ?? []}
                onChange={field.onChange}
                onPredefinedMatch={(code) =>
                  setValue(
                    "roomTypes",
                    sortRoomTypes([...getValues("roomTypes"), code]),
                    { shouldDirty: true, shouldValidate: true }
                  )
                }
                dir={locale === "ar" ? "rtl" : "ltr"}
                ariaLabel={`${t("accommodations.customRoomTypes")} (${t(
                  `common.languages.${locale}`
                )})`}
                invalid={!!fieldState.error}
                disabled={disabled}
              />
            </FormControl>
            <FormMessage />
            {!filled && !fieldState.error && (
              <p className="text-xs text-muted-foreground">
                {t("accommodations.customRoomTypesUnfilled")}
              </p>
            )}
          </div>
        </FormItem>
      )}
    />
  );
}

interface Props {
  accommodation?: Accommodation;
}

export default function AccommodationForm({ accommodation }: Props) {
  const isEdit = !!accommodation;
  const router = useRouter();
  const createMutation = useCreateAccommodation();
  const updateMutation = useUpdateAccommodation();
  const t = useTranslations("admin");
  // Amenity, room-type and type labels are shared with the public pages
  const tAcc = useTranslations("accommodations");
  const errorMessage = useApiErrorMessage();
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
          customRoomTypes: loc?.customRoomTypes ?? [],
        };
      }),
      city: accommodation?.city || "",
      price: accommodation?.price || 0,
      maxGuests: accommodation?.maxGuests || 1,
      bedrooms: accommodation?.bedrooms ?? 1,
      bathrooms: accommodation?.bathrooms ?? 1,
      amenities: accommodation?.amenities || [],
      roomTypes: sortRoomTypes(accommodation?.roomTypes),
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
        .filter(isLocalizationFilled)
        .map((loc) => ({
          locale: loc.locale,
          name: loc.name.trim(),
          description: loc.description,
          address: loc.address || "",
          customRoomTypes: dedupeCustomRoomTypes(loc.customRoomTypes),
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
              roomTypes: data.roomTypes,
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
            onError: (error) => toast.error(errorMessage(error)),
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
            roomTypes: data.roomTypes,
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
            onError: (error) => toast.error(errorMessage(error)),
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

            {/* Room types: predefined for the listing, custom ones per language */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="roomTypes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tAcc("roomTypes")}</FormLabel>
                    <FormDescription>
                      {t("accommodations.roomTypesHint")}
                    </FormDescription>
                    <div
                      role="group"
                      aria-label={tAcc("roomTypes")}
                      className="mt-2"
                    >
                      <RoomTypePicker
                        value={field.value ?? []}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 rounded-lg border p-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">
                    {t("accommodations.customRoomTypes")}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t("accommodations.customRoomTypesHint")}
                  </p>
                </div>
                {SUPPORTED_LOCALES.map((locale, idx) => (
                  <CustomRoomTypesRow
                    key={locale}
                    locale={locale}
                    index={idx}
                    disabled={isSubmitting}
                  />
                ))}
              </div>
            </div>

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
