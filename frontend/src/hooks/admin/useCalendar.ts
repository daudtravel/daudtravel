"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { calendarApi } from "@/src/services/admin/calendar.service";
import type { CalendarNotePayload } from "@/src/types/admin/calendar.types";
import { adminRetry } from "@/src/utlis/admin/errors";

export const calendarKeys = {
  all: ["admin", "calendar"] as const,
  range: (from: string, to: string, createdById?: string) =>
    ["admin", "calendar", from, to, createdById ?? "all"] as const,
};

export const useCalendarRange = (
  from: string,
  to: string,
  createdById?: string
) =>
  useQuery({
    queryKey: calendarKeys.range(from, to, createdById),
    queryFn: () => calendarApi.range(from, to, createdById),
    placeholderData: keepPreviousData,
    retry: adminRetry,
  });

export function useSaveNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id?: string;
      payload: CalendarNotePayload;
    }) =>
      id
        ? calendarApi.updateNote(id, payload)
        : calendarApi.createNote(payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: calendarKeys.all }),
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarApi.removeNote(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: calendarKeys.all }),
  });
}
