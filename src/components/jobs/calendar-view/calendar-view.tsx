"use client";

import * as React from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight, Clock, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getInterviewTypeDisplayName } from "@/types/jobs";
import type { JobInterview, JobApplication } from "@prisma/client";

interface InterviewWithJob extends JobInterview {
  jobApplication: Pick<JobApplication, "jobTitle" | "companyName">;
}

interface CalendarViewProps {
  interviews: InterviewWithJob[];
  onInterviewClick?: (interview: InterviewWithJob) => void;
}

export function CalendarView({ interviews, onInterviewClick }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);

  // Get interviews for the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  // Group interviews by date
  const interviewsByDate = React.useMemo(() => {
    const map = new Map<string, InterviewWithJob[]>();

    interviews.forEach((interview) => {
      if (interview.scheduledAt) {
        const dateKey = format(new Date(interview.scheduledAt), "yyyy-MM-dd");
        if (!map.has(dateKey)) {
          map.set(dateKey, []);
        }
        map.get(dateKey)!.push(interview);
      }
    });

    return map;
  }, [interviews]);

  // Generate calendar days
  const days: Date[] = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  // Get interviews for selected date
  const selectedDateInterviews = selectedDate
    ? interviewsByDate.get(format(selectedDate, "yyyy-MM-dd")) || []
    : [];

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Calendar Grid */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date())}
            >
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date) => {
            const dateKey = format(date, "yyyy-MM-dd");
            const dayInterviews = interviewsByDate.get(dateKey) || [];
            const isSelected = selectedDate && isSameDay(date, selectedDate);
            const isCurrentMonth = isSameMonth(date, currentMonth);

            return (
              <div
                key={dateKey}
                className={cn(
                  "min-h-[80px] p-1 rounded-lg border cursor-pointer transition-colors",
                  isCurrentMonth ? "bg-background" : "bg-muted/50",
                  isSelected && "ring-2 ring-primary",
                  isToday(date) && "border-primary",
                  "hover:bg-muted/50"
                )}
                onClick={() => setSelectedDate(date)}
              >
                <div
                  className={cn(
                    "text-sm font-medium mb-1",
                    !isCurrentMonth && "text-muted-foreground"
                  )}
                >
                  {format(date, "d")}
                </div>
                {dayInterviews.length > 0 && (
                  <div className="space-y-1">
                    {dayInterviews.slice(0, 2).map((interview) => (
                      <div
                        key={interview.id}
                        className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary truncate"
                        onClick={(e) => {
                          e.stopPropagation();
                          onInterviewClick?.(interview);
                        }}
                      >
                        {interview.jobApplication.companyName}
                      </div>
                    ))}
                    {dayInterviews.length > 2 && (
                      <div className="text-xs text-muted-foreground px-1">
                        +{dayInterviews.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details */}
      <div className="lg:w-80 border rounded-lg p-4">
        <h3 className="font-semibold mb-4">
          {selectedDate
            ? format(selectedDate, "EEEE, MMMM d, yyyy")
            : "Select a date"}
        </h3>

        {selectedDate && selectedDateInterviews.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No interviews scheduled for this day.
          </p>
        )}

        {selectedDateInterviews.length > 0 && (
          <div className="space-y-3">
            {selectedDateInterviews.map((interview) => (
              <div
                key={interview.id}
                className="p-3 rounded-lg border bg-card cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => onInterviewClick?.(interview)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm">
                      {interview.jobApplication.jobTitle}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {interview.jobApplication.companyName}
                    </div>
                  </div>
                  <Badge variant="outline">
                    Round {interview.roundNumber}
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {format(new Date(interview.scheduledAt!), "h:mm a")}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary" className="text-xs">
                      {getInterviewTypeDisplayName(interview.interviewType)}
                    </Badge>
                  </div>
                  {interview.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {interview.location}
                    </div>
                  )}
                  {interview.interviewerNames && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="size-3" />
                      {interview.interviewerNames}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
