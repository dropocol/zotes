"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Repeat, CalendarIcon, Loader2, X, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  RecurringFrequency,
  parseDaysOfWeek,
  serializeDaysOfWeek,
  getTodayDate,
  toUTCDate,
  isFutureDate,
  isSameDay,
} from "@/types/recurring";

interface RecurringSettingsDialogProps {
  todoItem: {
    id: string;
    isRecurring?: boolean;
    frequency?: string | null;
    daysOfWeek?: string | null;
    recurrenceStart?: Date | string | null;
    recurrenceEnd?: Date | string | null;
  };
  onUpdate: (data: {
    isRecurring: boolean;
    frequency: string | null;
    daysOfWeek: string | null;
    recurrenceStart: Date | null;
    recurrenceEnd: Date | null;
  }) => Promise<void>;
  trigger?: React.ReactNode;
}

const DAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export function RecurringSettingsDialog({
  todoItem,
  onUpdate,
  trigger,
}: RecurringSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<RecurringFrequency>(RecurringFrequency.DAILY);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [recurrenceStart, setRecurrenceStart] = useState<Date | undefined>();
  const [recurrenceEnd, setRecurrenceEnd] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [wasRecurring, setWasRecurring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize today's date to prevent infinite loops
  const today = useMemo(() => getTodayDate(), []);

  useEffect(() => {
    if (todoItem) {
      const isCurrentlyRecurring = todoItem.isRecurring || false;
      setIsRecurring(isCurrentlyRecurring);
      setWasRecurring(isCurrentlyRecurring);
      setFrequency((todoItem.frequency as RecurringFrequency) || RecurringFrequency.DAILY);
      setSelectedDays(parseDaysOfWeek(todoItem.daysOfWeek));
      setError(null);

      // For existing recurring items, use stored dates
      // For new ones, default start to today and end to undefined (no end)
      if (isCurrentlyRecurring && todoItem.recurrenceStart) {
        setRecurrenceStart(toUTCDate(todoItem.recurrenceStart));
      } else {
        setRecurrenceStart(today);
      }

      if (isCurrentlyRecurring && todoItem.recurrenceEnd) {
        setRecurrenceEnd(toUTCDate(todoItem.recurrenceEnd));
      } else {
        setRecurrenceEnd(undefined);
      }
    }
  }, [todoItem, today]);

  // When enabling recurrence for the first time, always set start to today
  useEffect(() => {
    if (isRecurring && !wasRecurring) {
      setRecurrenceStart(today);
      setRecurrenceEnd(undefined);
    }
  }, [isRecurring, wasRecurring, today]);

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    setError(null);

    // Validation
    if (isRecurring) {
      const startDate = toUTCDate(recurrenceStart || today);

      // Check if start date is in the past (warning, not error)
      if (startDate < today && !isSameDay(startDate, today)) {
        // Allow it but this might be intentional for historical tracking
      }

      // End date validation
      if (recurrenceEnd) {
        const endDate = toUTCDate(recurrenceEnd);

        // End date must be >= start date
        if (endDate < startDate && !isSameDay(endDate, startDate)) {
          setError("End date must be on or after the start date");
          return;
        }

        // End date must be >= today
        if (endDate < today && !isSameDay(endDate, today)) {
          setError("End date cannot be before today");
          return;
        }
      }
    }

    setIsLoading(true);
    try {
      // Use UTC dates to avoid timezone issues
      const startDate = isRecurring ? toUTCDate(recurrenceStart || today) : null;
      const endDate = isRecurring && recurrenceEnd ? toUTCDate(recurrenceEnd) : null;

      await onUpdate({
        isRecurring,
        frequency: isRecurring ? frequency : null,
        daysOfWeek:
          isRecurring && (frequency === RecurringFrequency.WEEKLY || frequency === RecurringFrequency.CUSTOM)
            ? serializeDaysOfWeek(selectedDays)
            : null,
        recurrenceStart: startDate,
        recurrenceEnd: endDate,
      });
      setOpen(false);
    } catch (error) {
      console.error("Error updating recurrence settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearEndDate = () => {
    setRecurrenceEnd(undefined);
  };

  const showDayPicker = frequency === RecurringFrequency.WEEKLY || frequency === RecurringFrequency.CUSTOM;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Repeat className="h-4 w-4" />
            Recurring
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Recurring Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Enable Recurring Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="recurring-toggle" className="font-medium">
              Make this task recurring
            </Label>
            <Switch
              id="recurring-toggle"
              checked={isRecurring}
              onCheckedChange={setIsRecurring}
            />
          </div>

          {isRecurring && (
            <>
              {/* Frequency Selection */}
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select
                  value={frequency}
                  onValueChange={(value) => setFrequency(value as RecurringFrequency)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={RecurringFrequency.DAILY}>Daily</SelectItem>
                    <SelectItem value={RecurringFrequency.WEEKLY}>Weekly</SelectItem>
                    <SelectItem value={RecurringFrequency.MONTHLY}>Monthly</SelectItem>
                    <SelectItem value={RecurringFrequency.CUSTOM}>Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Day Selection for Weekly/Custom */}
              {showDayPicker && (
                <div className="space-y-2">
                  <Label>Days</Label>
                  <div className="flex gap-1 flex-wrap">
                    {DAYS.map((day) => (
                      <button
                        key={day.value}
                        onClick={() => toggleDay(day.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                          selectedDays.includes(day.value)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        )}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Start Date */}
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start font-normal",
                        !recurrenceStart && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {recurrenceStart ? format(recurrenceStart, "PPP") : "Today"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={recurrenceStart}
                      onSelect={setRecurrenceStart}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Task will start appearing from this date. Defaults to today.
                </p>
              </div>

              {/* End Date (Optional) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>End Date (Optional)</Label>
                  {recurrenceEnd && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs text-muted-foreground"
                      onClick={clearEndDate}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start font-normal",
                        !recurrenceEnd && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {recurrenceEnd ? format(recurrenceEnd, "PPP") : "No end date (repeats forever)"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={recurrenceEnd}
                      onSelect={setRecurrenceEnd}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Leave empty for ongoing tasks. Set a date only if you want the task to stop repeating.
                </p>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setError(null);
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading} className="flex-1">
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
