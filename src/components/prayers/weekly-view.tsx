"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Sunrise, Sun, CloudSun, Sunset, Moon, Users, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
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
  PRAYER_STATUSES,
  getStatusDisplayName,
} from "@/types/prayers";
import { cn } from "@/lib/utils";

interface WeeklyViewProps {
  date: Date;
  records: Map<string, Map<string, PrayerStatus>>; // outer key: date string, inner key: prayer type
  onDateChange: (date: Date) => void;
  onStatusChange: (date: Date, prayer: PrayerType, status: PrayerStatus) => void;
  selectedDay?: Date;
  onDaySelect?: (date: Date) => void;
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const PRAYER_ICONS: Record<PrayerType, React.ComponentType<{ className?: string }>> = {
  FAJR: Sunrise,
  ZOHAR: Sun,
  ASR: CloudSun,
  MAGHRIB: Sunset,
  ISHA: Moon,
  JUMAH: Users,
};

// Use centralized prayer statuses from types
const STATUS_CYCLE: PrayerStatus[] = PRAYER_STATUSES;

// Prayer status cell - click to cycle through statuses
function PrayerStatusCell({
  status,
  onClick,
  disabled,
  isLoading,
}: {
  status: PrayerStatus;
  onClick: () => void;
  disabled: boolean;
  isLoading?: boolean;
}) {
  const getStyles = () => {
    switch (status) {
      case PrayerStatus.YES:
        return {
          bg: "bg-emerald-100 dark:bg-emerald-900/40 hover:bg-emerald-200 dark:hover:bg-emerald-900/60",
          icon: "✓",
          text: "text-emerald-600 dark:text-emerald-400",
        };
      case PrayerStatus.QAZAA:
        return {
          bg: "bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60",
          icon: "⊙",
          text: "text-amber-600 dark:text-amber-400",
        };
      case PrayerStatus.NO_QASR:
        return {
          bg: "bg-sky-100 dark:bg-sky-900/40 hover:bg-sky-200 dark:hover:bg-sky-900/60",
          icon: "○",
          text: "text-sky-600 dark:text-sky-400",
        };
      case PrayerStatus.QAZAA_QASR:
        return {
          bg: "bg-indigo-100 dark:bg-indigo-900/40 hover:bg-indigo-200 dark:hover:bg-indigo-900/60",
          icon: "⊙",
          text: "text-indigo-600 dark:text-indigo-400",
        };
      case PrayerStatus.NO:
      default:
        return {
          bg: "bg-muted hover:bg-muted/80",
          icon: "○",
          text: "text-muted-foreground",
        };
    }
  };

  const styles = getStyles();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-8 h-8 rounded-md flex items-center justify-center font-medium transition-colors",
        styles.bg,
        styles.text,
        disabled && "opacity-40 cursor-not-allowed",
        isLoading && "opacity-50"
      )}
      title={getStatusDisplayName(status)}
    >
      {styles.icon}
    </button>
  );
}

export function WeeklyView({
  date,
  records,
  onDateChange,
  onStatusChange,
  selectedDay,
  onDaySelect,
}: WeeklyViewProps) {
  const [loadingCells, setLoadingCells] = React.useState<Set<string>>(new Set());

  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Get all unique prayers that could appear in this week
  const allPrayersThisWeek = React.useMemo(() => {
    const prayerSet = new Set<PrayerType>();
    days.forEach((day) => {
      getPrayersForDate(day).forEach((p) => prayerSet.add(p));
    });
    // Return in a consistent order
    const orderedPrayers: PrayerType[] = ["FAJR", "ZOHAR", "ASR", "MAGHRIB", "ISHA", "JUMAH"];
    return orderedPrayers.filter((p) => prayerSet.has(p));
  }, [days]);

  const goToPrevious = () => onDateChange(subWeeks(date, 1));
  const goToNext = () => onDateChange(addWeeks(date, 1));
  const goToToday = () => onDateChange(new Date());

  // Aggregate stats across the current week. Only counts prayers that occur
  // on each day and skips future days, so the rate reflects markable prayers.
  const weekStats = React.useMemo(() => {
    let prayed = 0;
    let qazaa = 0;
    let missed = 0;

    days.forEach((day) => {
      if (isFuture(startOfDay(day))) return;
      const dateKey = format(day, "yyyy-MM-dd");
      const dayRecords = records.get(dateKey);
      getPrayersForDate(day).forEach((prayer) => {
        const status = dayRecords?.get(prayer) || PrayerStatus.NO;
        if (status === PrayerStatus.YES) prayed++;
        else if (status === PrayerStatus.QAZAA) qazaa++;
        else missed++;
      });
    });

    const total = prayed + qazaa + missed;
    return {
      prayed,
      qazaa,
      missed,
      rate: total > 0 ? Math.round((prayed / total) * 100) : 0,
    };
  }, [days, records]);

  const formatWeekRange = () => {
    const startMonth = format(weekStart, "MMM");
    const endMonth = format(weekEnd, "MMM");

    if (startMonth === endMonth) {
      return `${startMonth} ${format(weekStart, "d")} - ${format(weekEnd, "d")}, ${format(weekStart, "yyyy")}`;
    }
    return `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}, ${format(weekEnd, "yyyy")}`;
  };

  const handleToggle = async (prayer: PrayerType, day: Date, currentStatus: PrayerStatus) => {
    const cellKey = `${prayer}-${format(day, "yyyy-MM-dd")}`;
    setLoadingCells((prev) => new Set(prev).add(cellKey));

    try {
      const currentIndex = STATUS_CYCLE.indexOf(currentStatus);
      const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
      onStatusChange(day, prayer, nextStatus);
    } finally {
      setLoadingCells((prev) => {
        const next = new Set(prev);
        next.delete(cellKey);
        return next;
      });
    }
  };

  const getPrayerStatus = (prayer: PrayerType, day: Date): PrayerStatus => {
    const dateKey = format(day, "yyyy-MM-dd");
    const dayRecords = records.get(dateKey);
    return dayRecords?.get(prayer) || PrayerStatus.NO;
  };

  const isPrayerOnDay = (prayer: PrayerType, day: Date): boolean => {
    return getPrayersForDate(day).includes(prayer);
  };

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={goToToday}>
            Today
          </Button>
        </div>
        <h2 className="text-lg font-semibold">{formatWeekRange()}</h2>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3">
          <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{weekStats.prayed}</span>
          <span className="text-xs text-emerald-600/70 dark:text-emerald-400/70">Prayed</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
          <AlertCircle className="size-5 text-amber-600 dark:text-amber-400" />
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{weekStats.qazaa}</span>
          <span className="text-xs text-amber-600/70 dark:text-amber-400/70">Qazaa</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-3">
          <XCircle className="size-5 text-slate-400" />
          <span className="text-2xl font-bold text-slate-400">{weekStats.missed}</span>
          <span className="text-xs text-slate-400/70">Missed</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Weekly Progress</span>
          <span className="font-medium">{weekStats.rate}%</span>
        </div>
        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${weekStats.rate}%` }}
          />
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-8 bg-muted/50">
          <div className="p-3 font-medium text-sm border-r">Prayer</div>
          {days.map((day, i) => (
            <div
              key={i}
              className={cn(
                "p-3 text-center font-medium text-sm border-r last:border-r-0",
                isToday(day) && "bg-primary/10"
              )}
            >
              <div className="text-muted-foreground">{DAY_NAMES[i]}</div>
              <div className={cn(isToday(day) && "text-primary font-bold")}>
                {format(day, "d")}
              </div>
            </div>
          ))}
        </div>

        {/* Prayer Rows */}
        {allPrayersThisWeek.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No prayers found for this week.
          </div>
        ) : (
          allPrayersThisWeek.map((prayer) => {
            const Icon = PRAYER_ICONS[prayer];
            return (
              <div
                key={prayer}
                className="grid grid-cols-8 border-t first:border-t-0"
              >
                {/* Prayer Name Cell */}
                <div className="p-3 text-sm font-medium border-r flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="truncate">{getPrayerDisplayName(prayer)}</span>
                </div>

                {/* Day Cells */}
                {days.map((day, i) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const cellKey = `${prayer}-${dateKey}`;
                  const dayIsFuture = isFuture(startOfDay(day));
                  const prayerOnDay = isPrayerOnDay(prayer, day);

                  // Prayer doesn't occur on this day (e.g., Jumah only on Friday)
                  if (!prayerOnDay) {
                    return (
                      <div
                        key={i}
                        className="p-2 border-r last:border-r-0 bg-muted/20"
                      />
                    );
                  }

                  // Future dates - show as disabled
                  if (dayIsFuture) {
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

                  const status = getPrayerStatus(prayer, day);
                  const isLoading = loadingCells.has(cellKey);

                  return (
                    <div
                      key={i}
                      className={cn(
                        "p-2 border-r last:border-r-0 flex items-center justify-center",
                        isToday(day) && "bg-primary/5"
                      )}
                    >
                      <PrayerStatusCell
                        status={status}
                        onClick={() => handleToggle(prayer, day, status)}
                        disabled={dayIsFuture}
                        isLoading={isLoading}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-xs">
            ✓
          </div>
          <span>Prayed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
            ○
          </div>
          <span>Missed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xs">
            ⊙
          </div>
          <span>Qazaa</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-600 dark:text-sky-400 text-xs">
            ○
          </div>
          <span>Not Prayed (Qasr)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs">
            ⊙
          </div>
          <span>Qazaa (Qasr)</span>
        </div>
      </div>
    </div>
  );
}
