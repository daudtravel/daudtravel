export interface Video {
  id: string;
  url: string;
  title?: string;
  description?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VideoListType extends Video {}

export interface CreateVideoDto {
  url: string;
  title?: string;
  description?: string;
  category?: string;
}

export interface UpdateVideoDto {
  url?: string;
  title?: string;
  description?: string;
  category?: string;
}
