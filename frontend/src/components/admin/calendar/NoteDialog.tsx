"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import { adminInputClass } from "@/src/components/admin/form/FormFields";
import { useSaveNote } from "@/src/hooks/admin/useCalendar";
import { useApiErrorMessage } from "@/src/utlis/admin/errors";
import {
  NOTE_COLORS,
  type CalendarNote,
} from "@/src/types/admin/calendar.types";
import { cn } from "@/src/utlis/cn";

const SWATCH: Record<string, string> = {
  green: "bg-brand-green",
  yellow: "bg-brand-yellow",
  blue: "bg-blue-500",
  red: "bg-red-500",
  purple: "bg-purple-500",
  gray: "bg-gray-400",
};

export default function NoteDialog({
  open,
  note,
  date,
  onOpenChange,
}: {
  open: boolean;
  /** null = create */
  note: CalendarNote | null;
  date: string;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const errorMessage = useApiErrorMessage();
  const saveNote = useSaveNote();

  const [form, setForm] = useState({
    date,
    time: "",
    title: "",
    content: "",
    color: "green",
    isDone: false,
  });

  useEffect(() => {
    if (!open) return;
    setForm(
      note
        ? {
            date: note.date,
            time: note.time ?? "",
            title: note.title,
            content: note.content ?? "",
            color: note.color,
            isDone: note.isDone,
          }
        : {
            date,
            time: "",
            title: "",
            content: "",
            color: "green",
            isDone: false,
          }
    );
  }, [open, note, date]);

  const submit = async () => {
    if (!form.title.trim()) {
      toast.error(t("calendar.titleRequired"));
      return;
    }
    try {
      await saveNote.mutateAsync({
        id: note?.id,
        payload: {
          date: form.date,
          time: form.time.trim() || null,
          title: form.title.trim(),
          content: form.content.trim() || null,
          color: form.color,
          isDone: form.isDone,
        },
      });
      toast.success(
        note ? t("calendar.noteUpdated") : t("calendar.noteCreated")
      );
      onOpenChange(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !saveNote.isPending && onOpenChange(next)}
    >
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {note ? t("calendar.editNote") : t("calendar.newNote")}
          </DialogTitle>
          <DialogDescription>{t("calendar.noteHint")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-gray-700">
                {t("common.date")}
              </span>
              <Input
                type="date"
                value={form.date}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, date: e.target.value }))
                }
                className={adminInputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-gray-700">
                {t("calendar.time")}
              </span>
              <Input
                type="time"
                value={form.time}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, time: e.target.value }))
                }
                className={adminInputClass}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              {t("calendar.noteTitle")}
            </span>
            <Input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              maxLength={200}
              className={adminInputClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              {t("common.notes")}
            </span>
            <Textarea
              value={form.content}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={3}
              maxLength={2000}
              className="rounded-xl border-gray-200"
            />
          </label>

          <div>
            <span className="mb-1 block text-sm font-semibold text-gray-700">
              {t("calendar.color")}
            </span>
            <div className="flex gap-2">
              {NOTE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  aria-pressed={form.color === color}
                  onClick={() => setForm((prev) => ({ ...prev, color }))}
                  className={cn(
                    "h-8 w-8 rounded-full transition-transform",
                    SWATCH[color],
                    form.color === color
                      ? "ring-2 ring-gray-900 ring-offset-2"
                      : "hover:scale-110"
                  )}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4">
            <span className="text-sm font-semibold text-gray-800">
              {t("calendar.done")}
            </span>
            <Switch
              checked={form.isDone}
              onCheckedChange={(checked) =>
                setForm((prev) => ({ ...prev, isDone: checked }))
              }
            />
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saveNote.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={saveNote.isPending}
          >
            {saveNote.isPending && <Loader2 className="animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
