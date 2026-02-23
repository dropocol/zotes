"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { PrayerType, PrayerStatus, getStatusColor, getPrayersForDate } from "@/types/prayers";
import { format, isSameDay, isToday } from "date-fns";

interface PrayerDayCellProps {
  date: Date;
  records: Map<string, PrayerStatus>; // key: "prayerType", value: status
  onClick?: (date: Date) => void;
  isSelected?: boolean;
}

export function PrayerDayCell({
  date,
  records,
  onClick,
  isSelected,
}: PrayerDayCellProps) {
  const prayers = getPrayersForDate(date);
  const today = isToday(date);

  return (
    <button
      onClick={() => onClick?.(date)}
      className={cn(
        "flex flex-col items-center gap-1 rounded-md p-1 text-sm transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        today && "bg-accent/50",
        isSelected && "bg-primary text-primary-foreground hover:bg-primary",
        "w-full aspect-square"
      )}
    >
      <span
        className={cn(
          "text-xs font-medium",
          !today && !isSelected && "text-muted-foreground"
        )}
      >
        {format(date, "d")}
      </span>
      <div className="flex gap-0.5">
        {prayers.map((prayer) => {
          const status = records.get(prayer) || "NO";
          return (
            <span
              key={prayer}
              className={cn(
                "size-1.5 rounded-full",
                getStatusColor(status as PrayerStatus)
              )}
            />
          );
        })}
      </div>
    </button>
  );
}

// Helper to create a records map from an array
export function createRecordsMap(
  records: Array<{ prayer: PrayerType; status: PrayerStatus; date: Date }>,
  targetDate: Date
): Map<string, PrayerStatus> {
  const map = new Map<string, PrayerStatus>();
  records
    .filter((r) => isSameDay(r.date, targetDate))
    .forEach((r) => map.set(r.prayer, r.status));
  return map;
}
