"use client";

import * as React from "react";
import { format, addMonths, subMonths, isSameDay, isSameMonth, isToday, isFuture, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { PrayerStatusPill } from "./prayer-status-selector";
import {
  PrayerType,
  PrayerStatus,
  getPrayersForDate,
  getStatusDotColor,
  getPrayerDisplayName,
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
  const [internalSelectedDay, setInternalSelectedDay] = React.useState<Date | undefined>(
    selectedDay || new Date()
  );

  const selected = selectedDay || internalSelectedDay || new Date();
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
  const selectedDateKey = selected ? format(selected, "yyyy-MM-dd") : null;
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

  // Custom day button with prayer indicators
  const CustomDayButton = ({
    day,
    modifiers,
    ...props
  }: {
    day: { date: Date };
    modifiers?: Record<string, boolean>;
  } & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    const dateKey = format(day.date, "yyyy-MM-dd");
    const dayRecords = recordsByDate.get(dateKey);
    const prayersForDay = getPrayersForDate(day.date);
    const isCurrentMonth = isSameMonth(day.date, date);
    const isSelectedDay = selected ? isSameDay(day.date, selected) : false;
    const dayIsToday = isToday(day.date);
    const dayIsFuture = isFuture(startOfDay(day.date));

    // Calculate completion for this day
    const dayPrayed = prayersForDay.filter((p) => dayRecords?.get(p) === "YES").length;
    const completionRate = (dayPrayed / prayersForDay.length) * 100;

    // Background based on completion
    const getDayBackground = () => {
      if (!isCurrentMonth || !dayRecords) return "";
      if (dayIsFuture) return "";
      if (completionRate === 100) return "bg-emerald-100 dark:bg-emerald-900/30";
      if (completionRate >= 60) return "bg-emerald-50 dark:bg-emerald-900/20";
      if (completionRate > 0) return "bg-amber-50 dark:bg-amber-900/20";
      return "";
    };

    return (
      <button
        {...props}
        onClick={(e) => {
          props.onClick?.(e);
          handleDayClick(day.date);
        }}
        className={cn(
          "relative flex flex-col items-center justify-center gap-0.5 rounded-lg p-1 text-sm transition-all w-full aspect-square",
          "hover:ring-2 hover:ring-primary/30",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          !isCurrentMonth && "text-muted-foreground opacity-40",
          dayIsToday && "ring-2 ring-primary",
          isSelectedDay && "bg-primary/10 ring-2 ring-primary",
          !isSelectedDay && getDayBackground(),
          props.className
        )}
      >
        {/* Date number */}
        <span className={cn(
          "text-xs font-medium z-10",
          dayIsToday && "text-primary font-bold"
        )}>
          {format(day.date, "d")}
        </span>

        {/* Prayer dots */}
        {isCurrentMonth && !dayIsFuture && (
          <div className="flex gap-0.5 mt-0.5">
            {prayersForDay.map((prayer) => {
              const status = dayRecords?.get(prayer) || "NO";
              return (
                <span
                  key={prayer}
                  className={cn(
                    "size-1.5 rounded-full transition-colors",
                    getStatusDotColor(status as PrayerStatus)
                  )}
                />
              );
            })}
          </div>
        )}

        {/* Future indicator */}
        {isCurrentMonth && dayIsFuture && (
          <div className="flex gap-0.5 mt-0.5">
            {prayersForDay.map((prayer) => (
              <span
                key={prayer}
                className="size-1.5 rounded-full bg-slate-200 dark:bg-slate-700"
              />
            ))}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDateChange(subMonths(date, 1))}
          className="h-8 w-8"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <h2 className="text-lg font-semibold">{format(date, "MMMM yyyy")}</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onDateChange(addMonths(date, 1))}
          className="h-8 w-8"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      <div className="grid lg:grid-cols-[1fr,280px] gap-6">
        {/* Calendar */}
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={(day) => day && handleDayClick(day)}
            month={date}
            onMonthChange={onDateChange}
            className="border-0"
            components={{
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              DayButton: CustomDayButton as any,
            }}
          />
        </div>

        {/* Selected Day Details */}
        <div className="space-y-4">
          {/* Date Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">
                {format(selected, "EEEE")}
              </h3>
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
            <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 px-2 py-1.5">
              <XCircle className="size-3.5 text-slate-400" />
              <span className="text-sm font-medium text-slate-500">{missedCount}</span>
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
                <span className="size-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>Missed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
