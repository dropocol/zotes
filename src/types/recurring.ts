// ============================================================================
// RECURRING TODO TYPES
// ============================================================================

import { isBefore, isAfter } from "date-fns";
import { toUTCDate, isSameDay } from "@/utils/date";

export enum RecurringFrequency {
  DAILY = "DAILY",
  WEEKLY = "WEEKLY",
  MONTHLY = "MONTHLY",
  CUSTOM = "CUSTOM",
}

export enum RecurringCompletionStatus {
  TODO = "todo",
  DONE = "done",
  SKIPPED = "skipped",
}

export interface RecurringCompletion {
  id: string;
  date: Date | string;
  status: RecurringCompletionStatus | string;
  todoItemId: string;
  userId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RecurringTodoItem {
  id: string;
  title: string;
  notes?: string | null;
  status: string;
  priority: string;
  dueDate?: Date | string | null;
  userId: string;
  isRecurring: boolean;
  frequency?: RecurringFrequency | string | null;
  daysOfWeek?: number[] | null;
  recurrenceStart?: Date | string | null;
  recurrenceEnd?: Date | string | null;
  completions?: RecurringCompletion[];
}

// ============================================================================
// RECURRING HELPER FUNCTIONS
// ============================================================================

/**
 * Parse daysOfWeek from JSON string to array
 */
export function parseDaysOfWeek(daysOfWeek: string | null | undefined): number[] {
  if (!daysOfWeek) return [];
  try {
    return JSON.parse(daysOfWeek);
  } catch {
    return [];
  }
}

/**
 * Convert daysOfWeek array to JSON string
 */
export function serializeDaysOfWeek(days: number[]): string {
  return JSON.stringify(days.sort((a, b) => a - b));
}

/**
 * Get day names from day numbers (0 = Sunday, 6 = Saturday)
 */
export function getDayNames(days: number[]): string[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.map((d) => dayNames[d] || "");
}

/**
 * Check if a recurring item should appear on a specific date (UTC comparison)
 */
export function shouldAppearOnDate(
  item: {
    frequency?: string | null;
    daysOfWeek?: string | null;
    recurrenceStart?: Date | string | null;
    recurrenceEnd?: Date | string | null;
  },
  date: Date
): boolean {
  // Normalize the input date to UTC
  const checkDate = toUTCDate(date);

  // Check if within recurrence range
  if (item.recurrenceStart) {
    const start = toUTCDate(item.recurrenceStart);
    if (isBefore(checkDate, start) && !isSameDay(checkDate, start)) {
      return false;
    }
  }

  if (item.recurrenceEnd) {
    const end = toUTCDate(item.recurrenceEnd);
    if (isAfter(checkDate, end) && !isSameDay(checkDate, end)) {
      return false;
    }
  }

  const dayOfWeek = checkDate.getUTCDay();

  switch (item.frequency) {
    case RecurringFrequency.DAILY:
      return true;
    case RecurringFrequency.WEEKLY:
      const days = parseDaysOfWeek(item.daysOfWeek);
      return days.includes(dayOfWeek);
    case RecurringFrequency.MONTHLY:
      // For monthly, we use the day from recurrenceStart
      if (item.recurrenceStart) {
        const startDay = toUTCDate(item.recurrenceStart).getUTCDate();
        return checkDate.getUTCDate() === startDay;
      }
      return false;
    case RecurringFrequency.CUSTOM:
      return parseDaysOfWeek(item.daysOfWeek).includes(dayOfWeek);
    default:
      return false;
  }
}

/**
 * Get completion status for a specific date
 */
export function getCompletionForDate(
  completions: RecurringCompletion[],
  date: Date
): RecurringCompletion | undefined {
  return completions.find((c) => isSameDay(c.date, date));
}
