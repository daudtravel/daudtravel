export interface VideoLocalization {
  id: string;
  videoId: string;
  locale: string;
  title: string;
  description?: string | null;
}

export interface Video {
  id: string;
  url: string;
  title?: string;
  description?: string;
  category?: string;
  localizations?: VideoLocalization[];
  createdAt: string;
  updatedAt: string;
}

export interface VideoListType extends Video {}

export interface VideoLocalizationInput {
  locale: string;
  title: string;
  description?: string;
}

export interface CreateVideoDto {
  url: string;
  title?: string;
  description?: string;
  category?: string;
  localizations?: VideoLocalizationInput[];
}

export interface UpdateVideoDto {
  url?: string;
  title?: string;
  description?: string;
  category?: string;
  localizations?: VideoLocalizationInput[];
}

export function getVideoLocalization(video: Video, locale: string) {
  const localized = video.localizations?.find((l) => l.locale === locale);
  return {
    title: localized?.title || video.title || "",
    description: localized?.description || video.description || "",
  };
}
