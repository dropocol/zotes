"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, XCircle, Clock, Sun, Sunrise, Sunset, Moon, CloudSun, Users } from "lucide-react";
import {
  format,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isToday,
  isFuture,
  startOfDay,
} from "date-fns";
import { Button } from "@/components/ui/button";
import {
  PrayerType,
  PrayerStatus,
  getPrayersForDate,
  getPrayerDisplayName,
  getStatusBgColor,
} from "@/types/prayers";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";

interface WeeklyViewProps {
  date: Date;
  records: Map<string, Map<string, PrayerStatus>>; // outer key: date string, inner key: prayer type
  onDateChange: (date: Date) => void;
  onStatusChange: (date: Date, prayer: PrayerType, status: PrayerStatus) => void;
}

const STATUS_OPTIONS: PrayerStatus[] = ["YES", "NO", "QAZAA"];

const PRAYER_ICONS: Record<PrayerType, React.ComponentType<{ className?: string }>> = {
  FAJR: Sunrise,
  ZOHAR: Sun,
  ASR: CloudSun,
  MAGHRIB: Sunset,
  ISHA: Moon,
  JUMAH: Users,
};

// Compact prayer status button for weekly view
function CompactPrayerButton({
  prayer,
  status,
  onStatusChange,
  disabled,
}: {
  prayer: PrayerType;
  status: PrayerStatus;
  onStatusChange: (status: PrayerStatus) => void;
  disabled: boolean;
}) {
  const Icon = PRAYER_ICONS[prayer];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 w-full rounded px-1.5 py-1 text-xs transition-colors",
            "hover:bg-slate-100 dark:hover:bg-slate-800",
            disabled && "opacity-50 cursor-not-allowed pointer-events-none"
          )}
          disabled={disabled}
        >
          <div className={cn(
            "size-3.5 rounded-sm flex items-center justify-center",
            getStatusBgColor(status)
          )}>
            <Icon className={cn("size-2.5", status === "YES" ? "text-white" : "text-slate-600 dark:text-slate-300")} />
          </div>
          <span className="truncate flex-1 text-left font-medium">
            {getPrayerDisplayName(prayer)}
          </span>
          <div className={cn(
            "size-2 rounded-full",
            getStatusBgColor(status)
          )} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {STATUS_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => onStatusChange(option)}
            className="flex items-center gap-2 cursor-pointer text-xs"
          >
            <div className={cn("size-2.5 rounded-full", getStatusBgColor(option))} />
            <span className="flex-1">
              {option === "YES" ? "Prayed" : option === "NO" ? "Missed" : "Qazaa"}
            </span>
            {status === option && <Check className="size-3" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function WeeklyView({
  date,
  records,
  onDateChange,
  onStatusChange,
}: WeeklyViewProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const goToPrevious = () => onDateChange(subWeeks(date, 1));
  const goToNext = () => onDateChange(addWeeks(date, 1));
  const goToToday = () => onDateChange(new Date());

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
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
          <h2 className="text-lg font-semibold">
            {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
          </h2>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            This Week
          </Button>
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

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-2">
        {/* Day Headers */}
        {days.map((day) => {
          const dayIsToday = isToday(day);
          return (
            <div
              key={`header-${day.toISOString()}`}
              className={cn(
                "text-center py-2 rounded-t-lg",
                dayIsToday && "bg-primary/10"
              )}
            >
              <div className={cn(
                "text-xs font-medium",
                dayIsToday ? "text-primary" : "text-muted-foreground"
              )}>
                {format(day, "EEE")}
              </div>
              <div className={cn(
                "text-lg font-bold mt-0.5",
                dayIsToday && "text-primary"
              )}>
                {format(day, "d")}
              </div>
            </div>
          );
        })}

        {/* Day Cells */}
        {days.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayRecords = records.get(dateKey) || new Map();
          const prayers = getPrayersForDate(day);
          const dayIsToday = isToday(day);
          const dayIsFuture = isFuture(startOfDay(day));

          // Calculate completion
          const prayed = prayers.filter((p) => dayRecords.get(p) === "YES").length;
          const completionRate = (prayed / prayers.length) * 100;

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "rounded-lg border bg-card shadow-sm overflow-hidden",
                dayIsToday && "border-primary ring-1 ring-primary/20",
                dayIsFuture && "opacity-60"
              )}
            >
              {/* Completion bar */}
              <div className="h-1 bg-slate-100 dark:bg-slate-800">
                <div
                  className={cn(
                    "h-full transition-all",
                    completionRate === 100 ? "bg-emerald-500" : "bg-emerald-400"
                  )}
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              {/* Mini stats */}
              <div className="flex items-center justify-center gap-2 py-1.5 border-b bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-emerald-500" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{prayed}</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="size-3 text-amber-500" />
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    {prayers.filter((p) => dayRecords.get(p) === "QAZAA").length}
                  </span>
                </div>
              </div>

              {/* Prayers */}
              <div className="p-1.5 space-y-0.5 min-h-[140px]">
                {dayIsFuture ? (
                  <div className="flex flex-col items-center justify-center h-full py-4 gap-1">
                    <Clock className="size-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Future</span>
                  </div>
                ) : (
                  prayers.map((prayer) => (
                    <CompactPrayerButton
                      key={prayer}
                      prayer={prayer}
                      status={dayRecords.get(prayer) || "NO"}
                      onStatusChange={(s) => onStatusChange(day, prayer, s)}
                      disabled={dayIsFuture}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-2">
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-sm bg-emerald-500" />
          <span>Prayed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-sm bg-amber-500" />
          <span>Qazaa</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-3 rounded-sm bg-slate-300 dark:bg-slate-600" />
          <span>Missed</span>
        </div>
      </div>
    </div>
  );
}
