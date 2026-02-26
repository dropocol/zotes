"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CompletionCell } from "./completion-cell";
import {
  RecurringCompletionStatus,
  getWeekDates,
  isSameDay,
  shouldAppearOnDate,
  isFutureDate,
  toUTCDate,
} from "@/types/recurring";

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
  const weekDates = getWeekDates(new Date());

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
    return !isFutureDate(date);
  };

  // Calculate stats
  const doneCount = completions.filter((c) => c.status === "done").length;
  const totalCount = completions.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">This Week</span>
        {totalCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {doneCount}/{totalCount} completed
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
                className="w-8 text-center text-xs text-muted-foreground"
              >
                {DAY_NAMES[i]}
              </div>
            ))}
          </div>

          {/* Completion cells */}
          <div className="flex gap-1">
            {weekDates.map((date, i) => {
              const status = getCompletionStatus(date);
              const canToggle = canToggleDate(date);

              if (status === "inactive") {
                return (
                  <div
                    key={i}
                    className="w-8 h-8 rounded bg-muted/20"
                  />
                );
              }

              if (status === "future") {
                return (
                  <div
                    key={i}
                    className="w-8 h-8 rounded bg-muted/10 flex items-center justify-center text-muted-foreground/40 text-xs"
                    title="Future date"
                  >
                    ○
                  </div>
                );
              }

              return (
                <CompletionCell
                  key={i}
                  status={status}
                  onClick={() => canToggle && handleToggle(date)}
                  size="sm"
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
