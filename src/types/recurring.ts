// ============================================================================
// RECURRING TODO TYPES
// ============================================================================

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
// HELPER FUNCTIONS
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
 * Check if a recurring item should appear on a specific date
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
    if (checkDate < start) return false;
  }

  if (item.recurrenceEnd) {
    const end = toUTCDate(item.recurrenceEnd);
    if (checkDate > end) return false;
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
 * Get the start of the week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  // Create date at start of week in UTC
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day, 0, 0, 0));
}

/**
 * Get the end of the week (Saturday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const d = getWeekStart(date);
  // Add 6 days to get to Saturday
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 6, 23, 59, 59));
}

/**
 * Get all dates in a week
 */
export function getWeekDates(date: Date): Date[] {
  const start = getWeekStart(date);
  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    // Add days using UTC methods
    dates.push(new Date(Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate() + i,
      12, 0, 0
    )));
  }
  return dates;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return (
    d1.getUTCFullYear() === d2.getUTCFullYear() &&
    d1.getUTCMonth() === d2.getUTCMonth() &&
    d1.getUTCDate() === d2.getUTCDate()
  );
}

/**
 * Check if a date is in the future (after today)
 */
export function isFutureDate(date: Date | string): boolean {
  const today = getTodayDate();
  const checkDate = toUTCDate(date);
  return checkDate > today;
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

/**
 * Get today's date as a Date object set to noon UTC
 * This avoids timezone issues when storing/retrieving dates
 */
export function getTodayDate(): Date {
  const now = new Date();
  // Create date at noon UTC to avoid timezone shifts
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0));
}

/**
 * Convert any date to a UTC date at noon (for consistent date handling)
 */
export function toUTCDate(date: Date | string): Date {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12, 0, 0));
}

/**
 * Get date string in YYYY-MM-DD format
 */
export function toDateString(date: Date): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}
