// ============================================================================
// DATE UTILITY FUNCTIONS
// ============================================================================
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay as dateFnsIsSameDay,
  format,
  parseISO,
} from "date-fns";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Hour used for UTC date storage (noon UTC to avoid timezone edge cases) */
const NOON_HOUR = 12;

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

/**
 * Create a Date object set to noon UTC for a given year, month, day
 */
function createUTCDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day, NOON_HOUR, 0, 0, 0));
}

// ============================================================================
// TODAY FUNCTIONS
// ============================================================================

/**
 * Get today's date in the USER'S LOCAL TIMEZONE (for UI display)
 * Returns a Date object at LOCAL MIDNIGHT, which when passed to toUTCDate()
 * will correctly convert to the equivalent UTC date.
 *
 * Example: If user is in Pakistan (UTC+5) and it's Feb 28 locally,
 * this returns Feb 28 00:00:00 local time (which is Feb 27 19:00:00 UTC)
 * When toUTCDate() is called, it extracts UTC components and returns Feb 27 12:00:00 UTC
 */
export function getLocalToday(): Date {
  const now = new Date();
  // Return a date at local midnight (not noon UTC)
  // This ensures toUTCDate() extracts the correct UTC date components
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

/**
 * Get today's date in UTC (for server-side comparisons)
 * Returns a Date object set to noon UTC representing the UTC date
 *
 * Example: If it's Feb 27 22:00 UTC, this returns Feb 27 12:00:00 UTC
 */
export function getUTCToday(): Date {
  const now = new Date();
  return createUTCDate(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
}

// ============================================================================
// DATE CONVERSION FUNCTIONS
// ============================================================================

/**
 * Convert a LOCAL date to UTC for storage
 * Takes a date that represents a "local date" and converts it to UTC
 *
 * @param date - A date object (typically from a date picker in local time)
 * @returns A Date object set to noon UTC
 *
 * Example: User in Pakistan selects Feb 28 in date picker
 * Input: Date object representing Feb 28 00:00 local time
 * Output: Feb 28 12:00:00 UTC (so the item starts on Feb 28 UTC)
 */
export function localToUTC(date: Date | string): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  // Extract local date components and create UTC date
  return createUTCDate(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Convert a UTC date to local for display
 * Takes a date stored in UTC and returns a Date object representing that date in local time
 *
 * @param date - A UTC date from the database
 * @returns A Date object that when displayed shows the correct local date
 *
 * Note: Since we store dates at noon UTC, the Date object can be passed
 * directly to date-fns functions which will display it correctly in local time
 */
export function utcToLocal(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  // Normalize to noon UTC for consistent handling
  return createUTCDate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Normalize any date to noon UTC
 * This is the standard format for storing dates in the database
 *
 * @param date - Any date (local, UTC, or string)
 * @returns A Date object set to noon UTC
 */
export function toUTCDate(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : new Date(date);
  return createUTCDate(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Convert a local date to a comparable UTC date at noon
 * Extracts LOCAL components (not UTC) and creates a UTC date
 * Use this for dates that represent "local dates" like from date pickers
 *
 * @param date - A date representing a local date
 * @returns A Date object set to noon UTC with the same date components as the local date
 */
export function toComparableDate(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : new Date(date);
  // Extract LOCAL date components and create UTC date
  return createUTCDate(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Get date string in YYYY-MM-DD format (UTC)
 */
export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

// ============================================================================
// WEEK FUNCTIONS (UTC - for server-side)
// ============================================================================

/**
 * Get the start of the week (Sunday) for a given date (UTC)
 * Used for server-side comparisons
 */
export function getWeekStart(date: Date): Date {
  const d = toUTCDate(date);
  const start = startOfWeek(d, { weekStartsOn: 0 });
  return toUTCDate(start);
}

/**
 * Get the end of the week (Saturday) for a given date (UTC)
 * Used for server-side comparisons
 */
export function getWeekEnd(date: Date): Date {
  const d = toUTCDate(date);
  const end = endOfWeek(d, { weekStartsOn: 0 });
  return toUTCDate(end);
}

/**
 * Get all dates in a week (UTC)
 * Used for server-side comparisons
 */
export function getWeekDates(date: Date): Date[] {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);
  return eachDayOfInterval({ start, end }).map(toUTCDate);
}

/**
 * Get week range with buffer for server-side queries
 * Adds 2 days on each side to ensure we capture all data regardless of timezone
 * @param date - Reference date
 * @returns { start, end } - Date range with buffer
 */
export function getWeekRangeWithBuffer(date: Date): { start: Date; end: Date } {
  const start = getWeekStart(date);
  const end = getWeekEnd(date);

  // Add 2 days buffer on each side to cover all timezones (UTC-12 to UTC+14)
  const bufferedStart = new Date(start);
  bufferedStart.setUTCDate(bufferedStart.getUTCDate() - 2);

  const bufferedEnd = new Date(end);
  bufferedEnd.setUTCDate(bufferedEnd.getUTCDate() + 2);

  return { start: bufferedStart, end: bufferedEnd };
}

// ============================================================================
// WEEK FUNCTIONS (LOCAL TIME - for UI display)
// ============================================================================

/**
 * Get the start of the week (Sunday) in LOCAL TIME for UI display
 * @param date - Any date (will be interpreted in local time)
 * @returns Date at local midnight for the start of the week
 */
export function getLocalWeekStart(date: Date): Date {
  // Ensure we're working with a date at local midnight
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  return startOfWeek(d, { weekStartsOn: 0 });
}

/**
 * Get the end of the week (Saturday) in LOCAL TIME for UI display
 * @param date - Any date (will be interpreted in local time)
 * @returns Date at local midnight for the end of the week
 */
export function getLocalWeekEnd(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  return endOfWeek(d, { weekStartsOn: 0 });
}

/**
 * Get all dates in a week in LOCAL TIME for UI display
 * @param date - Any date (will be interpreted in local time)
 * @returns Array of 7 dates at local midnight (Sun-Sat)
 */
export function getLocalWeekDates(date: Date): Date[] {
  const start = getLocalWeekStart(date);
  const end = getLocalWeekEnd(date);
  return eachDayOfInterval({ start, end });
}

// ============================================================================
// DATE COMPARISON FUNCTIONS
// ============================================================================

/**
 * Check if two dates are the same day (UTC comparison)
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  const d1 = toUTCDate(date1);
  const d2 = toUTCDate(date2);
  return dateFnsIsSameDay(d1, d2);
}

/**
 * Check if a date is in the future (after today in local time)
 * Converts UTC dates to local before comparing
 */
export function isFutureDate(date: Date | string): boolean {
  const today = getLocalToday();
  // Parse the date (could be UTC string or Date)
  const d = typeof date === "string" ? new Date(date) : date;
  // Convert to local midnight for comparison
  const checkLocalMidnight = new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    0, 0, 0, 0
  );
  return checkLocalMidnight > today;
}

/**
 * Check if a date is before today (overdue check in local time)
 * Compares date portions only, not times
 */
export function isDateBeforeToday(date: Date | string): boolean {
  const today = getLocalToday();
  const checkDate = new Date(date);
  const checkLocalMidnight = new Date(
    checkDate.getFullYear(),
    checkDate.getMonth(),
    checkDate.getDate(),
    0, 0, 0, 0
  );
  return checkLocalMidnight < today;
}

/**
 * Check if a date is today (in local time)
 */
export function isDateToday(date: Date | string): boolean {
  const today = getLocalToday();
  const checkDate = new Date(date);
  const checkLocalMidnight = new Date(
    checkDate.getFullYear(),
    checkDate.getMonth(),
    checkDate.getDate(),
    0, 0, 0, 0
  );
  return checkLocalMidnight.getTime() === today.getTime();
}

/**
 * Check if a date is tomorrow (in local time)
 */
export function isDateTomorrow(date: Date | string): boolean {
  const today = getLocalToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const checkDate = new Date(date);
  const checkLocalMidnight = new Date(
    checkDate.getFullYear(),
    checkDate.getMonth(),
    checkDate.getDate(),
    0, 0, 0, 0
  );
  return checkLocalMidnight.getTime() === tomorrow.getTime();
}

// ============================================================================
// LEGACY ALIASES (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use getLocalToday() for UI display or getUTCToday() for server comparisons
 */
export function getTodayDate(): Date {
  return getLocalToday();
}

/**
 * @deprecated Use getUTCToday() for server-side comparisons
 */
export function getTodayDateUTC(): Date {
  return getUTCToday();
}
