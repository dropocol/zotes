"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  format,
  addYears,
  subYears,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  isFuture,
  startOfDay,
  getDay,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { PrayerType, PrayerStatus } from "@/types/prayers";
import { cn } from "@/lib/utils";

interface YearlyViewProps {
  date: Date;
  records: Array<{ date: Date; prayer: PrayerType; status: PrayerStatus }>;
  onDateChange: (date: Date) => void;
  onMonthClick?: (month: Date) => void;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function YearlyView({
  date,
  records,
  onDateChange,
  onMonthClick,
}: YearlyViewProps) {
  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();

  // Create a map for quick lookup by date
  const recordsByDate = React.useMemo(() => {
    const map = new Map<string, { completed: number; qazaa: number; missed: number; total: number }>();
    records.forEach((record) => {
      const dateKey = format(record.date, "yyyy-MM-dd");
      const existing = map.get(dateKey) || { completed: 0, qazaa: 0, missed: 0, total: 0 };
      if (record.status === "YES") {
        existing.completed++;
      } else if (record.status === "QAZAA") {
        existing.qazaa++;
      } else {
        existing.missed++;
      }
      existing.total++;
      map.set(dateKey, existing);
    });
    return map;
  }, [records]);

  const goToPrevious = () => onDateChange(subYears(date, 1));
  const goToNext = () => onDateChange(addYears(date, 1));

  // Generate months for the year
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  // Calculate year stats
  const yearStats = React.useMemo(() => {
    let total = 0;
    let completed = 0;
    let qazaa = 0;

    records.forEach((record) => {
      const recordYear = new Date(record.date).getFullYear();
      if (recordYear === year) {
        total++;
        if (record.status === "YES") completed++;
        if (record.status === "QAZAA") qazaa++;
      }
    });

    return { total, completed, qazaa, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [records, year]);

  return (
    <div className="space-y-4">
      {/* Year Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevious}
          className="h-8 w-8"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">{year}</h2>
          {year === currentYear && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Current Year
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={goToNext}
          className="h-8 w-8"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Year Stats */}
      <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
        <div className="flex flex-col items-center gap-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 px-4 py-2">
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{yearStats.completed}</span>
          <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Prayed</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-2">
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{yearStats.qazaa}</span>
          <span className="text-xs text-amber-600/70 dark:text-amber-400/70">Qazaa</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 rounded-lg bg-primary/5 border border-primary/20 px-4 py-2">
          <span className="text-xl font-bold text-primary">{yearStats.rate}%</span>
          <span className="text-xs text-primary/70">Rate</span>
        </div>
      </div>

      {/* Months Grid */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-3">
        {months.map((monthDate) => {
          const monthStart = startOfMonth(monthDate);
          const monthEnd = endOfMonth(monthDate);
          const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
          const startDay = getDay(monthStart);
          const isCurrentMonth = isToday(new Date()) && monthDate.getMonth() === new Date().getMonth() && year === currentYear;

          return (
            <div
              key={monthDate.toISOString()}
              className={cn(
                "rounded-xl border bg-card shadow-sm overflow-hidden cursor-pointer transition-all",
                "hover:border-primary hover:shadow-md",
                isCurrentMonth && "ring-2 ring-primary border-primary"
              )}
              onClick={() => onMonthClick?.(monthDate)}
            >
              {/* Month Header */}
              <div className={cn(
                "text-center font-semibold text-sm py-1.5 border-b bg-slate-50 dark:bg-slate-900/50",
                isCurrentMonth && "bg-primary/10 text-primary"
              )}>
                {MONTHS[monthDate.getMonth()]}
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-0.5 px-1 pt-1">
                {DAYS.map((day, i) => (
                  <div
                    key={i}
                    className="text-center text-[7px] text-muted-foreground font-medium"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-0.5 p-1">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startDay }, (_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}

                {/* Day cells */}
                {days.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const stats = recordsByDate.get(dateKey);
                  const dayIsToday = isToday(day);
                  const dayIsFuture = isFuture(startOfDay(day));

                  // Determine cell appearance
                  const getCellStyle = () => {
                    if (dayIsFuture) return "bg-slate-50 dark:bg-slate-900/50";
                    if (!stats) return "bg-transparent";

                    const { completed, qazaa, missed, total } = stats;
                    const intensity = total > 0 ? completed / total : 0;
                    const qazaaIntensity = total > 0 ? qazaa / total : 0;

                    if (intensity === 1) return "bg-emerald-500 text-white";
                    if (intensity >= 0.8) return "bg-emerald-400 text-white";
                    if (intensity >= 0.6) return "bg-emerald-300 dark:bg-emerald-700";
                    if (intensity > 0 || qazaaIntensity > 0) return "bg-emerald-200 dark:bg-emerald-800";
                    if (missed > 0) return "bg-red-100 dark:bg-red-900/30";
                    return "bg-transparent";
                  };

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "aspect-square rounded text-[7px] flex items-center justify-center font-medium transition-colors",
                        dayIsToday && "ring-1 ring-primary font-bold",
                        getCellStyle()
                      )}
                      title={stats ? `${stats.completed}/${stats.total} prayers` : "No data"}
                    >
                      {format(day, "d")}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded bg-emerald-500" />
          <span>All prayed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded bg-emerald-300 dark:bg-emerald-700" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded bg-red-100 dark:bg-red-900/30" />
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded bg-slate-100 dark:bg-slate-800" />
          <span>Future</span>
        </div>
      </div>
    </div>
  );
}
