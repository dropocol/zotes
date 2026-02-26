"use client";

import { useState, useEffect } from "react";
import { format, addWeeks, subWeeks, isToday } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CompletionCell } from "./completion-cell";
import {
  RecurringCompletionStatus,
  getWeekDates,
  isSameDay,
  shouldAppearOnDate,
  isFutureDate,
} from "@/types/recurring";

interface RecurringItem {
  id: string;
  title: string;
  frequency?: string | null;
  daysOfWeek?: string | null;
  recurrenceStart?: Date | string | null;
  recurrenceEnd?: Date | string | null;
  completions?: {
    id: string;
    date: Date | string;
    status: string;
  }[];
}

interface RecurringWeeklyViewProps {
  items: RecurringItem[];
  onToggleCompletion: (todoItemId: string, date: Date) => Promise<void>;
  initialDate?: Date;
  onDateChange?: (date: Date) => void;
  showTaskNames?: boolean;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function RecurringWeeklyView({
  items,
  onToggleCompletion,
  initialDate,
  onDateChange,
  showTaskNames = true,
}: RecurringWeeklyViewProps) {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [loadingCells, setLoadingCells] = useState<Set<string>>(new Set());

  // Sync with initialDate prop
  useEffect(() => {
    if (initialDate) {
      setCurrentDate(initialDate);
    }
  }, [initialDate]);

  const weekDates = getWeekDates(currentDate);

  const goToPreviousWeek = () => {
    const newDate = subWeeks(currentDate, 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const goToNextWeek = () => {
    const newDate = addWeeks(currentDate, 1);
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const goToToday = () => {
    const newDate = new Date();
    setCurrentDate(newDate);
    onDateChange?.(newDate);
  };

  const handleToggle = async (todoItemId: string, date: Date) => {
    const cellKey = `${todoItemId}-${format(date, "yyyy-MM-dd")}`;
    setLoadingCells((prev) => new Set(prev).add(cellKey));

    try {
      await onToggleCompletion(todoItemId, date);
    } finally {
      setLoadingCells((prev) => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
    }
  };

  const getCompletionStatus = (
    item: RecurringItem,
    date: Date
  ): string => {
    // Check if this item should appear on this date
    if (!shouldAppearOnDate(item, date)) {
      return "inactive";
    }

    // Future dates can only be "todo" (can't mark them done ahead of time)
    if (isFutureDate(date)) {
      return "future";
    }

    const completion = item.completions?.find((c) => isSameDay(c.date, date));
    return completion?.status || RecurringCompletionStatus.TODO;
  };

  // Check if a date can be toggled (only today and past dates)
  const canToggleDate = (date: Date): boolean => {
    return !isFutureDate(date);
  };

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startMonth = format(start, "MMM");
    const endMonth = format(end, "MMM");

    if (startMonth === endMonth) {
      return `${startMonth} ${format(start, "d")} - ${format(end, "d")}, ${format(start, "yyyy")}`;
    }
    return `${format(start, "MMM d")} - ${format(end, "MMM d")}, ${format(end, "yyyy")}`;
  };

  const gridCols = showTaskNames ? "grid-cols-8" : "grid-cols-7";

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={goToToday}>
            Today
          </Button>
        </div>
        <h2 className="text-lg font-semibold">{formatWeekRange()}</h2>
      </div>

      {/* Weekly Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header Row */}
        <div className={cn("grid bg-muted/50", gridCols)}>
          {showTaskNames && <div className="p-3 font-medium text-sm border-r">Task</div>}
          {weekDates.map((date, i) => (
            <div
              key={i}
              className={cn(
                "p-3 text-center font-medium text-sm border-r last:border-r-0",
                isToday(date) && "bg-primary/10"
              )}
            >
              <div className="text-muted-foreground">{DAY_NAMES[i]}</div>
              <div className={cn(isToday(date) && "text-primary font-bold")}>
                {format(date, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Task Rows */}
        {items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No recurring tasks yet. Make a todo item recurring to see it here.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={cn("grid border-t first:border-t-0", gridCols)}
            >
              {showTaskNames && (
                <div className="p-3 text-sm font-medium border-r truncate">
                  {item.title}
                </div>
              )}
              {weekDates.map((date, i) => {
                const status = getCompletionStatus(item, date);
                const cellKey = `${item.id}-${format(date, "yyyy-MM-dd")}`;
                const isLoading = loadingCells.has(cellKey);
                const canToggle = canToggleDate(date);

                if (status === "inactive") {
                  return (
                    <div
                      key={i}
                      className="p-2 border-r last:border-r-0 bg-muted/20"
                    />
                  );
                }

                // Future dates - show as disabled/todo, not clickable
                if (status === "future") {
                  return (
                    <div
                      key={i}
                      className={cn(
                        "p-2 border-r last:border-r-0 flex items-center justify-center",
                        "bg-muted/10"
                      )}
                      title="Cannot mark future dates"
                    >
                      <div className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground/50 text-sm">
                        ○
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={i}
                    className={cn(
                      "p-2 border-r last:border-r-0 flex items-center justify-center",
                      isToday(date) && "bg-primary/5"
                    )}
                  >
                    <CompletionCell
                      status={status}
                      onClick={() => canToggle && handleToggle(item.id, date)}
                      className={cn(isLoading && "opacity-50", !canToggle && "cursor-not-allowed")}
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/40 flex items-center justify-center text-green-600 dark:text-green-400 text-xs">
            ✓
          </div>
          <span>Done</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
            ○
          </div>
          <span>Todo</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs">
            ⊘
          </div>
          <span>Skipped</span>
        </div>
      </div>
    </div>
  );
}
