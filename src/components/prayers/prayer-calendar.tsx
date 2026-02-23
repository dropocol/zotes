"use client";

import * as React from "react";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, addMonths, subDays, addDays, subWeeks, addWeeks, subYears, addYears, isFuture, startOfDay } from "date-fns";
import { Moon } from "lucide-react";
import { DailyView } from "./daily-view";
import { WeeklyView } from "./weekly-view";
import { MonthlyView } from "./monthly-view";
import { YearlyView } from "./yearly-view";
import { ViewSwitcher } from "./view-switcher";
import { CalendarViewType, CalendarView, PrayerType, PrayerStatus } from "@/types/prayers";

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
  const [view, setView] = React.useState<CalendarViewType>(CalendarView.MONTHLY);
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const [selectedDay, setSelectedDay] = React.useState<Date>(new Date());
  const [records, setRecords] = React.useState<PrayerRecord[]>(initialRecords);

  // Fetch records when view/date changes
  React.useEffect(() => {
    fetchRecords();
  }, [currentDate, view]);

  const fetchRecords = async () => {
    try {
      let startDate: string;
      let endDate: string;

      switch (view) {
        case CalendarView.DAILY:
          startDate = format(currentDate, "yyyy-MM-dd");
          endDate = startDate;
          break;
        case CalendarView.WEEKLY:
          startDate = format(subDays(currentDate, 7), "yyyy-MM-dd");
          endDate = format(addDays(currentDate, 7), "yyyy-MM-dd");
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
        `/api/prayers?startDate=${startDate}&endDate=${endDate}`
      );

      if (response.ok) {
        const data = await response.json();
        setRecords(
          data.map((r: { date: string | Date; prayer: PrayerType; status: PrayerStatus; id: string }) => ({
            ...r,
            date: typeof r.date === "string" ? parseISO(r.date) : r.date,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching prayer records:", error);
    }
  };

  const handleStatusChange = async (
    date: Date,
    prayer: PrayerType,
    status: PrayerStatus
  ) => {
    // Prevent changing future dates
    if (isFuture(startOfDay(date))) {
      return;
    }

    try {
      const response = await fetch("/api/prayers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: format(date, "yyyy-MM-dd"),
          prayer,
          status,
        }),
      });

      if (response.ok) {
        // Update local state
        fetchRecords();
      }
    } catch (error) {
      console.error("Error updating prayer record:", error);
    }
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
          <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 shadow-lg shadow-indigo-500/25">
            <Moon className="size-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Prayer Tracker</h1>
            <p className="text-sm text-muted-foreground">Track your daily prayers</p>
          </div>
        </div>
        <ViewSwitcher view={view} onViewChange={setView} />
      </div>

      {/* Views */}
      <div className="rounded-xl bg-card border shadow-sm p-4 md:p-6">
        {view === CalendarView.DAILY && (
          <DailyView
            date={selectedDay}
            records={currentDayRecords}
            onDateChange={setSelectedDay}
            onStatusChange={(prayer, status) =>
              handleStatusChange(selectedDay, prayer, status)
            }
          />
        )}

        {view === CalendarView.WEEKLY && (
          <WeeklyView
            date={currentDate}
            records={recordsMapByDate}
            onDateChange={setCurrentDate}
            onStatusChange={handleStatusChange}
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
            onDateChange={setCurrentDate}
            onStatusChange={handleStatusChange}
            selectedDay={selectedDay}
            onDaySelect={setSelectedDay}
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
            onDateChange={setCurrentDate}
            onMonthClick={(month) => {
              setCurrentDate(month);
              setView(CalendarView.MONTHLY);
            }}
          />
        )}
      </div>
    </div>
  );
}
