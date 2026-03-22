"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  RecurringCompletionStatus,
  shouldAppearOnDate,
} from "@/types/recurring";
import {
  getLocalWeekDates,
  isSameDay,
  isFutureDate,
  getLocalToday,
  utcToLocal,
  toComparableDate,
} from "@/utils/date";

interface RecurringMiniProgressProps {
  todoItemId: string;
  frequency?: string | null;
  daysOfWeek?: string | null;
  recurrenceStart?: Date | string | null;
  recurrenceEnd?: Date | string | null;
}

const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

export function RecurringMiniProgress({
  todoItemId,
  frequency,
  daysOfWeek,
  recurrenceStart,
  recurrenceEnd,
}: RecurringMiniProgressProps) {
  const [completions, setCompletions] = useState<{ date: string; status: string }[]>([]);

  const item = { frequency, daysOfWeek, recurrenceStart, recurrenceEnd };
  // Use local time for week display (matches user's timezone)
  const weekDates = useMemo(() => getLocalWeekDates(new Date()), []);
  const today = useMemo(() => getLocalToday(), []);

  // Build date range for the current week with 1-day buffer for timezone safety
  const weekRange = useMemo(() => {
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const addDays = (d: Date, n: number) => {
      const r = new Date(d);
      r.setDate(r.getDate() + n);
      return r;
    };
    const start = addDays(weekDates[0], -1);
    const end = addDays(weekDates[weekDates.length - 1], 1);
    return { start: fmt(start), end: fmt(end) };
  }, [weekDates]);

  async function fetchCompletions() {
    try {
      const params = new URLSearchParams({
        startDate: weekRange.start,
        endDate: weekRange.end,
        todoItemId,
      });
      const response = await fetch(`/api/recurring/completions?${params}&_t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        const itemData = data.items?.[0];
        if (itemData?.completions) {
          setCompletions(itemData.completions);
        }
      }
    } catch (error) {
      console.error("Error fetching completions:", error);
    }
  }

  // Fetch completions for this item (current week, single item)
  useEffect(() => {
    if (todoItemId) {
      fetchCompletions();
    }
  }, [todoItemId, weekRange.start, weekRange.end]);

  // Re-fetch completions when a checkbox toggle updates a recurring completion
  useEffect(() => {
    function onCompletionUpdated(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.todoItemId === todoItemId) {
        fetchCompletions();
      }
    }

    window.addEventListener("recurring-completion-updated", onCompletionUpdated);
    return () => window.removeEventListener("recurring-completion-updated", onCompletionUpdated);
  }, [todoItemId]);

  const getCompletionStatus = (date: Date): string => {
    // Convert local week date to comparable format (preserves local date)
    const comparableDate = toComparableDate(date);

    // Check if date is before recurrence start
    if (recurrenceStart) {
      const startDate = utcToLocal(recurrenceStart);
      if (comparableDate < startDate && !isSameDay(comparableDate, startDate)) {
        return "before_start";
      }
    }

    // Check if date is after recurrence end
    if (recurrenceEnd) {
      const endDate = utcToLocal(recurrenceEnd);
      if (comparableDate > endDate && !isSameDay(comparableDate, endDate)) {
        return "after_end";
      }
    }

    if (!shouldAppearOnDate(item, date)) {
      return "inactive";
    }
    if (isFutureDate(date)) {
      return "future";
    }
    const completion = completions.find((c) => isSameDay(c.date, date));
    return completion?.status || RecurringCompletionStatus.TODO;
  };

  // Count completed this week (only active days, excluding before_start/after_end)
  const completedThisWeek = weekDates.filter((date) => {
    const status = getCompletionStatus(date);
    return status === "done";
  }).length;

  const activeDaysThisWeek = weekDates.filter((date) => {
    const status = getCompletionStatus(date);
    return !["inactive", "future", "before_start", "after_end"].includes(status);
  }).length;

  return (
    <Link
      href={`/recurring?taskId=${todoItemId}`}
      className="flex items-center gap-1 flex-shrink-0 cursor-pointer group"
      title="Click to view full history"
    >
      {/* Mini week progress - always show all 7 days */}
      {weekDates.map((date, i) => {
        const status = getCompletionStatus(date);
        const isTodayDate = isSameDay(date, today);

        return (
          <div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              // Before start date
              status === "before_start" && "bg-muted-foreground/15",
              // After end date
              status === "after_end" && "bg-muted-foreground/15",
              // Inactive (not scheduled on this day based on frequency)
              status === "inactive" && "bg-muted-foreground/25",
              // Future (scheduled but can't mark yet)
              status === "future" && "bg-muted-foreground/35",
              // Done
              status === "done" && "bg-green-500",
              // Todo
              status === "todo" && "bg-muted-foreground/50",
              // Today indicator (not for done items)
              isTodayDate && !["before_start", "after_end", "done"].includes(status) && "bg-red-500",
              // Skipped
              status === "skipped" && "bg-amber-500",
              // Hover effect
              "group-hover:scale-110"
            )}
            title={`${DAY_NAMES[i]} - ${
              status === "before_start" ? "Before start" :
              status === "after_end" ? "After end" :
              status === "inactive" ? "Not scheduled" :
              status
            }`}
          />
        );
      })}

      {/* Completion count */}
      <span className="text-[10px] text-muted-foreground ml-0.5 tabular-nums group-hover:text-foreground transition-colors">
        {completedThisWeek}/{activeDaysThisWeek}
      </span>
    </Link>
  );
}
