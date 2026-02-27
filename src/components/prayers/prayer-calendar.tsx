"use client";

import * as React from "react";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subYears,
  addYears,
  isFuture,
  startOfDay,
} from "date-fns";
import { Moon } from "lucide-react";
import { DailyView } from "./daily-view";
import { WeeklyView } from "./weekly-view";
import { MonthlyView } from "./monthly-view";
import { YearlyView } from "./yearly-view";
import { ViewSwitcher } from "./view-switcher";
import {
  CalendarViewType,
  CalendarView,
  PrayerType,
  PrayerStatus,
} from "@/types/prayers";

interface PrayerRecord {
  id: string;
  date: Date;
  prayer: PrayerType;
  status: PrayerStatus;
}

interface PrayerCalendarProps {
  initialRecords?: PrayerRecord[];
}

export function PrayerCalendar({ initialRecords = [] }: PrayerCalendarProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  // Read initial state from URL params
  const getViewFromParams = (): CalendarViewType => {
    const viewParam = searchParams.get("view");
    if (
      viewParam &&
      Object.values(CalendarView).includes(viewParam as CalendarViewType)
    ) {
      return viewParam as CalendarViewType;
    }
    return CalendarView.MONTHLY;
  };

  const getDateFromParams = (param: string, fallback: Date): Date => {
    const dateParam = searchParams.get(param);
    if (dateParam) {
      try {
        return parseISO(dateParam);
      } catch {
        return fallback;
      }
    }
    return fallback;
  };

  const [view, setView] = React.useState<CalendarViewType>(getViewFromParams);
  const [currentDate, setCurrentDate] = React.useState<Date>(() =>
    getDateFromParams("month", new Date()),
  );
  const [selectedDay, setSelectedDay] = React.useState<Date>(() =>
    getDateFromParams("day", new Date()),
  );
  const [records, setRecords] = React.useState<PrayerRecord[]>(initialRecords);

  // Fetch records function
  const fetchRecords = React.useCallback(async () => {
    try {
      let startDate: string;
      let endDate: string;

      switch (view) {
        case CalendarView.DAILY:
          startDate = format(selectedDay, "yyyy-MM-dd");
          endDate = startDate;
          break;
        case CalendarView.WEEKLY:
          startDate = format(
            startOfWeek(currentDate, { weekStartsOn: 0 }),
            "yyyy-MM-dd",
          );
          endDate = format(
            endOfWeek(currentDate, { weekStartsOn: 0 }),
            "yyyy-MM-dd",
          );
          break;
        case CalendarView.MONTHLY:
          startDate = format(startOfMonth(currentDate), "yyyy-MM-dd");
          endDate = format(endOfMonth(currentDate), "yyyy-MM-dd");
          break;
        case CalendarView.YEARLY:
          startDate = format(subYears(currentDate, 1), "yyyy-MM-dd");
          endDate = format(addYears(currentDate, 1), "yyyy-MM-dd");
          break;
        default:
          startDate = format(startOfMonth(currentDate), "yyyy-MM-dd");
          endDate = format(endOfMonth(currentDate), "yyyy-MM-dd");
      }

      const response = await fetch(
        `/api/prayers?startDate=${startDate}&endDate=${endDate}`,
      );

      if (response.ok) {
        const data = await response.json();
        setRecords(
          data.map(
            (r: {
              date: string | Date;
              prayer: PrayerType;
              status: PrayerStatus;
              id: string;
            }) => ({
              ...r,
              // Parse date as noon UTC to avoid timezone day-shifting issues
              // Handle both "2026-02-26" and "2026-02-26T00:00:00.000Z" formats
              date:
                typeof r.date === "string"
                  ? new Date(r.date.split("T")[0] + "T12:00:00Z")
                  : r.date,
            }),
          ),
        );
      }
    } catch (error) {
      console.error("Error fetching prayer records:", error);
    }
  }, [currentDate, view, selectedDay]);

  // Update URL when state changes
  const updateUrl = React.useCallback(
    (newView: CalendarViewType, newMonth: Date, newDay: Date) => {
      const params = new URLSearchParams();
      params.set("view", newView);
      params.set("month", format(newMonth, "yyyy-MM-dd"));
      params.set("day", format(newDay, "yyyy-MM-dd"));
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router],
  );

  // Fetch records when view/date changes
  React.useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Update URL when state changes
  React.useEffect(() => {
    updateUrl(view, currentDate, selectedDay);
  }, [view, currentDate, selectedDay, updateUrl]);

  const handleStatusChange = async (
    date: Date,
    prayer: PrayerType,
    status: PrayerStatus,
  ) => {
    // Prevent changing future dates
    if (isFuture(startOfDay(date))) {
      return;
    }

    const dateKey = format(date, "yyyy-MM-dd");

    // Optimistic update - immediately update local state
    setRecords((prevRecords) => {
      // Check if record exists for this date/prayer
      const existingIndex = prevRecords.findIndex(
        (r) => format(r.date, "yyyy-MM-dd") === dateKey && r.prayer === prayer,
      );

      if (existingIndex >= 0) {
        // Update existing record
        const updated = [...prevRecords];
        updated[existingIndex] = { ...updated[existingIndex], status };
        return updated;
      } else {
        // Add new record
        return [
          ...prevRecords,
          {
            id: `temp-${Date.now()}`,
            date,
            prayer,
            status,
          },
        ];
      }
    });

    // Send to server in background
    try {
      const response = await fetch("/api/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey,
          prayer,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(
          "Failed to update prayer record:",
          response.status,
          errorData,
        );
        // On error, revert by re-fetching
        fetchRecords();
      }
    } catch (error) {
      console.error("Error updating prayer record:", error);
      // On error, revert by re-fetching
      fetchRecords();
    }
  };

  const handleViewChange = (newView: CalendarViewType) => {
    setView(newView);
  };

  const handleDateChange = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleDaySelect = (day: Date) => {
    setSelectedDay(day);
  };

  const handleMonthClick = (month: Date) => {
    setCurrentDate(month);
    setView(CalendarView.MONTHLY);
  };

  // Convert records to map format for views
  const recordsMapByDate = React.useMemo(() => {
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

  // Get records for current day (daily view)
  const currentDateKey = format(selectedDay, "yyyy-MM-dd");
  const currentDayRecords = recordsMapByDate.get(currentDateKey) || new Map();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 p-2.5 shadow-lg shadow-indigo-500/25">
            <Moon className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Prayer Tracker
            </h1>
            <p className="text-sm text-muted-foreground">
              Track your daily prayers
            </p>
          </div>
        </div>
        <ViewSwitcher view={view} onViewChange={handleViewChange} />
      </div>

      {/* Views */}
      <div className="rounded-xl bg-card border shadow-sm p-4 md:p-6">
        {view === CalendarView.DAILY && (
          <DailyView
            date={selectedDay}
            records={currentDayRecords}
            onDateChange={handleDaySelect}
            onStatusChange={(prayer, status) =>
              handleStatusChange(selectedDay, prayer, status)
            }
          />
        )}

        {view === CalendarView.WEEKLY && (
          <WeeklyView
            date={currentDate}
            records={recordsMapByDate}
            onDateChange={handleDateChange}
            onStatusChange={handleStatusChange}
            selectedDay={selectedDay}
            onDaySelect={handleDaySelect}
          />
        )}

        {view === CalendarView.MONTHLY && (
          <MonthlyView
            date={currentDate}
            records={records.map((r) => ({
              date: r.date,
              prayer: r.prayer,
              status: r.status,
            }))}
            onDateChange={handleDateChange}
            onStatusChange={handleStatusChange}
            selectedDay={selectedDay}
            onDaySelect={handleDaySelect}
          />
        )}

        {view === CalendarView.YEARLY && (
          <YearlyView
            date={currentDate}
            records={records.map((r) => ({
              date: r.date,
              prayer: r.prayer,
              status: r.status,
            }))}
            onDateChange={handleDateChange}
            onMonthClick={handleMonthClick}
          />
        )}
      </div>
    </div>
  );
}
