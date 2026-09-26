"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/src/components/ui/sheet";
import { Skeleton } from "@/src/components/ui/skeleton";
import { Link } from "@/src/i18n/routing";
import PageHeader from "@/src/components/admin/common/PageHeader";
import PrintButton from "@/src/components/admin/common/PrintButton";
import Panel from "@/src/components/admin/common/Panel";
import ConfirmDialog from "@/src/components/admin/common/ConfirmDialog";
import SelectFilter from "@/src/components/admin/list/SelectFilter";
import {
  useCalendarRange,
  useDeleteNote,
  useSaveNote,
} from "@/src/hooks/admin/useCalendar";
import { useUsersLookup } from "@/src/hooks/admin/useAccess";
import { usePermissions } from "@/src/components/admin/access/usePermissions";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import { formatDateOnly, fullName, toDateOnly } from "@/src/utlis/admin/format";
import { adminPaths } from "@/src/utlis/admin/paths";
import type {
  CalendarEvent,
  CalendarNote,
} from "@/src/types/admin/calendar.types";
import NoteDialog from "./NoteDialog";
import { cn } from "@/src/utlis/cn";

const EVENT_TONE: Record<string, string> = {
  BOOKING_START: "bg-brand-green-50 text-brand-green",
  BOOKING_END: "bg-gray-100 text-gray-600",
  SERVICE: "bg-sky-50 text-sky-700",
  CHECK_IN: "bg-amber-50 text-amber-700",
  CHECK_OUT: "bg-amber-50/60 text-amber-600",
  TOUR_ORDER: "bg-purple-50 text-purple-700",
  TRANSFER_ORDER: "bg-blue-50 text-blue-700",
};

const NOTE_TONE: Record<string, string> = {
  green: "bg-brand-green text-white",
  yellow: "bg-brand-yellow text-gray-900",
  blue: "bg-blue-500 text-white",
  red: "bg-red-500 text-white",
  purple: "bg-purple-500 text-white",
  gray: "bg-gray-400 text-white",
};

/** Monday-first grid of the weeks covering the given month. */
function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // Monday = 0
  const start = new Date(year, month, 1 - startOffset);
  const days: Date[] = [];
  for (let index = 0; index < 42; index += 1) {
    days.push(
      new Date(start.getFullYear(), start.getMonth(), start.getDate() + index)
    );
  }
  // Drop a trailing week that belongs entirely to the next month
  return days.slice(0, days[35].getMonth() === month ? 42 : 35);
}

export default function CalendarView() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const errorMessage = useApiErrorMessage();
  const { can, canAll } = usePermissions();

  const today = new Date();
  const [cursor, setCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [owner, setOwner] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [noteDialog, setNoteDialog] = useState<{
    open: boolean;
    note: CalendarNote | null;
    date: string;
  }>({ open: false, note: null, date: toDateOnly(today) });
  const [toDelete, setToDelete] = useState<CalendarNote | null>(null);
  const [hidden, setHidden] = useState<Record<string, boolean>>({});

  const days = useMemo(
    () => monthGrid(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );
  const from = toDateOnly(days[0]);
  const to = toDateOnly(days[days.length - 1]);

  const { data, isLoading, isError, refetch } = useCalendarRange(
    from,
    to,
    owner || undefined
  );
  const saveNote = useSaveNote();
  const deleteNote = useDeleteNote();
  const owners = useUsersLookup(true, canAll("CALENDAR", "view"));

  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(cursor);

  const weekdays = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale, { weekday: "short" });
    // 2026-01-05 is a Monday
    return Array.from({ length: 7 }, (_, index) =>
      formatter.format(new Date(2026, 0, 5 + index))
    );
  }, [locale]);

  const byDay = useMemo(() => {
    const map = new Map<
      string,
      { notes: CalendarNote[]; events: CalendarEvent[] }
    >();
    const get = (date: string) => {
      const row = map.get(date) ?? { notes: [], events: [] };
      map.set(date, row);
      return row;
    };
    for (const note of data?.notes ?? []) get(note.date).notes.push(note);
    for (const event of data?.events ?? []) {
      if (hidden[event.type]) continue;
      get(event.date).events.push(event);
    }
    return map;
  }, [data, hidden]);

  useEffect(() => {
    if (isError) toast.error(t("list.loadError"));
  }, [isError, t]);

  const openNote = (date: string, note: CalendarNote | null) =>
    setNoteDialog({ open: true, note, date });

  const toggleDone = async (note: CalendarNote) => {
    try {
      await saveNote.mutateAsync({
        id: note.id,
        payload: { isDone: !note.isDone },
      });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteNote.mutateAsync(toDelete.id);
      toast.success(t("calendar.noteDeleted"));
      setToDelete(null);
    } catch (error) {
      toast.error(errorMessage(error));
      setToDelete(null);
    }
  };

  const selectedDay = selected ? byDay.get(selected) : undefined;

  return (
    <div>
      <PageHeader
        title={t("nav.calendar")}
        description={t("calendar.subtitle")}
        printTitle={`${t("nav.calendar")} — ${monthLabel}`}
        actions={
          <>
            <PrintButton />
            {can("CALENDAR", "create") && (
              <Button onClick={() => openNote(toDateOnly(new Date()), null)}>
                <Plus />
                {t("calendar.newNote")}
              </Button>
            )}
          </>
        }
      />

      {/* Month switcher and event filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label={t("calendar.previousMonth")}
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)
              )
            }
          >
            <ChevronLeft className="rtl:rotate-180" />
          </Button>
          <h2 className="min-w-[10rem] text-center text-lg font-bold capitalize text-gray-900">
            {monthLabel}
          </h2>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("calendar.nextMonth")}
            onClick={() =>
              setCursor(
                new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
              )
            }
          >
            <ChevronRight className="rtl:rotate-180" />
          </Button>
          <Button
            variant="ghost"
            onClick={() =>
              setCursor(new Date(today.getFullYear(), today.getMonth(), 1))
            }
          >
            <CalendarDays />
            {t("calendar.today")}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {Object.keys(EVENT_TONE).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() =>
                setHidden((prev) => ({ ...prev, [type]: !prev[type] }))
              }
              className={cn(
                "rounded-lg px-2 py-1 text-xs font-semibold transition-colors",
                hidden[type]
                  ? "bg-gray-100 text-gray-400 line-through"
                  : EVENT_TONE[type]
              )}
            >
              {t(`calendar.eventTypes.${type}`)}
            </button>
          ))}
          {canAll("CALENDAR", "view") && (
            <SelectFilter
              label={t("common.owner")}
              value={owner}
              onChange={setOwner}
              options={(owners.data ?? []).map((row) => ({
                value: row.id,
                label: fullName(row),
              }))}
            />
          )}
        </div>
      </div>

      {isLoading && !data ? (
        <Skeleton className="h-[32rem] w-full rounded-2xl" />
      ) : (
        <Panel noPadding>
          <div className="grid grid-cols-7 border-b border-gray-100 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
            {weekdays.map((day) => (
              <div key={day} className="px-2 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const key = toDateOnly(day);
              const cell = byDay.get(key);
              const otherMonth = day.getMonth() !== cursor.getMonth();
              const isToday = key === toDateOnly(today);
              const chips = [
                ...(cell?.notes ?? []).map((note) => ({
                  kind: "note" as const,
                  note,
                })),
                ...(cell?.events ?? []).map((event) => ({
                  kind: "event" as const,
                  event,
                })),
              ];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={cn(
                    "min-h-[6.5rem] border-b border-e border-gray-50 p-1.5 text-start align-top transition-colors hover:bg-gray-50/70",
                    otherMonth && "bg-gray-50/40 text-gray-400"
                  )}
                >
                  <span
                    className={cn(
                      "mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-bold",
                      isToday
                        ? "bg-brand-green text-white"
                        : otherMonth
                          ? "text-gray-400"
                          : "text-gray-700"
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <span className="block space-y-0.5">
                    {chips.slice(0, 3).map((chip) =>
                      chip.kind === "note" ? (
                        <span
                          key={chip.note.id}
                          className={cn(
                            "block truncate rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                            NOTE_TONE[chip.note.color] ?? NOTE_TONE.green,
                            chip.note.isDone && "line-through opacity-60"
                          )}
                        >
                          {chip.note.time ? `${chip.note.time} ` : ""}
                          {chip.note.title}
                        </span>
                      ) : (
                        <span
                          key={chip.event.id}
                          className={cn(
                            "block truncate rounded-md px-1.5 py-0.5 text-[11px]",
                            EVENT_TONE[chip.event.type]
                          )}
                        >
                          {chip.event.title}
                        </span>
                      )
                    )}
                    {chips.length > 3 && (
                      <span className="block px-1.5 text-[11px] font-semibold text-gray-400">
                        {t("list.more", { count: chips.length - 3 })}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>
      )}

      {isError && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => void refetch()}
            className="text-sm font-semibold text-brand-green hover:underline"
          >
            {t("list.retry")}
          </button>
        </div>
      )}

      {/* One day in detail */}
      <Sheet
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{formatDateOnly(selected, locale)}</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-4">
            {can("CALENDAR", "create") && selected && (
              <Button
                className="w-full"
                onClick={() => openNote(selected, null)}
              >
                <Plus />
                {t("calendar.newNote")}
              </Button>
            )}

            {(selectedDay?.notes.length ?? 0) > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("calendar.notes")}
                </h3>
                {selectedDay?.notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-xl border border-gray-100 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "font-semibold text-gray-900",
                            note.isDone && "line-through text-gray-400"
                          )}
                        >
                          {note.time ? `${note.time} · ` : ""}
                          {note.title}
                        </p>
                        {note.content && (
                          <p className="mt-0.5 whitespace-pre-line text-sm text-gray-600">
                            {note.content}
                          </p>
                        )}
                        {note.createdBy && (
                          <p className="mt-1 text-xs text-gray-400">
                            {fullName(note.createdBy)}
                          </p>
                        )}
                      </div>
                      <span className="flex shrink-0 gap-1">
                        {can("CALENDAR", "edit") && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("calendar.markDone")}
                              onClick={() => void toggleDone(note)}
                            >
                              <span
                                className={cn(
                                  "h-4 w-4 rounded border",
                                  note.isDone
                                    ? "border-brand-green bg-brand-green"
                                    : "border-gray-300"
                                )}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={t("common.edit")}
                              onClick={() => openNote(note.date, note)}
                            >
                              <Pencil />
                            </Button>
                          </>
                        )}
                        {can("CALENDAR", "delete") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t("common.delete")}
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => setToDelete(note)}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {(selectedDay?.events.length ?? 0) > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {t("calendar.events")}
                </h3>
                {selectedDay?.events.map((event) => {
                  const body = (
                    <>
                      <span
                        className={cn(
                          "mb-1 inline-block rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                          EVENT_TONE[event.type]
                        )}
                      >
                        {t(`calendar.eventTypes.${event.type}`)}
                      </span>
                      <p className="font-semibold text-gray-900">
                        {event.time ? `${event.time} · ` : ""}
                        {event.title}
                      </p>
                      {event.subtitle && (
                        <p className="text-sm text-gray-600">
                          {event.subtitle}
                        </p>
                      )}
                    </>
                  );
                  return event.bookingId ? (
                    <Link
                      key={event.id}
                      href={adminPaths.booking(event.bookingId)}
                      className="block rounded-xl border border-gray-100 p-3 transition-colors hover:border-brand-green"
                    >
                      {body}
                    </Link>
                  ) : (
                    <div
                      key={event.id}
                      className="rounded-xl border border-gray-100 p-3"
                    >
                      {body}
                    </div>
                  );
                })}
              </div>
            )}

            {!selectedDay?.notes.length && !selectedDay?.events.length && (
              <p className="py-6 text-center text-sm text-gray-500">
                {t("calendar.nothingOnThisDay")}
              </p>
            )}
          </div>
        </SheetContent>
      </Sheet>

      <NoteDialog
        open={noteDialog.open}
        note={noteDialog.note}
        date={noteDialog.date}
        onOpenChange={(open) => setNoteDialog((prev) => ({ ...prev, open }))}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title={t("calendar.deleteTitle")}
        description={t("calendar.deleteText", { title: toDelete?.title ?? "" })}
        loading={deleteNote.isPending}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
