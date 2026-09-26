import { axiosInstance } from "@/src/utlis/axiosInstance";
import type { ListParams, Paginated } from "@/src/types/admin/common.types";
import type {
  Vehicle,
  VehicleOption,
  VehiclePayload,
} from "@/src/types/admin/drivers.types";
import { cleanParams } from "./access.service";

export const vehiclesApi = {
  list: async (params: ListParams): Promise<Paginated<Vehicle>> =>
    (
      await axiosInstance.get<Paginated<Vehicle>>("/vehicles", {
        params: cleanParams(params),
      })
    ).data,

  get: async (id: string): Promise<Vehicle> =>
    (await axiosInstance.get<{ data: Vehicle }>(`/vehicles/${id}`)).data.data,

  options: async (driverId?: string): Promise<VehicleOption[]> =>
    (
      await axiosInstance.get<{ data: VehicleOption[] }>("/vehicles/options", {
        params: cleanParams({ driverId }),
      })
    ).data.data,

  brands: async (): Promise<string[]> =>
    (
      await axiosInstance.get<{ data: { brands: string[] } }>(
        "/vehicles/filter-options"
      )
    ).data.data.brands,

  create: async (payload: VehiclePayload): Promise<Vehicle> =>
    (await axiosInstance.post<{ data: Vehicle }>("/vehicles", payload)).data
      .data,

  update: async (id: string, payload: VehiclePayload): Promise<Vehicle> =>
    (await axiosInstance.put<{ data: Vehicle }>(`/vehicles/${id}`, payload))
      .data.data,

  remove: async (id: string) => {
    await axiosInstance.delete(`/vehicles/${id}`);
  },
};
