"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { CompletionCell } from "./completion-cell";
import {
  RecurringCompletionStatus,
  shouldAppearOnDate,
} from "@/types/recurring";
import {
  getLocalWeekDates,
  isSameDay,
  isFutureDate,
  toUTCDate,
  getLocalToday,
} from "@/utils/date";

interface RecurringItemProgressProps {
  todoItemId: string;
  frequency?: string | null;
  daysOfWeek?: string | null;
  recurrenceStart?: Date | string | null;
  recurrenceEnd?: Date | string | null;
}

const DAY_NAMES = ["S", "M", "T", "W", "T", "F", "S"];

export function RecurringItemProgress({
  todoItemId,
  frequency,
  daysOfWeek,
  recurrenceStart,
  recurrenceEnd,
}: RecurringItemProgressProps) {
  const [completions, setCompletions] = useState<{ id: string; date: string; status: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const item = { frequency, daysOfWeek, recurrenceStart, recurrenceEnd };
  // Use local time for week display (matches user's timezone)
  const weekDates = getLocalWeekDates(new Date());
  const today = getLocalToday();

  // Fetch completions for this item
  useEffect(() => {
    async function fetchCompletions() {
      try {
        const response = await fetch("/api/recurring/completions?startDate=2024-01-01&endDate=2030-12-31");
        if (response.ok) {
          const data = await response.json();
          const itemData = data.items?.find((i: { id: string }) => i.id === todoItemId);
          if (itemData?.completions) {
            setCompletions(itemData.completions);
          }
        }
      } catch (error) {
        console.error("Error fetching completions:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCompletions();
  }, [todoItemId]);

  const handleToggle = useCallback(async (date: Date) => {
    try {
      const response = await fetch("/api/recurring/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          todoItemId,
          date: date.toISOString(),
        }),
      });

      if (response.ok) {
        const completion = await response.json();
        setCompletions((prev) => {
          const existingIndex = prev.findIndex((c) => isSameDay(c.date, date));
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = { ...updated[existingIndex], status: completion.status };
            return updated;
          }
          return [...prev, { id: completion.id, date: completion.date, status: completion.status }];
        });
      }
    } catch (error) {
      console.error("Error toggling completion:", error);
    }
  }, [todoItemId]);

  const getCompletionStatus = (date: Date): string => {
    // Check if date is before recurrence start
    if (recurrenceStart) {
      const startDate = toUTCDate(recurrenceStart);
      if (date < startDate && !isSameDay(date, startDate)) {
        return "before_start";
      }
    }

    // Check if date is after recurrence end
    if (recurrenceEnd) {
      const endDate = toUTCDate(recurrenceEnd);
      if (date > endDate && !isSameDay(date, endDate)) {
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

  const canToggleDate = (date: Date): boolean => {
    const status = getCompletionStatus(date);
    return !isFutureDate(date) && !["before_start", "after_end", "inactive"].includes(status);
  };

  // Calculate stats (only active days)
  const doneCount = completions.filter((c) => c.status === "done").length;
  const activeDays = weekDates.filter((date) => {
    const status = getCompletionStatus(date);
    return !["inactive", "future", "before_start", "after_end"].includes(status);
  }).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">This Week</span>
        {activeDays > 0 && (
          <span className="text-xs text-muted-foreground">
            {doneCount}/{activeDays} completed
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="w-8 h-8 rounded bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Day headers */}
          <div className="flex gap-1">
            {weekDates.map((date, i) => (
              <div
                key={i}
                className={cn(
                  "w-8 text-center text-xs",
                  isSameDay(date, today) ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {DAY_NAMES[i]}
              </div>
            ))}
          </div>

          {/* Completion cells - always show all 7 */}
          <div className="flex gap-1">
            {weekDates.map((date, i) => {
              const status = getCompletionStatus(date);
              const canToggle = canToggleDate(date);
              const isTodayDate = isSameDay(date, today);

              // Before start or after end - grayed out, not clickable
              if (status === "before_start" || status === "after_end") {
                return (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-md bg-muted-foreground/15 flex items-center justify-center"
                    title={status === "before_start" ? "Before start date" : "After end date"}
                  >
                    <span className="text-[10px] text-muted-foreground/50">-</span>
                  </div>
                );
              }

              // Inactive (not scheduled based on frequency)
              if (status === "inactive") {
                return (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-md bg-muted-foreground/25 flex items-center justify-center"
                    title="Not scheduled"
                  >
                    <span className="text-[10px] text-muted-foreground/60">○</span>
                  </div>
                );
              }

              // Future - show but not clickable
              if (status === "future") {
                return (
                  <div
                    key={i}
                    className={cn(
                      "w-8 h-8 rounded-md bg-muted-foreground/35 flex items-center justify-center",
                      isTodayDate && "ring-2 ring-primary/50"
                    )}
                    title="Future date"
                  >
                    <span className="text-xs text-muted-foreground/60">○</span>
                  </div>
                );
              }

              // Active and toggleable
              return (
                <CompletionCell
                  key={i}
                  status={status}
                  onClick={() => canToggle && handleToggle(date)}
                  size="sm"
                  className={cn(isTodayDate && status !== "done" && "ring-2 ring-primary")}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
