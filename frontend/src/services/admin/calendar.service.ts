import { axiosInstance } from "@/src/utlis/axiosInstance";
import type {
  CalendarNote,
  CalendarNotePayload,
  CalendarRange,
} from "@/src/types/admin/calendar.types";
import { cleanParams } from "./access.service";

export const calendarApi = {
  range: async (
    from: string,
    to: string,
    createdById?: string
  ): Promise<CalendarRange> =>
    (
      await axiosInstance.get<{ data: CalendarRange }>("/calendar", {
        params: cleanParams({ from, to, createdById }),
      })
    ).data.data,

  createNote: async (payload: CalendarNotePayload): Promise<CalendarNote> =>
    (
      await axiosInstance.post<{ data: CalendarNote }>(
        "/calendar/notes",
        payload
      )
    ).data.data,

  updateNote: async (
    id: string,
    payload: CalendarNotePayload
  ): Promise<CalendarNote> =>
    (
      await axiosInstance.put<{ data: CalendarNote }>(
        `/calendar/notes/${id}`,
        payload
      )
    ).data.data,

  removeNote: async (id: string) => {
    await axiosInstance.delete(`/calendar/notes/${id}`);
  },
};
