import { axiosInstance } from "@/src/utlis/axiosInstance";
import type { ListParams, Paginated } from "@/src/types/admin/common.types";
import type {
  AdminAccommodationRow,
  AdminFaqRow,
  AdminPaymentLinkRow,
  AdminTourRow,
  AdminTransferRow,
  AdminVideoRow,
} from "@/src/types/admin/website.types";
import { cleanParams } from "./access.service";

/**
 * The older endpoints answer with different envelopes ({meta}, {pagination:
 * {currentPage,totalRecords}} or {pagination:{page,total}}). This brings them
 * all to the { data, meta } shape the admin list kit expects.
 */
function normalize<T>(payload: unknown, fallbackLimit: number): Paginated<T> {
  const body = (payload ?? {}) as Record<string, unknown>;
  const data = (body.data ?? []) as T[];
  const meta = body.meta as Paginated<T>["meta"] | undefined;
  if (meta) return { data, meta };

  const pagination = (body.pagination ?? {}) as Record<string, number>;
  const total = pagination.total ?? pagination.totalRecords ?? data.length;
  const limit = pagination.limit ?? fallbackLimit;
  const page = pagination.page ?? pagination.currentPage ?? 1;
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: pagination.totalPages ?? Math.max(1, Math.ceil(total / limit)),
    },
  };
}

const listGetter =
  <T>(url: string) =>
  async (params: ListParams): Promise<Paginated<T>> => {
    const { data } = await axiosInstance.get(url, {
      params: cleanParams(params),
    });
    return normalize<T>(data, Number(params.limit) || 10);
  };

export const adminToursApi = {
  list: listGetter<AdminTourRow>("/tours/all"),
  remove: async (id: string) => {
    await axiosInstance.delete(`/tours/${id}`);
  },
};

export const adminTransfersApi = {
  list: listGetter<AdminTransferRow>("/transfers"),
  remove: async (id: string) => {
    await axiosInstance.delete(`/transfers/${id}`);
  },
};

export const adminAccommodationsApi = {
  list: listGetter<AdminAccommodationRow>("/accommodations/all"),
  remove: async (id: string) => {
    await axiosInstance.delete(`/accommodations/${id}`);
  },
  filterOptions: async () => {
    const { data } = await axiosInstance.get<{ data: { cities: string[] } }>(
      "/accommodations/filter-options"
    );
    return data.data;
  },
};

/** FAQ and videos are small, unpaginated collections (filtered client-side). */
export const adminFaqApi = {
  all: async (): Promise<AdminFaqRow[]> => {
    const { data } = await axiosInstance.get<{ data: AdminFaqRow[] }>(
      "/faq/faq"
    );
    return data.data ?? [];
  },
  remove: async (id: string) => {
    await axiosInstance.delete(`/faq/delete_faq/${id}`);
  },
};

export const adminVideosApi = {
  all: async (): Promise<AdminVideoRow[]> => {
    const { data } = await axiosInstance.get<{ data: AdminVideoRow[] }>(
      "/videos/video"
    );
    return data.data ?? [];
  },
  get: async (id: string): Promise<AdminVideoRow> => {
    const { data } = await axiosInstance.get<{ data: AdminVideoRow }>(
      `/videos/video/${id}`
    );
    return data.data;
  },
  remove: async (id: string) => {
    await axiosInstance.delete(`/videos/delete_video/${id}`);
  },
};

export const adminPaymentLinksApi = {
  list: listGetter<AdminPaymentLinkRow>("/quick-payment/links"),
  toggle: async (slug: string) => {
    const { data } = await axiosInstance.post(
      `/quick-payment/links/${slug}/toggle`
    );
    return data;
  },
  remove: async (slug: string) => {
    await axiosInstance.delete(`/quick-payment/links/${slug}`);
  },
};

export { normalize as normalizePaginated };
