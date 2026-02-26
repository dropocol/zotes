"use client";

import * as React from "react";
import {
  format,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  isFuture,
  startOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
} from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrayerStatusPill } from "./prayer-status-selector";
import {
  PrayerType,
  PrayerStatus,
  getPrayersForDate,
  getStatusDotColor,
} from "@/types/prayers";
import { cn } from "@/lib/utils";

interface MonthlyViewProps {
  date: Date;
  records: Array<{ date: Date; prayer: PrayerType; status: PrayerStatus }>;
  onDateChange: (date: Date) => void;
  onStatusChange: (date: Date, prayer: PrayerType, status: PrayerStatus) => void;
  selectedDay?: Date;
  onDaySelect?: (date: Date) => void;
}

export function MonthlyView({
  date,
  records,
  onDateChange,
  onStatusChange,
  selectedDay,
  onDaySelect,
}: MonthlyViewProps) {
  const [internalSelectedDay, setInternalSelectedDay] = React.useState<Date>(
    selectedDay || new Date()
  );

  const selected = selectedDay || internalSelectedDay;
  const selectedIsFuture = isFuture(startOfDay(selected));

  // Create a map for quick lookup by date
  const recordsByDate = React.useMemo(() => {
    const map = new Map<string, Map<string, PrayerStatus>>();
    records.forEach((record) => {
      const dateKey = format(record.date, "yyyy-MM-dd");
      if (!map.has(dateKey)) {
        map.set(dateKey, new Map());
      }
      map.get(dateKey)!.set(record.prayer, record.status);
    });
    return map;
  }, [records]);

  // Get records for selected day
  const selectedDateKey = format(selected, "yyyy-MM-dd");
  const selectedDayRecords = selectedDateKey
    ? recordsByDate.get(selectedDateKey) || new Map()
    : new Map();

  // Calculate stats for selected day
  const prayers = getPrayersForDate(selected);
  const prayedCount = prayers.filter((p) => selectedDayRecords.get(p) === "YES").length;
  const qazaaCount = prayers.filter((p) => selectedDayRecords.get(p) === "QAZAA").length;
  const missedCount = prayers.filter((p) => selectedDayRecords.get(p) === "NO").length;

  const handleDayClick = (day: Date) => {
    setInternalSelectedDay(day);
    onDaySelect?.(day);
  };

  // Generate calendar days
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Grid */}
      <div className="flex-1">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{format(date, "MMMM yyyy")}</h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={() => onDateChange(subMonths(date, 1))}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDateChange(new Date())}
            >
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={() => onDateChange(addMonths(date, 1))}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
            <div
              key={dayName}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {dayName}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayRecords = recordsByDate.get(dateKey);
            const prayersForDay = getPrayersForDate(day);
            const isCurrentMonth = isSameMonth(day, date);
            const isSelectedDay = isSameDay(day, selected);
            const dayIsToday = isToday(day);
            const dayIsFuture = isFuture(startOfDay(day));

            // Calculate completion for this day
            const dayPrayed = prayersForDay.filter((p) => dayRecords?.get(p) === "YES").length;
            const completionRate = (dayPrayed / prayersForDay.length) * 100;

            return (
              <div
                key={dateKey}
                className={cn(
                  "min-h-[80px] p-1.5 rounded-lg border cursor-pointer transition-colors",
                  !isCurrentMonth && "bg-muted/30 opacity-50",
                  isCurrentMonth && "bg-background",
                  isSelectedDay && "ring-2 ring-primary",
                  dayIsToday && "border-primary",
                  !isSelectedDay && isCurrentMonth && "hover:bg-muted/50",
                  isCurrentMonth && !dayIsFuture && completionRate === 100 && "bg-emerald-50 dark:bg-emerald-950/30",
                  isCurrentMonth && !dayIsFuture && completionRate > 0 && completionRate < 100 && "bg-amber-50/50 dark:bg-amber-950/20"
                )}
                onClick={() => handleDayClick(day)}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-1",
                    !isCurrentMonth && "text-muted-foreground",
                    dayIsToday && "text-primary"
                  )}
                >
                  {format(day, "d")}
                </div>

                {/* Prayer dots */}
                {isCurrentMonth && !dayIsFuture && (
                  <div className="flex gap-0.5 justify-center">
                    {prayersForDay.map((prayer) => {
                      const status = dayRecords?.get(prayer) || "NO";
                      return (
                        <span
                          key={prayer}
                          className={cn(
                            "size-2 rounded-full transition-colors",
                            getStatusDotColor(status as PrayerStatus)
                          )}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      <div className="lg:w-72 shrink-0 space-y-4">
        {/* Date Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{format(selected, "EEEE")}</h3>
            <p className="text-sm text-muted-foreground">
              {format(selected, "MMMM d, yyyy")}
            </p>
          </div>
          {isToday(selected) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Today
            </span>
          )}
          {selectedIsFuture && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400">
              <Clock className="size-3" />
              Future
            </span>
          )}
        </div>

        {/* Mini Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1.5">
            <CheckCircle2 className="size-3.5 text-emerald-500" />
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{prayedCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 px-2 py-1.5">
            <AlertCircle className="size-3.5 text-amber-500" />
            <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{qazaaCount}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-muted px-2 py-1.5">
            <XCircle className="size-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{missedCount}</span>
          </div>
        </div>

        {/* Prayers List */}
        <div className="space-y-2">
          {selectedIsFuture && (
            <div className="flex items-start gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-600 dark:text-blue-300">
              <Clock className="size-3.5 shrink-0 mt-0.5" />
              <span>Future prayers cannot be marked. Please wait until the day arrives.</span>
            </div>
          )}

          {prayers.map((prayer) => (
            <PrayerStatusPill
              key={prayer}
              prayer={prayer}
              status={selectedDayRecords.get(prayer) || "NO"}
              onStatusChange={(p, s) => onStatusChange(selected, p, s)}
              disabled={selectedIsFuture}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground mb-2">Legend</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Prayed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              <span>Qazaa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-muted-foreground/40" />
              <span>Missed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
