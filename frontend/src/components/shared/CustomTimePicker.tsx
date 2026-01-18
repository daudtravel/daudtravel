import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useTranslations } from "next-intl";

interface TimePickerProps {
  value?: Date;
  onChange: (time: Date) => void;
  placeholder?: string;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  const [selectedHour, setSelectedHour] = useState(
    value ? value.getHours().toString().padStart(2, "0") : ""
  );
  const [selectedMinute, setSelectedMinute] = useState(
    value ? value.getMinutes().toString().padStart(2, "0") : ""
  );

  const handleTimeChange = (hour: string, minute: string) => {
    const newDate = new Date();
    newDate.setHours(parseInt(hour), parseInt(minute), 0, 0);
    onChange(newDate);
  };

  const t = useTranslations("transfers");

  return (
    <div className="flex items-center space-x-2">
      <div className="flex-1">
        <Select
          onValueChange={(hour) => {
            setSelectedHour(hour);
            if (selectedMinute) {
              handleTimeChange(hour, selectedMinute);
            }
          }}
          value={selectedHour}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder={t("hour")}>
              {selectedHour ? `${selectedHour}h` : t("hour")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {hours.map((hour) => (
              <SelectItem key={hour} value={hour}>
                {hour}h
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
        <Select
          onValueChange={(minute) => {
            setSelectedMinute(minute);
            if (selectedHour) {
              handleTimeChange(selectedHour, minute);
            }
          }}
          value={selectedMinute}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder={t("minute")}>
              {selectedMinute ? `${selectedMinute}m` : t("minute")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {minutes.map((minute) => (
              <SelectItem key={minute} value={minute}>
                {minute}m
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
