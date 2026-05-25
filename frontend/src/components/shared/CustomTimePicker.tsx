import React from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value?: Date;
  onChange: (time: Date) => void;
  placeholder?: string;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
  const toTimeString = (d?: Date) => {
    if (!d) return "";
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(":").map(Number);
    if (isNaN(h) || isNaN(m)) return;
    const next = new Date();
    next.setHours(h, m, 0, 0);
    onChange(next);
  };

  return (
    <div className="relative flex items-center">
      <Clock className="absolute left-3 h-4 w-4 text-brand-green pointer-events-none" />
      <input
        type="time"
        value={toTimeString(value)}
        onChange={handleChange}
        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-colors"
      />
    </div>
  );
}
