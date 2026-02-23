"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import { format, addDays, subDays, isToday, isFuture, isPast, startOfDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { PrayerStatusSelector } from "./prayer-status-selector";
import {
  PrayerType,
  PrayerStatus,
  getPrayersForDate,
  getStatusDisplayName,
} from "@/types/prayers";
import { cn } from "@/lib/utils";

interface DailyViewProps {
  date: Date;
  records: Map<string, PrayerStatus>; // key: prayer type, value: status
  onDateChange: (date: Date) => void;
  onStatusChange: (prayer: PrayerType, status: PrayerStatus) => void;
}

export function DailyView({
  date,
  records,
  onDateChange,
  onStatusChange,
}: DailyViewProps) {
  const prayers = getPrayersForDate(date);
  const dateIsToday = isToday(date);
  const dateIsFuture = isFuture(startOfDay(date));

  const goToPrevious = () => onDateChange(subDays(date, 1));
  const goToNext = () => onDateChange(addDays(date, 1));
  const goToToday = () => onDateChange(new Date());

  // Calculate stats
  const prayedCount = prayers.filter((p) => records.get(p) === "YES").length;
  const qazaaCount = prayers.filter((p) => records.get(p) === "QAZAA").length;
  const missedCount = prayers.filter((p) => records.get(p) === "NO").length;
  const completionRate = Math.round((prayedCount / prayers.length) * 100);

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevious}
          className="h-9 w-9"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="flex flex-col items-center gap-1">
          <h2 className={cn(
            "text-xl font-semibold",
            dateIsToday && "text-primary"
          )}>
            {format(date, "EEEE")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {format(date, "MMMM d, yyyy")}
          </p>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNext}
          disabled={dateIsFuture}
          className="h-9 w-9"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>

      {/* Quick Navigation */}
      {!dateIsToday && (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="text-primary"
          >
            Jump to Today
          </Button>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3">
          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{prayedCount}</span>
          <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Prayed</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
          <AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{qazaaCount}</span>
          <span className="text-xs text-amber-600/70 dark:text-amber-400/70">Qazaa</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-3">
          <XCircle className="size-5 text-slate-400" />
          <span className="text-2xl font-bold text-slate-400">{missedCount}</span>
          <span className="text-xs text-slate-400/70">Missed</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Daily Progress</span>
          <span className="font-medium">{completionRate}%</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Prayers List */}
      <div className="space-y-2">
        {dateIsFuture && (
          <div className="flex items-center gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
            <Clock className="size-4 shrink-0" />
            <span>Future prayers cannot be marked. Please wait until the day arrives.</span>
          </div>
        )}

        <div className="grid gap-2">
          {prayers.map((prayer) => (
            <PrayerStatusSelector
              key={prayer}
              prayer={prayer}
              status={records.get(prayer) || "NO"}
              onStatusChange={onStatusChange}
              disabled={dateIsFuture}
            />
          ))}
        </div>
      </div>

      {/* Date Badge */}
      {dateIsToday && (
        <div className="flex justify-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            Today
          </span>
        </div>
      )}
    </div>
  );
}
