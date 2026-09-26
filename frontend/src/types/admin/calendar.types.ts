import type { OwnerRef } from "./partners.types";

export const NOTE_COLORS = [
  "green",
  "yellow",
  "blue",
  "red",
  "purple",
  "gray",
] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

export const CALENDAR_EVENT_TYPES = [
  "BOOKING_START",
  "BOOKING_END",
  "SERVICE",
  "CHECK_IN",
  "CHECK_OUT",
  "TOUR_ORDER",
  "TRANSFER_ORDER",
] as const;
export type CalendarEventType = (typeof CALENDAR_EVENT_TYPES)[number];

export interface CalendarNote {
  id: string;
  date: string;
  time: string | null;
  title: string;
  content: string | null;
  color: string;
  isDone: boolean;
  createdById: string | null;
  createdBy: OwnerRef | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  date: string;
  time: string | null;
  title: string;
  subtitle: string | null;
  bookingId?: string;
  bookingNumber?: number;
  orderId?: string;
}

export interface CalendarRange {
  from: string;
  to: string;
  notes: CalendarNote[];
  events: CalendarEvent[];
}

export interface CalendarNotePayload {
  date?: string;
  time?: string | null;
  title?: string;
  content?: string | null;
  color?: string;
  isDone?: boolean;
  createdById?: string | null;
}
