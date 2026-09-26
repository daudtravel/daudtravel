import { axiosInstance } from "@/src/utlis/axiosInstance";
import type { ListParams, Paginated } from "@/src/types/admin/common.types";
import type {
  AdminDriver,
  AdminDriverDetail,
  DriverMonthly,
  DriverOption,
  DriverPayload,
} from "@/src/types/admin/drivers.types";
import { cleanParams } from "./access.service";

/**
 * Drivers are saved as multipart because the profile photo travels with the
 * form; arrays are sent as repeated fields and `null` as an empty string, which
 * the backend transforms turn back into "clear this field".
 */
function toFormData(payload: DriverPayload, photo?: File | null): FormData {
  const form = new FormData();
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      // An empty array still has to reach the API, hence the empty marker.
      if (value.length === 0) form.append(key, "");
      else value.forEach((item) => form.append(key, String(item)));
      continue;
    }
    form.append(key, value === null ? "" : String(value));
  }
  if (photo) form.append("photo", photo);
  return form;
}

export const adminDriversApi = {
  list: async (params: ListParams): Promise<Paginated<AdminDriver>> =>
    (
      await axiosInstance.get<Paginated<AdminDriver>>("/drivers/admin", {
        params: cleanParams(params),
      })
    ).data,

  get: async (id: string): Promise<AdminDriverDetail> =>
    (
      await axiosInstance.get<{ data: AdminDriverDetail }>(
        `/drivers/admin/${id}`
      )
    ).data.data,

  options: async (): Promise<DriverOption[]> =>
    (
      await axiosInstance.get<{ data: DriverOption[] }>(
        "/drivers/admin/options"
      )
    ).data.data,

  languages: async (): Promise<string[]> =>
    (
      await axiosInstance.get<{ data: { languages: string[] } }>(
        "/drivers/admin/filter-options"
      )
    ).data.data.languages,

  monthly: async (id: string, year?: number): Promise<DriverMonthly> =>
    (
      await axiosInstance.get<{ data: DriverMonthly }>(
        `/drivers/admin/${id}/monthly`,
        { params: cleanParams({ year }) }
      )
    ).data.data,

  create: async (
    payload: DriverPayload,
    photo?: File | null
  ): Promise<AdminDriver> =>
    (
      await axiosInstance.post<{ data: AdminDriver }>(
        "/drivers/add_driver",
        toFormData(payload, photo)
      )
    ).data.data,

  update: async (
    id: string,
    payload: DriverPayload,
    photo?: File | null
  ): Promise<AdminDriver> =>
    (
      await axiosInstance.patch<{ data: AdminDriver }>(
        `/drivers/${id}`,
        toFormData(payload, photo)
      )
    ).data.data,

  remove: async (id: string) => {
    await axiosInstance.delete(`/drivers/${id}`);
  },

  addCarPhotos: async (id: string, files: File[]): Promise<string[]> => {
    const form = new FormData();
    files.forEach((file) => form.append("photos", file));
    return (
      await axiosInstance.post<{ data: string[] }>(
        `/drivers/${id}/car-photos`,
        form
      )
    ).data.data;
  },

  removeCarPhoto: async (id: string, url: string): Promise<string[]> =>
    (
      await axiosInstance.delete<{ data: string[] }>(
        `/drivers/${id}/car-photos`,
        { data: { url } }
      )
    ).data.data,

  deleteReview: async (reviewId: string) => {
    await axiosInstance.delete(`/drivers/reviews/${reviewId}`);
  },
};
