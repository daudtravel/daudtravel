"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { vehiclesApi } from "@/src/services/admin/vehicles.service";
import type { ListParams } from "@/src/types/admin/common.types";
import type { VehiclePayload } from "@/src/types/admin/drivers.types";
import { adminRetry } from "@/src/utlis/admin/errors";
import { driverKeys } from "./useDrivers";

export const vehicleKeys = {
  all: ["admin", "vehicles"] as const,
  list: (params: ListParams) => ["admin", "vehicles", "list", params] as const,
  options: (driverId?: string) =>
    ["admin", "vehicles", "options", driverId ?? "all"] as const,
  brands: ["admin", "vehicles", "brands"] as const,
};

export const useVehicles = (params: ListParams, enabled = true) =>
  useQuery({
    queryKey: vehicleKeys.list(params),
    queryFn: () => vehiclesApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
    retry: adminRetry,
  });

export const useVehicleOptions = (driverId?: string, enabled = true) =>
  useQuery({
    queryKey: vehicleKeys.options(driverId),
    queryFn: () => vehiclesApi.options(driverId),
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: adminRetry,
  });

export const useVehicleBrands = (enabled = true) =>
  useQuery({
    queryKey: vehicleKeys.brands,
    queryFn: vehiclesApi.brands,
    staleTime: 5 * 60 * 1000,
    enabled,
    retry: adminRetry,
  });

/** Vehicles show up on driver pages too, so both caches are refreshed. */
function useVehicleInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
    void queryClient.invalidateQueries({ queryKey: driverKeys.all });
  };
}

export function useSaveVehicle() {
  const invalidate = useVehicleInvalidate();
  return useMutation({
    mutationFn: ({ id, payload }: { id?: string; payload: VehiclePayload }) =>
      id ? vehiclesApi.update(id, payload) : vehiclesApi.create(payload),
    onSuccess: invalidate,
  });
}

export function useDeleteVehicle() {
  const invalidate = useVehicleInvalidate();
  return useMutation({
    mutationFn: (id: string) => vehiclesApi.remove(id),
    onSuccess: invalidate,
  });
}
